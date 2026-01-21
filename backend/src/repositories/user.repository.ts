import { PoolClient } from 'pg';
import { db } from '@services';
import { CryptoHelper } from '@helpers';

/**
 * Типы данных для пользователя
 */
export interface UserRow {
  id: number;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
  avatar_url?: string;
  gender: string;
  locale: string;
  timezone: string;
}

export interface CreateUserDto {
  email: string;
  passwordHash: string;
}

export interface ProfileDto {
  first_name: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  birthday?: string;
  gender: string;
  locale: string;
  timezone: string;
}

export interface DecryptedProfile {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  birthday?: Date;
}

export interface UserWithProfile {
  id: number;
  email: string;
  first_name: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  avatar_url?: string;
  birthday?: Date;
  gender: string;
  locale: string;
  timezone: string;
  is_active: boolean;
  created_at: Date;
}

/**
 * User Repository - Централизует все операции с пользователями и профилями
 * Следует принципу Single Responsibility
 */
export class UserRepository {
  /**
   * Находит пользователя по хэшу email с данными профиля
   */
  static async findByEmailHash(emailHash: string): Promise<UserRow | null> {
    const result = await db.query(
      `SELECT
        u.id, u.password_hash, u.is_active, u.created_at,
        p.avatar_url, p.gender, p.locale, p.timezone
      FROM auth."user" u
      LEFT JOIN auth.profile p ON p.user_id = u.id
      WHERE u.email_hash = $1 AND u.deleted_at IS NULL`,
      [emailHash],
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Создает нового пользователя в транзакции
   * Возвращает ID созданного пользователя
   */
  static async createUser(
    data: CreateUserDto,
    client?: PoolClient,
  ): Promise<number> {
    const queryClient = client || db;
    const secretKey = CryptoHelper.getSecretKey();

    const result = await queryClient.query(
      `INSERT INTO auth."user" (
        email_encrypted, email_hash, password_hash, is_active
      ) VALUES (
        pgp_sym_encrypt($1, $2),
        encode(digest(upper($1), 'sha256'), 'hex'),
        $3, true
      )
      RETURNING id, created_at, is_active`,
      [data.email, secretKey, data.passwordHash],
    );

    return result.rows[0].id;
  }

  /**
   * Создает профиль пользователя
   */
  static async createProfile(
    userId: number,
    data: ProfileDto,
    client?: PoolClient,
  ): Promise<void> {
    const queryClient = client || db;
    const secretKey = CryptoHelper.getSecretKey();

    await queryClient.query(
      `INSERT INTO auth.profile (
        user_id, first_name_encrypted, first_name_hash,
        last_name_encrypted, last_name_hash,
        middle_name_encrypted, middle_name_hash,
        phone_encrypted, phone_hash,
        birthday_encrypted, birthday_hash,
        gender, locale, timezone
      ) VALUES (
        $1,
        pgp_sym_encrypt($2::text, $3),
        encode(digest(upper($2::text), 'sha256'), 'hex'),
        CASE WHEN $4::text IS NOT NULL THEN pgp_sym_encrypt($4::text, $3) ELSE NULL END,
        CASE WHEN $4::text IS NOT NULL THEN encode(digest(upper($4::text), 'sha256'), 'hex') ELSE NULL END,
        CASE WHEN $5::text IS NOT NULL THEN pgp_sym_encrypt($5::text, $3) ELSE NULL END,
        CASE WHEN $5::text IS NOT NULL THEN encode(digest(upper($5::text), 'sha256'), 'hex') ELSE NULL END,
        CASE WHEN $6::text IS NOT NULL THEN pgp_sym_encrypt($6::text, $3) ELSE NULL END,
        CASE WHEN $6::text IS NOT NULL THEN encode(digest(upper($6::text), 'sha256'), 'hex') ELSE NULL END,
        CASE WHEN $7::text IS NOT NULL THEN pgp_sym_encrypt($7::text, $3) ELSE NULL END,
        CASE WHEN $7::text IS NOT NULL THEN encode(digest(upper($7::text), 'sha256'), 'hex') ELSE NULL END,
        $8, $9, $10
      )`,
      [
        userId,
        data.first_name,
        secretKey,
        data.last_name ?? null,
        data.middle_name ?? null,
        data.phone ?? null,
        data.birthday ?? null,
        data.gender,
        data.locale,
        data.timezone,
      ],
    );
  }

  /**
   * Расшифровывает профиль пользователя
   */
  static async decryptUserProfile(userId: number): Promise<DecryptedProfile> {
    const secretKey = CryptoHelper.getSecretKey();

    const result = await db.query(
      `SELECT
        pgp_sym_decrypt(p.first_name_encrypted, $1) as first_name,
        CASE WHEN p.last_name_encrypted IS NOT NULL
          THEN pgp_sym_decrypt(p.last_name_encrypted, $1)
          ELSE NULL END as last_name,
        CASE WHEN p.middle_name_encrypted IS NOT NULL
          THEN pgp_sym_decrypt(p.middle_name_encrypted, $1)
          ELSE NULL END as middle_name,
        CASE WHEN p.phone_encrypted IS NOT NULL
          THEN pgp_sym_decrypt(p.phone_encrypted, $1)
          ELSE NULL END as phone,
        CASE WHEN p.birthday_encrypted IS NOT NULL
          THEN pgp_sym_decrypt(p.birthday_encrypted, $1)::date
          ELSE NULL END as birthday
      FROM auth.profile p
      WHERE p.user_id = $2`,
      [secretKey, userId],
    );

    return result.rows[0] || {};
  }

  /**
   * Расшифровывает email пользователя
   */
  static async decryptEmail(userId: number): Promise<string> {
    const secretKey = CryptoHelper.getSecretKey();

    const result = await db.query(
      `SELECT pgp_sym_decrypt(email_encrypted, $1) as email
      FROM auth."user"
      WHERE id = $2`,
      [secretKey, userId],
    );

    return result.rows[0]?.email || '';
  }

  /**
   * Получает полные данные пользователя с расшифрованным профилем
   */
  static async getUserWithProfile(
    userId: number,
  ): Promise<UserWithProfile | null> {
    const secretKey = CryptoHelper.getSecretKey();

    const result = await db.query(
      `SELECT
        u.id, u.is_active, u.created_at,
        pgp_sym_decrypt(u.email_encrypted, $1) as email,
        pgp_sym_decrypt(p.first_name_encrypted, $1) as first_name,
        CASE WHEN p.last_name_encrypted IS NOT NULL
          THEN pgp_sym_decrypt(p.last_name_encrypted, $1)
          ELSE NULL END as last_name,
        CASE WHEN p.middle_name_encrypted IS NOT NULL
          THEN pgp_sym_decrypt(p.middle_name_encrypted, $1)
          ELSE NULL END as middle_name,
        CASE WHEN p.phone_encrypted IS NOT NULL
          THEN pgp_sym_decrypt(p.phone_encrypted, $1)
          ELSE NULL END as phone,
        CASE WHEN p.birthday_encrypted IS NOT NULL
          THEN pgp_sym_decrypt(p.birthday_encrypted, $1)::date
          ELSE NULL END as birthday,
        p.avatar_url, p.gender, p.locale, p.timezone
      FROM auth."user" u
      LEFT JOIN auth.profile p ON p.user_id = u.id
      WHERE u.id = $2 AND u.deleted_at IS NULL`,
      [secretKey, userId],
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Проверяет существование пользователя по хэшу email
   */
  static async existsByEmailHash(emailHash: string): Promise<boolean> {
    const result = await db.query(
      `SELECT id FROM auth."user" WHERE email_hash = $1`,
      [emailHash],
    );

    return result.rows.length > 0;
  }

  /**
   * Получает основные данные пользователя для refresh token
   */
  static async getUserForRefresh(userId: number): Promise<{
    is_active: boolean;
    created_at: Date;
    avatar_url?: string;
    gender: string;
    locale: string;
    timezone: string;
  } | null> {
    const result = await db.query(
      `SELECT
        u.is_active, u.created_at,
        p.avatar_url, p.gender, p.locale, p.timezone
      FROM auth."user" u
      LEFT JOIN auth.profile p ON p.user_id = u.id
      WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [userId],
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
