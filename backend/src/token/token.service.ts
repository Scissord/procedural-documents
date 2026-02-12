import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgPoolClient, PgService } from '../db/pg.service';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import type { IToken } from './token.model';
import { tokenQuery } from './token.query';

interface RefreshTokenRow {
  id: number;
  expires_at: Date;
  revoked_at: Date | null;
}

interface RefreshTokenDiagnostics {
  reason: 'mismatch' | 'revoked' | 'expired_in_db' | 'not_found';
  expires_at: Date | null;
  revoked_at: Date | null;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly pgService: PgService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    client: PgPoolClient,
    user_id: number,
    session_id: number,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const refreshExpiresIn =
      this.configService.get<StringValue>('JWT_REFRESH_EXPIRES_IN') ?? '30d';

    const access_token = await this.jwtService.signAsync({
      id: user_id,
      session_id,
    });
    const refresh_token = await this.jwtService.signAsync(
      {
        id: user_id,
        session_id,
      },
      {
        expiresIn: refreshExpiresIn,
      },
    );
    const verifiedRefresh = await this.jwtService.verifyAsync<{ exp?: number }>(
      refresh_token,
      {
        ignoreExpiration: true,
      },
    );
    const refreshExp = verifiedRefresh.exp;
    const expiresAt = refreshExp
      ? new Date(refreshExp * 1000)
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    const exists = await client.query<IToken>(tokenQuery.check, [
      user_id,
      session_id,
    ]);

    if (exists.rows.length > 0) {
      await client.query<IToken>(tokenQuery.update, [
        exists.rows[0].id,
        refresh_token,
        expiresAt,
      ]);
    } else {
      await client.query<IToken>(tokenQuery.create, [
        user_id,
        session_id,
        refresh_token,
        expiresAt,
      ]);
    }

    return { access_token, refresh_token };
  }

  async createAccessToken(
    user_id: number | string,
    session_id: number | string,
  ): Promise<string> {
    return this.jwtService.signAsync({
      id: user_id,
      session_id,
    });
  }

  async isRefreshTokenValid(
    user_id: number,
    session_id: number,
    refresh_token: string,
  ): Promise<boolean> {
    const client = await this.pgService.getClient();

    try {
      const result = await client.query<{ id: number }>(
        tokenQuery.checkValidRefresh,
        [user_id, session_id, refresh_token],
      );

      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }

  async revokeByPair(
    client: PgPoolClient,
    user_id: number,
    session_id: number,
    refresh_token: string,
  ): Promise<boolean> {
    const result = await client.query<{ id: number }>(tokenQuery.revokeByPair, [
      user_id,
      session_id,
      refresh_token,
    ]);

    return result.rows.length > 0;
  }

  async getRefreshTokenDiagnostics(
    user_id: number,
    session_id: number,
    refresh_token: string,
  ): Promise<RefreshTokenDiagnostics> {
    const client = await this.pgService.getClient();

    try {
      const matched = await client.query<RefreshTokenRow>(
        tokenQuery.getByPairAndToken,
        [user_id, session_id, refresh_token],
      );

      if (matched.rows.length > 0) {
        const row = matched.rows[0];

        if (row.revoked_at) {
          return {
            reason: 'revoked',
            expires_at: row.expires_at,
            revoked_at: row.revoked_at,
          };
        }

        if (new Date(row.expires_at).getTime() <= Date.now()) {
          return {
            reason: 'expired_in_db',
            expires_at: row.expires_at,
            revoked_at: row.revoked_at,
          };
        }
      }

      const latestByPair = await client.query<RefreshTokenRow>(
        tokenQuery.getByPairLatest,
        [user_id, session_id],
      );

      if (latestByPair.rows.length > 0) {
        const latest = latestByPair.rows[0];
        return {
          reason: 'mismatch',
          expires_at: latest.expires_at,
          revoked_at: latest.revoked_at,
        };
      }

      return {
        reason: 'not_found',
        expires_at: null,
        revoked_at: null,
      };
    } finally {
      client.release();
    }
  }
}
