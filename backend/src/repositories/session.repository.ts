import { PoolClient } from 'pg';
import { db } from '@services';

/**
 * Типы данных для сессий и токенов
 */
export interface TokenRow {
  user_id: number;
  expires_at: Date;
  revoked_at: Date | null;
}

/**
 * Session Repository - Централизует все операции с сессиями и токенами
 * Следует принципу Single Responsibility
 */
export class SessionRepository {
  /**
   * Создает новую сессию пользователя
   * Возвращает ID созданной сессии
   */
  static async createSession(
    userId: number,
    ipAddress: string,
    userAgent: string | null,
    client?: PoolClient,
  ): Promise<number> {
    const queryClient = client || db;

    const result = await queryClient.query(
      `INSERT INTO auth.session (
        user_id, ip_address, user_agent, login_at, is_active
      ) VALUES ($1, $2, $3, NOW(), true)
      RETURNING id`,
      [userId, ipAddress, userAgent],
    );

    return result.rows[0].id;
  }

  /**
   * Деактивирует все активные сессии пользователя
   */
  static async deactivateUserSessions(userId: number): Promise<void> {
    await db.query(
      `UPDATE auth.session
      SET logout_at = NOW(), is_active = false
      WHERE user_id = $1 AND is_active = true`,
      [userId],
    );
  }

  /**
   * Сохраняет refresh token в базу данных
   */
  static async saveRefreshToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await db.query(
      `INSERT INTO auth.token (user_id, refresh_token, expires_at)
      VALUES ($1, $2, $3)`,
      [userId, token, expiresAt],
    );
  }

  /**
   * Находит refresh token в базе данных
   */
  static async findRefreshToken(token: string): Promise<TokenRow | null> {
    const result = await db.query(
      `SELECT user_id, expires_at, revoked_at
      FROM auth.token
      WHERE refresh_token = $1`,
      [token],
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Отзывает refresh token (помечает как revoked)
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    await db.query(
      `UPDATE auth.token
      SET revoked_at = NOW()
      WHERE refresh_token = $1 AND revoked_at IS NULL`,
      [token],
    );
  }
}
