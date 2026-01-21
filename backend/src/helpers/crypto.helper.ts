import * as bcrypt from 'bcrypt';
import { db } from '@services';

/**
 * Crypto Helper - Централизует все операции шифрования и хэширования
 * Следует принципу DRY (Don't Repeat Yourself)
 */
export class CryptoHelper {
  /**
   * Хэширует email используя SHA256 через PostgreSQL
   * Используется для поиска пользователей без расшифровки
   */
  static async hashEmail(email: string): Promise<string> {
    const result = await db.query(
      `SELECT encode(digest(upper($1), 'sha256'), 'hex') as hash`,
      [email],
    );
    return result.rows[0].hash;
  }

  /**
   * Хэширует произвольное поле используя SHA256 через PostgreSQL
   * Универсальная функция для хэширования любых данных
   */
  static async hashField(value: string): Promise<string> {
    const result = await db.query(
      `SELECT encode(digest(upper($1), 'sha256'), 'hex') as hash`,
      [value],
    );
    return result.rows[0].hash;
  }

  /**
   * Шифрует поле используя pgcrypto
   * Возвращает зашифрованные байты для хранения в BYTEA
   */
  static encryptField(_value: string): string {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      throw new Error('SECRET_KEY environment variable is not set');
    }
    return `pgp_sym_encrypt($1, '${secretKey}')`;
  }

  /**
   * Возвращает SQL для расшифровки поля
   */
  static decryptField(columnName: string): string {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      throw new Error('SECRET_KEY environment variable is not set');
    }
    return `pgp_sym_decrypt(${columnName}, '${secretKey}')`;
  }

  /**
   * Хэширует пароль используя bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Сравнивает пароль с хэшем
   */
  static async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Получает секретный ключ для шифрования
   */
  static getSecretKey(): string {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
      throw new Error('SECRET_KEY environment variable is not set');
    }
    return secretKey;
  }
}
