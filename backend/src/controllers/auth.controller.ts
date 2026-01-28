import { Request, Response } from 'express';
import { AuthService, DocumentService } from '@services';
import { logger } from '@services';
import { normalizeError } from '@helpers';
import { AuthRequest } from '@middlewares';
import { RESPONSE_CODE, RESPONSE_STATUS } from '@data';

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

      res.status(RESPONSE_STATUS.CREATED).json({
        user: result.user,
        code: RESPONSE_CODE.CREATED,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      res.status(RESPONSE_STATUS.INTERNAL_SERVER).json({
        message,
        error: 'Ошибка на стороне сервера, пожалуйста попробуйте позже.',
        code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      });
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
        // secure: process.env.NODE_ENV === 'production',
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
      });

      logger.info(result.accessToken);

      res.status(RESPONSE_STATUS.OK).json({
        user: result.user,
        access_token: result.accessToken,
        code: RESPONSE_CODE.OK,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      res.status(RESPONSE_STATUS.INTERNAL_SERVER).json({
        message,
        error: 'Ошибка на стороне сервера, пожалуйста попробуйте позже.',
        code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      });
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send('Authorization token required');
        return;
      }

      const accessToken = authHeader.substring(7);
      const decoded = AuthService.verifyAccessToken(accessToken);

      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(401).send('Refresh token required');
        return;
      }

      await AuthService.logout(decoded.userId, refreshToken);

      res.clearCookie('refresh_token');

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      res.status(RESPONSE_STATUS.INTERNAL_SERVER).json({
        message,
        error: 'Ошибка на стороне сервера, пожалуйста попробуйте позже.',
        code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      });
    }
  },

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(400).send('Refresh token required');
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
      // const message = normalizeError(error);

      // if (message === 'TOKEN_MISMATCH') {
      //   logger.warn('Token mismatch detected - possible token theft');
      //   res.status(405).json({
      //     errors: [
      //       {
      //         msg: 'Token mismatch detected. Please log in again.',
      //         code: 'TOKEN_MISMATCH',
      //       },
      //     ],
      //   });
      //   return;
      // }

      // handleAuthError(res, error, 'Token refresh');

      const message = normalizeError(error);
      res.status(RESPONSE_STATUS.INTERNAL_SERVER).json({
        message,
        error: 'Ошибка на стороне сервера, пожалуйста попробуйте позже.',
        code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      });
    }
  },

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user_id) {
        res.status(401).send('User ID not found in token');

        return;
      }

      const user = await AuthService.getProfile(req.user_id);

      if (!user) {
        res.status(404).send('User not found');

        return;
      }

      res.status(200).json({
        user,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      res.status(RESPONSE_STATUS.INTERNAL_SERVER).json({
        message,
        error: 'Ошибка на стороне сервера, пожалуйста попробуйте позже.',
        code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      });
    }
  },

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user_id) {
        res.status(401).send('User ID not found in token');

        return;
      }

      const { phone } = req.body;

      const user = await AuthService.updateProfile(req.user_id, { phone });

      if (!user) {
        res.status(404).send('User not found');

        return;
      }

      res.status(200).json({
        user,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      res.status(RESPONSE_STATUS.INTERNAL_SERVER).json({
        message,
        error: 'Ошибка на стороне сервера, пожалуйста попробуйте позже.',
        code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      });
    }
  },

  async getUserDocuments(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user_id) {
        res.status(401).send('User ID not found in token');
        return;
      }

      const documents = await DocumentService.getUserDocuments(req.user_id);

      res.status(200).json({
        documents,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      res.status(RESPONSE_STATUS.INTERNAL_SERVER).json({
        message,
        error: 'Ошибка на стороне сервера, пожалуйста попробуйте позже.',
        code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
      });
    }
  },
};
