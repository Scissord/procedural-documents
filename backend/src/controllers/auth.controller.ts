import { Request, Response } from 'express';
import { AuthService } from '@services';
import { logger } from '@services';
import { normalizeError } from '@helpers';

const sendError = (res: Response, status: number, message: string): void => {
  res.status(status).json({
    errors: [{ msg: message }],
  });
};

const handleAuthError = (
  res: Response,
  error: unknown,
  context: string,
): void => {
  const message = normalizeError(error);
  logger.error(`${context} failed`, { error: message });

  if (message.includes('already exists') || message.includes('duplicate key')) {
    sendError(res, 409, 'User with this email already exists');
    return;
  }

  if (message.includes('Invalid email or password')) {
    sendError(res, 401, 'Invalid email or password');
    return;
  }

  if (message.includes('inactive')) {
    sendError(res, 401, 'User account is inactive');
    return;
  }

  if (
    message.includes('Invalid') ||
    message.includes('expired') ||
    message.includes('revoked')
  ) {
    sendError(res, 401, message);
    return;
  }

  sendError(res, 400, message || `${context} failed`);
};

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
        code:
      });
    } catch (error: unknown) {
      handleAuthError(res, error, 'Registration');
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        'unknown';

      // const ip = req.headers['x-forwarded-for'] || req.ip;

      const userAgent = req.headers['user-agent'];

      // const user_agent = req.headers['user-agent'] || 'unknown';

      const result = await AuthService.login(
        { email, password },
        ipAddress,
        userAgent,
      );

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      });

      logger.info(result.accessToken);

      res.status(200).json({
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error: unknown) {
      handleAuthError(res, error, 'Login');
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendError(res, 401, 'Authorization token required');
        return;
      }

      const accessToken = authHeader.substring(7);
      const decoded = AuthService.verifyAccessToken(accessToken);

      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (!refreshToken) {
        sendError(res, 400, 'Refresh token required');
        return;
      }

      await AuthService.logout(decoded.userId, refreshToken);

      res.clearCookie('refresh_token');

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error: unknown) {
      handleAuthError(res, error, 'Logout');
    }
  },

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (!refreshToken) {
        sendError(res, 400, 'Refresh token required');
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);

      if (result.refreshToken) {
        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        });
      } else {
        res.status(200).json({
          user: result.user,
          accessToken: result.accessToken,
        });
      }
    } catch (error: unknown) {
      const message = normalizeError(error);

      if (message === 'TOKEN_MISMATCH') {
        logger.warn('Token mismatch detected - possible token theft');
        res.status(405).json({
          errors: [
            {
              msg: 'Token mismatch detected. Please log in again.',
              code: 'TOKEN_MISMATCH',
            },
          ],
        });
        return;
      }

      handleAuthError(res, error, 'Token refresh');
    }
  },
};
