import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PgService } from '../db/pg.service';
import type { IUser } from '../user/user.model';
import { UserService } from '../user/user.service';
import { ProfileService } from 'src/profile/profile.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly pgService: PgService,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
  ) {}

  /**
   * Login a user
   * @param email - The email of the user
   * @param password - The password of the user
   * @returns The user
   */
  async login(email: string, password: string) {
    // find user
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // validate password
    if (user.password_hash) {
      const password_valid = await bcrypt.compare(password, user.password_hash);
      if (!password_valid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // find profile
    const profile = await this.profileService.findByUserId(user.id);

    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    // create access and refresh tokens
    const access_token = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
    });
    const refresh_token = await this.jwtService.signAsync({
      id: user.id,
      email: user.email,
    });

    // update in db

    // set to cookies
    // res.cookie('access_token', access_token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   maxAge: 15 * 60 * 1000, // 15 minutes
    // });
    // res.cookie('refresh_token', refresh_token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    // });

    return {
      user,
      access_token,
      refresh_token,
    };
  }

  /**
   * Register a new user
   * @param email - The email of the user
   * @param password - The password of the user
   * @returns The user
   */
  async registerTx(email: string, password: string) {
    const existing = await this.userService.findByEmail(email);

    if (existing) {
      throw new ConflictException('User already exists');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const client = await this.pgService.getClient();
    let user: IUser | null = null;

    try {
      await client.query('BEGIN');

      user = await this.userService.create(client, email, password_hash);
      if (!user) {
        throw new Error('Failed to create user');
      }

      await client.query('COMMIT');
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return user;
  }

  async profile(user_id: string, access_token: string) {
    const user = await this.userService.findById(user_id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.access_token = access_token;

    return user;
  }
}
