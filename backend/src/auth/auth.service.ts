import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PgService } from '../db/pg.service';
import type { IUser } from '../user/user.model';
import type { IProfile } from 'src/profile/profile.model';
// import type { IUserProfile } from './auth.model';
import { UserService } from '../user/user.service';
import { ProfileService } from 'src/profile/profile.service';
import { SessionService } from 'src/session/session.service';
import { TokenService } from 'src/token/token.service';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly pgService: PgService,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Register a new user
   * @param email - The email of the user
   * @param password - The password of the user
   * @returns The user
   */
  async registerTx(dto: RegisterDto) {
    const {
      email,
      password,
      first_name,
      last_name,
      middle_name,
      phone,
      birthday,
      gender,
      locale,
      timezone,
    } = dto;

    // 1. Check if email already exists
    const existing = await this.userService.findByEmail(email);

    if (existing) {
      throw new ConflictException('User already exists');
    }

    // 2. Hash password
    const password_hash = await bcrypt.hash(password, 10);
    const client = await this.pgService.getClient();
    let user: IUser;
    let profile: IProfile;

    // 3. Start transaction
    try {
      await client.query('BEGIN');

      // 4. Create user
      user = await this.userService.create(client, email, password_hash);
      if (!user) {
        throw new Error('Failed to create user');
      }

      // 5. Create profile
      profile = await this.profileService.create(client, user.id, {
        first_name,
        last_name,
        middle_name,
        phone,
        birthday,
        gender,
        locale,
        timezone,
      });
      if (!profile) {
        throw new Error('Failed to create profile');
      }

      await client.query('COMMIT');
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // 6. Return user
    return {
      statusCode: 201,
      message: 'User created successfully',
    };
  }

  /**
   * Login: validate user → session check/create → tokens → set cookies, return user+profile.
   */
  async loginTx(dto: LoginDto, ip: string, user_agent: string, res: Response) {
    const { email, password } = dto;

    // 1. Find user
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Validate password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Find profile
    const profile = await this.profileService.findByUserId(user.id);
    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    const client = await this.pgService.getClient();
    try {
      await client.query('BEGIN');

      // 4. Create or update session
      const session = await this.sessionService.check(
        client,
        user.id,
        ip,
        user_agent,
      );
      if (!session) {
        throw new Error('Failed to create session');
      }

      // 5. Create or update token pair
      const { access_token, refresh_token } = await this.tokenService.create(
        client,
        user.id,
        session.id,
      );

      await client.query('COMMIT');

      // 6. Set tokens in httpOnly cookies
      const isProduction = process.env.NODE_ENV === 'production';
      const accessMaxAge = 15 * 60 * 1000; // 15 min
      const refreshMaxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax' as const,
      };
      res.cookie('access_token', access_token, {
        ...cookieOptions,
        maxAge: accessMaxAge,
      });
      res.cookie('refresh_token', refresh_token, {
        ...cookieOptions,
        maxAge: refreshMaxAge,
      });

      // 7. Return one object (user + profile) for localStorage / globalState
      return {
        statusCode: 200,
        message: 'User successfully logged in',
        data: {
          ...user,
          profile,
        },
      };
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async profile(user_id: string) {
    const user = await this.userService.findById(user_id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateProfileTx(user_id: number, dto: UpdateProfileDto) {
    const profile = await this.profileService.findByUserId(user_id);
    if (!profile) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userService.findById(String(user_id));
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payload: UpdateProfileDto = {};
    for (const [key, value] of Object.entries(dto)) {
      if (typeof value !== 'string') {
        continue;
      }

      const normalized = value.trim();
      if (normalized.length > 0) {
        payload[key as keyof UpdateProfileDto] = normalized;
      }
    }

    const nextProfile =
      Object.keys(payload).length > 0
        ? await this.profileService.updateByUserId(user_id, payload)
        : profile;

    if (!nextProfile) {
      throw new NotFoundException('User not found');
    }

    return {
      statusCode: 200,
      message: 'Profile updated successfully',
      data: {
        ...user,
        profile: nextProfile,
      },
    };
  }

  async logoutTx(
    user_id: number,
    session_id: number,
    refresh_token: string,
    res: Response,
  ) {
    const client = await this.pgService.getClient();

    try {
      await client.query('BEGIN');

      const tokenRevoked = await this.tokenService.revokeByPair(
        client,
        user_id,
        session_id,
        refresh_token,
      );
      if (!tokenRevoked) {
        throw new UnauthorizedException('Refresh token is not active');
      }

      const sessionClosed = await this.sessionService.deactivate(
        client,
        user_id,
        session_id,
      );
      if (!sessionClosed) {
        throw new UnauthorizedException('Session is not active');
      }

      await client.query('COMMIT');
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);

    return {
      statusCode: 200,
      message: 'User successfully logged out',
      data: {
        user_id,
        session_id,
      },
    };
  }
}
