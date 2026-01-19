import { Request, Response } from 'express';
import { AuthService } from '@services';
import { logger } from '@services';
import { normalizeError } from '@helpers';

export const AuthController = {
  async registration(req: Request, res: Response): Promise<void> {
    try {
      const {
        email,
        first_name,
        password,
        gender,
        locale,
        timezone,
        last_name,
        middle_name,
        phone,
        birthday,
      } = req.body;

      const result = await AuthService.register({
        email,
        first_name,
        password,
        gender,
        locale,
        timezone,
        last_name,
        middle_name,
        phone,
        birthday,
      });

      res.status(201).json({
        user: result.user,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Registration failed', { error: message });

      if (
        message.includes('already exists') ||
        message.includes('duplicate key')
      ) {
        res.status(409).json({
          errors: [{ msg: 'User with this email already exists' }],
        });
        return;
      }

      res.status(400).json({
        errors: [{ msg: message || 'Registration failed' }],
      });
    }
  },

  /**
   * Вход пользователя
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        'unknown';
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login(
        { email, password },
        ipAddress,
        userAgent,
      );

      // Установка refresh token в httpOnly cookie
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      });

      res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Login failed', { error: message });

      if (
        message.includes('Invalid email or password') ||
        message.includes('inactive')
      ) {
        res.status(401).json({
          errors: [{ msg: message || 'Invalid email or password' }],
        });
        return;
      }

      res.status(400).json({
        errors: [{ msg: message || 'Login failed' }],
      });
    }
  },

  /**
   * Выход пользователя
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Получение токена из заголовка Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          errors: [{ msg: 'Authorization token required' }],
        });
        return;
      }

      const accessToken = authHeader.substring(7);
      const decoded = AuthService.verifyAccessToken(accessToken);

      // Получение refresh token из cookies или body
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          errors: [{ msg: 'Refresh token required' }],
        });
        return;
      }

      await AuthService.logout(decoded.userId, refreshToken);

      // Удаление refresh token из cookies
      res.clearCookie('refresh_token');

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Logout failed', { error: message });

      if (message.includes('Invalid') || message.includes('expired')) {
        res.status(401).json({
          errors: [{ msg: message || 'Invalid token' }],
        });
        return;
      }

      res.status(400).json({
        errors: [{ msg: message || 'Logout failed' }],
      });
    }
  },

  /**
   * Обновление access токена
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      // Получение refresh token из cookies или body
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          errors: [{ msg: 'Refresh token required' }],
        });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);

      // Если вернулся новый refresh token, обновляем cookie
      if (result.refreshToken) {
        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
        });
      }

      res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Refresh token failed', { error: message });

      if (
        message.includes('Invalid') ||
        message.includes('expired') ||
        message.includes('revoked')
      ) {
        res.status(401).json({
          errors: [{ msg: message || 'Invalid refresh token' }],
        });
        return;
      }

      res.status(400).json({
        errors: [{ msg: message || 'Token refresh failed' }],
      });
    }
  },
};
