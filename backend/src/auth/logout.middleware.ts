import {
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { NextFunction, Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { TokenService } from 'src/token/token.service';
import type { Logger as WinstonLogger } from 'winston';

interface JwtTokenPayload {
  id: number | string;
  session_id: number | string;
}

export interface LogoutRequest extends Request {
  auth?: {
    user_id: number;
    session_id: number;
    access_token?: string;
    refresh_token: string;
  };
}

@Injectable()
export class LogoutMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
  ) {}

  async use(req: LogoutRequest, _res: Response, next: NextFunction) {
    try {
      const access_token = this.extractCookie(req, 'access_token');
      const refresh_token = this.extractCookie(req, 'refresh_token');

      if (!refresh_token) {
        throw new UnauthorizedException('Refresh token is required');
      }

      const refreshPayload = await this.verifyRefreshToken(refresh_token);
      const user_id = Number(refreshPayload.id);
      const session_id = Number(refreshPayload.session_id);

      if (!Number.isFinite(user_id) || !Number.isFinite(session_id)) {
        throw new UnauthorizedException('Invalid refresh token payload');
      }

      const tokenExists = await this.tokenService.isRefreshTokenValid(
        user_id,
        session_id,
        refresh_token,
      );

      if (!tokenExists) {
        const diagnostics = await this.tokenService.getRefreshTokenDiagnostics(
          user_id,
          session_id,
          refresh_token,
        );

        this.logger.warn('Logout middleware: refresh token is not active', {
          user_id,
          session_id,
          reason: diagnostics.reason,
        });

        throw new UnauthorizedException('Refresh token is not active');
      }

      if (access_token) {
        try {
          const accessPayload =
            await this.jwtService.verifyAsync<JwtTokenPayload>(access_token, {
              ignoreExpiration: true,
            });

          const access_user_id = Number(accessPayload.id);
          const access_session_id = Number(accessPayload.session_id);

          if (
            Number.isFinite(access_user_id) &&
            Number.isFinite(access_session_id) &&
            (access_user_id !== user_id || access_session_id !== session_id)
          ) {
            throw new UnauthorizedException('Token pair mismatch');
          }
        } catch (error) {
          if (error instanceof UnauthorizedException) {
            throw error;
          }
          throw new UnauthorizedException('Invalid access token');
        }
      }

      req.auth = {
        user_id,
        session_id,
        access_token,
        refresh_token,
      };

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.clearAuthCookies(_res);
      }
      throw error;
    }
  }

  private clearAuthCookies(res: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
    };
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
  }

  private extractCookie(req: Request, cookieName: string): string | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader.split(';');
    for (const entry of cookies) {
      const [name, ...value] = entry.trim().split('=');
      if (name === cookieName) {
        return decodeURIComponent(value.join('='));
      }
    }

    return undefined;
  }

  private async verifyRefreshToken(
    refresh_token: string,
  ): Promise<JwtTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtTokenPayload>(refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
