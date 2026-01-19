import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PoolClient } from 'pg';
import { db } from '@services';
import { logger } from '@services';
import { normalizeError } from '@helpers';

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

interface UserData {
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

interface ProfileData {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  birthday?: Date;
}

// Вспомогательные функции
const getEmailHash = async (email: string): Promise<string> => {
  const result = await db.query(
    `SELECT encode(digest(upper($1), 'sha256'), 'hex') as hash`,
    [email],
  );
  return result.rows[0].hash;
};

const decryptProfile = async (userId: number): Promise<ProfileData> => {
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
    [process.env.SECRET_KEY, userId],
  );
  return result.rows[0] || {};
};

const decryptEmail = async (userId: number): Promise<string> => {
  const result = await db.query(
    `SELECT pgp_sym_decrypt(email_encrypted, $1) as email
    FROM auth."user"
    WHERE id = $2`,
    [process.env.SECRET_KEY, userId],
  );
  return result.rows[0]?.email || '';
};

const createSession = async (
  userId: number,
  ipAddress: string,
  userAgent: string | null,
  client?: PoolClient,
): Promise<number> => {
  const queryClient = client || db;
  const result = await queryClient.query(
    `INSERT INTO auth.session (
      user_id, ip_address, user_agent, login_at, is_active
    ) VALUES ($1, $2, $3, NOW(), true)
    RETURNING id`,
    [userId, ipAddress, userAgent],
  );
  return result.rows[0].id;
};

const generateTokens = (
  userId: number,
  email: string,
  sessionId?: number,
): { accessToken: string; refreshToken: string } => {
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

  const refreshToken = jwt.sign(
    { userId, tokenId: sessionId || userId },
    jwtRefreshSecret,
    { expiresIn: '30d' },
  );

  return { accessToken, refreshToken };
};

const saveRefreshToken = async (
  userId: number,
  refreshToken: string,
): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await db.query(
    `INSERT INTO auth.token (user_id, refresh_token, expires_at)
    VALUES ($1, $2, $3)`,
    [userId, refreshToken, expiresAt],
  );
};

const buildUserData = (
  userId: number,
  email: string,
  profile: ProfileData,
  userFromDb: {
    avatar_url?: string;
    gender: string;
    locale: string;
    timezone: string;
    is_active: boolean;
    created_at: Date;
  },
): UserData => {
  return {
    id: userId,
    email,
    first_name: profile.first_name || '',
    last_name: profile.last_name ?? undefined,
    middle_name: profile.middle_name ?? undefined,
    phone: profile.phone ?? undefined,
    avatar_url: userFromDb.avatar_url ?? undefined,
    birthday: profile.birthday ?? undefined,
    gender: userFromDb.gender,
    locale: userFromDb.locale,
    timezone: userFromDb.timezone,
    is_active: userFromDb.is_active,
    created_at: userFromDb.created_at,
  };
};

/**
 * Сервис для работы с аутентификацией
 */
export const AuthService = {
  /**
   * Регистрация нового пользователя
   */
  async register(data: RegistrationData): Promise<{ user: UserData }> {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Проверка существования пользователя
      const emailHash = await getEmailHash(data.email);
      const existingUser = await client.query(
        `SELECT id FROM auth."user" WHERE email_hash = $1`,
        [emailHash],
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Создание пользователя
      const passwordHash = await bcrypt.hash(data.password, 10);
      const userResult = await client.query(
        `INSERT INTO auth."user" (
          email_encrypted, email_hash, password_hash, is_active
        ) VALUES (
          pgp_sym_encrypt($1, $2),
          encode(digest(upper($1), 'sha256'), 'hex'),
          $3, true
        )
        RETURNING id, created_at, is_active`,
        [data.email, process.env.SECRET_KEY, passwordHash],
      );

      const userId = userResult.rows[0].id;

      // Создание профиля
      await client.query(
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
          process.env.SECRET_KEY,
          data.last_name ?? null,
          data.middle_name ?? null,
          data.phone ?? null,
          data.birthday ?? null,
          data.gender,
          data.locale,
          data.timezone,
        ],
      );

      await client.query('COMMIT');

      // Формирование ответа
      const profile: ProfileData = {
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: data.middle_name,
        phone: data.phone,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
      };

      const userData = buildUserData(userId, data.email, profile, {
        gender: data.gender,
        locale: data.locale,
        timezone: data.timezone,
        is_active: true,
        created_at: userResult.rows[0].created_at,
      });

      return { user: userData };
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const message = normalizeError(error);
      logger.error('Registration failed', { error: message });
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Вход пользователя
   */
  async login(
    data: LoginData,
    ipAddress: string,
    userAgent: string | undefined,
  ): Promise<{ user: UserData; accessToken: string; refreshToken: string }> {
    try {
      // Поиск пользователя
      const emailHash = await getEmailHash(data.email);
      const userResult = await db.query(
        `SELECT
          u.id, u.password_hash, u.is_active, u.created_at,
          p.first_name_encrypted, p.last_name_encrypted,
          p.middle_name_encrypted, p.phone_encrypted,
          p.birthday_encrypted, p.avatar_url,
          p.gender, p.locale, p.timezone
        FROM auth."user" u
        LEFT JOIN auth.profile p ON p.user_id = u.id
        WHERE u.email_hash = $1 AND u.deleted_at IS NULL`,
        [emailHash],
      );

      if (userResult.rows.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = userResult.rows[0];

      if (!user.is_active) {
        throw new Error('User account is inactive');
      }

      // Проверка пароля
      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password_hash,
      );

      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Расшифровка данных и создание сессии
      const profile = await decryptProfile(user.id);
      const sessionId = await createSession(
        user.id,
        ipAddress,
        userAgent || null,
      );
      const { accessToken, refreshToken } = generateTokens(
        user.id,
        data.email,
        sessionId,
      );

      await saveRefreshToken(user.id, refreshToken);

      const userData = buildUserData(user.id, data.email, profile, {
        avatar_url: user.avatar_url,
        gender: user.gender,
        locale: user.locale,
        timezone: user.timezone,
        is_active: user.is_active,
        created_at: user.created_at,
      });

      return { user: userData, accessToken, refreshToken };
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Login failed', { error: message });
      throw error;
    }
  },

  /**
   * Выход пользователя
   */
  async logout(userId: number, refreshToken: string): Promise<void> {
    try {
      await Promise.all([
        db.query(
          `UPDATE auth.session
          SET logout_at = NOW(), is_active = false
          WHERE user_id = $1 AND is_active = true`,
          [userId],
        ),
        db.query(
          `UPDATE auth.token
          SET revoked_at = NOW()
          WHERE refresh_token = $1 AND revoked_at IS NULL`,
          [refreshToken],
        ),
      ]);
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Logout failed', { error: message });
      throw error;
    }
  },

  /**
   * Обновление access токена
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<{ user: UserData; accessToken: string; refreshToken?: string }> {
    try {
      // Проверка токена в БД
      const tokenResult = await db.query(
        `SELECT
          t.user_id, t.expires_at, t.revoked_at,
          u.is_active, u.created_at,
          p.avatar_url, p.gender, p.locale, p.timezone
        FROM auth.token t
        JOIN auth."user" u ON u.id = t.user_id
        LEFT JOIN auth.profile p ON p.user_id = u.id
        WHERE t.refresh_token = $1 AND u.deleted_at IS NULL`,
        [refreshToken],
      );

      if (tokenResult.rows.length === 0) {
        throw new Error('Invalid refresh token');
      }

      const token = tokenResult.rows[0];

      if (token.revoked_at) {
        throw new Error('Refresh token has been revoked');
      }

      if (new Date(token.expires_at) < new Date()) {
        throw new Error('Refresh token has expired');
      }

      if (!token.is_active) {
        throw new Error('User account is inactive');
      }

      // Верификация JWT
      try {
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!jwtRefreshSecret) {
          throw new Error('JWT_REFRESH_SECRET environment variable is not set');
        }
        jwt.verify(refreshToken, jwtRefreshSecret) as TokenPayload;
      } catch (error: unknown) {
        const message = normalizeError(error);
        logger.error('Refresh token verification failed', { error: message });
        throw new Error(message);
      }

      // Расшифровка данных
      const profile = await decryptProfile(token.user_id);
      const email = await decryptEmail(token.user_id);
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not set');
      }
      const accessToken = jwt.sign(
        { userId: token.user_id, email },
        jwtSecret,
        { expiresIn: '24h' },
      );

      const userData = buildUserData(token.user_id, email, profile, {
        avatar_url: token.avatar_url,
        gender: token.gender,
        locale: token.locale,
        timezone: token.timezone,
        is_active: token.is_active,
        created_at: token.created_at,
      });

      return { user: userData, accessToken };
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Refresh token failed', { error: message });
      throw error;
    }
  },

  /**
   * Верификация access токена
   */
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
};
