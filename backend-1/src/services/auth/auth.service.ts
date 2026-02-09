import * as jwt from 'jsonwebtoken';
import { db } from '@services';
import { logger } from '@services';
import { normalizeError } from '@helpers';
import { CryptoHelper } from '@helpers';
import { UserRepository, SessionRepository } from '@repositories';
import type { UserWithProfile } from '@repositories';

interface RegistrationData {
  email: string;
  first_name: string;
  password: string;
  gender: string;
  locale: string;
  timezone: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  birthday?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: number;
  email?: string;
  tokenId?: number;
}

export const AuthService = {
  async register(
    data: RegistrationData,
  ): Promise<{ user: UserWithProfile | null }> {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const passwordHash = await CryptoHelper.hashPassword(data.password);

      const userId = await UserRepository.createUser(client, {
        email: data.email,
        passwordHash,
      });

      await UserRepository.createProfile(client, userId, {
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name,
        phone: data.phone,
        birthday: data.birthday,
        gender: data.gender,
        locale: data.locale,
        timezone: data.timezone,
      });

      await client.query('COMMIT');

      const user = await UserRepository.getUserWithProfile(userId);
      return { user };
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const message = normalizeError(error);
      logger.error(`Registration failed ${message}`);
      throw error;
    } finally {
      client.release();
    }
  },

  async login(
    data: LoginData,
    ipAddress: string,
    userAgent: string | undefined,
  ): Promise<{
    user: UserWithProfile | null;
    accessToken: string;
    refreshToken: string;
  }> {
    const client = await db.connect();

    try {
      await client.query('BEGIN');
      const emailHash = await CryptoHelper.hashEmail(data.email);
      const user = await UserRepository.findByEmailHash(emailHash);

      // check
      // Если ошибка вышла, то она должна быть для фронта, чтобы вывести пользователю
      if (!user) {
        // Данный email не зарегистрирован
        throw new Error('Invalid email or password');
      }

      if (!user.is_active) {
        throw new Error('User account is inactive');
      }

      const isPasswordValid = await CryptoHelper.comparePassword(
        data.password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // find exists session
      // if exists update fields entries +1

      const sessionId = await SessionRepository.createSession(
        client,
        user.id,
        ipAddress,
        userAgent || null,
      );

      // вынести нахуй
      const tokens = this.generateTokens(user.id, data.email, sessionId);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await SessionRepository.saveRefreshToken(
        user.id,
        tokens.refreshToken,
        expiresAt,
      );

      await client.query('COMMIT');

      const userData = await UserRepository.getUserWithProfile(user.id);

      return {
        user: userData,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const message = normalizeError(error);
      logger.error('Login failed', { error: message });
      throw error;
    } finally {
      client.release();
    }
  },

  async logout(userId: number, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        SessionRepository.deactivateUserSessions(userId),
        SessionRepository.revokeRefreshToken(refreshToken),
      ]);
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Logout failed', { error: message });
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<{
    user: UserWithProfile | null;
    accessToken: string;
    refreshToken?: string;
  }> {
    try {
      const token = await SessionRepository.findRefreshToken(refreshToken);

      if (!token) {
        throw new Error('TOKEN_MISMATCH');
      }

      if (token.revoked_at) {
        throw new Error('Refresh token has been revoked');
      }

      const userMeta = await UserRepository.getUserForRefresh(token.user_id);

      if (!userMeta) {
        throw new Error('User not found');
      }

      if (!userMeta.is_active) {
        throw new Error('User account is inactive');
      }

      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
      if (!jwtRefreshSecret) {
        throw new Error('JWT_REFRESH_SECRET environment variable is not set');
      }

      try {
        jwt.verify(refreshToken, jwtRefreshSecret) as TokenPayload;
      } catch (error: unknown) {
        const message = normalizeError(error);
        logger.error('Refresh token verification failed', { error: message });
        throw new Error(message);
      }

      const email = await UserRepository.decryptEmail(token.user_id);
      const userData = await UserRepository.getUserWithProfile(token.user_id);
      const isRefreshExpired = new Date(token.expires_at) < new Date();

      if (isRefreshExpired) {
        logger.info('Refresh token expired, issuing new pair', {
          userId: token.user_id,
        });

        await SessionRepository.revokeRefreshToken(refreshToken);

        const newTokens = this.generateTokens(token.user_id, email);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await SessionRepository.saveRefreshToken(
          token.user_id,
          newTokens.refreshToken,
          expiresAt,
        );

        return {
          user: userData,
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        };
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not set');
      }

      const accessToken = jwt.sign(
        { userId: token.user_id, email },
        jwtSecret,
        { expiresIn: '24h' },
      );

      return { user: userData, accessToken };
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Refresh token failed', { error: message });
      throw error;
    }
  },

  async getProfile(userId: number): Promise<UserWithProfile | null> {
    try {
      const user = await UserRepository.getUserWithProfile(userId);

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.is_active) {
        throw new Error('User account is inactive');
      }

      return user;
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Get profile failed', {
        userId,
        error: message,
      });
      throw error;
    }
  },

  async updateProfile(
    userId: number,
    data: { phone?: string },
  ): Promise<UserWithProfile | null> {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      await UserRepository.updateProfile(client, userId, data);

      await client.query('COMMIT');

      const user = await UserRepository.getUserWithProfile(userId);
      return user;
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const message = normalizeError(error);
      logger.error('Update profile failed', {
        userId,
        error: message,
      });
      throw error;
    } finally {
      client.release();
    }
  },

  // TODO: TO @helpers
  verifyAccessToken(token: string): TokenPayload {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not set');
      }
      return jwt.verify(token, jwtSecret) as TokenPayload;
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Access token verification failed', { error: message });
      throw new Error(message);
    }
  },

  // TODO: TO @helpers
  generateTokens(
    userId: number,
    email: string,
    sessionId?: number,
  ): { accessToken: string; refreshToken: string } {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }

    const accessToken = jwt.sign({ userId, email }, jwtSecret, {
      expiresIn: '24h',
    });

    // check - tokenId: sessionId || userId вот это понадобится или нет в дальнейшем
    const refreshToken = jwt.sign(
      { userId, tokenId: sessionId || userId },
      jwtRefreshSecret,
      { expiresIn: '30d' },
    );

    return { accessToken, refreshToken };
  },
};
