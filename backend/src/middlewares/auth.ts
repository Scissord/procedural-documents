import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '@services';
import { logger } from '@services';
import { normalizeError } from '@helpers';

interface TokenPayload {
  userId: number;
  email?: string;
  tokenId?: number;
}

interface AuthRequest extends Request {
  user_id?: number;
  user?: TokenPayload;
}

/**
 * Auth Middleware
 * 1. Получает accessToken из headers
 * 2. Получает refreshToken из куков
 * 3. Проверяет accessToken на валидность
 * 4. Если access валидный - пускает в контроллер
 * 5. Если accessToken не валиден - пытается обновить через refresh
 * 6. Если refresh не валиден - кидает 405, чтобы выкинуть пользователя
 */
export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Получаем accessToken из headers
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    // 2. Получаем refreshToken из куков
    const refreshToken = req.cookies?.refresh_token;

    if (!accessToken && !refreshToken) {
      res.status(401).json({
        errors: [
          {
            msg: 'Authorization token required',
            code: 'AUTH_REQUIRED',
          },
        ],
      });
      return;
    }

    // 3. Проверяем accessToken на валидность
    if (accessToken) {
      try {
        const decodedAccess = AuthService.verifyAccessToken(accessToken);
        // 4. Если access валидный - пускаем в контроллер
        req.user_id = decodedAccess.userId;
        req.user = decodedAccess;
        next();
        return;
      } catch (error: unknown) {
        // 8. Если accessToken не валиден - пытаемся обновить через refresh
        const errorMessage = normalizeError(error);
        const isExpired =
          error instanceof Error &&
          (error.name === 'TokenExpiredError' ||
            errorMessage.includes('expired'));

        if (!isExpired) {
          // Если это не ошибка истечения, а другая ошибка (невалидный токен)
          logger.warn('Invalid access token', { error: errorMessage });
          res.status(401).json({
            errors: [
              {
                msg: 'Invalid access token',
                code: 'INVALID_TOKEN',
              },
            ],
          });
          return;
        }

        // Токен истек, пытаемся обновить через refresh
        if (!refreshToken) {
          res.status(401).json({
            errors: [
              {
                msg: 'Access token expired and no refresh token provided',
                code: 'TOKEN_EXPIRED',
              },
            ],
          });
          return;
        }
      }
    }

    // 5. Пытаемся обновить токен через refresh
    if (refreshToken) {
      try {
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!jwtRefreshSecret) {
          throw new Error('JWT_REFRESH_SECRET environment variable is not set');
        }

        // 6. Проверяем refresh token
        const decodedRefresh = jwt.verify(
          refreshToken,
          jwtRefreshSecret,
        ) as TokenPayload;

        // Пытаемся обновить токены через AuthService
        const result = await AuthService.refreshToken(refreshToken);

        // Устанавливаем user_id для запроса
        req.user_id = decodedRefresh.userId;
        req.user = decodedRefresh;

        // Устанавливаем новый refresh token в куки, если он был обновлен
        if (result.refreshToken) {
          res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          });
        }

        // Устанавливаем новый access token в заголовок ответа
        res.setHeader('X-New-Access-Token', result.accessToken);

        next();
        return;
      } catch (error: unknown) {
        // 10. Если refresh не валиден - кидаем 405, чтобы выкинуть пользователя
        const errorMessage = normalizeError(error);
        logger.error('Refresh token verification failed', {
          error: errorMessage,
        });

        res.status(405).json({
          errors: [
            {
              msg: 'Refresh token invalid or expired. Please log in again.',
              code: 'REFRESH_TOKEN_INVALID',
            },
          ],
        });
        return;
      }
    }

    // Если дошли сюда, значит нет ни access, ни refresh токенов
    res.status(401).json({
      errors: [
        {
          msg: 'Authorization required',
          code: 'AUTH_REQUIRED',
        },
      ],
    });
  } catch (error: unknown) {
    const message = normalizeError(error);
    logger.error('Auth middleware error', { error: message });
    res.status(500).json({
      errors: [
        {
          msg: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      ],
    });
  }
};
