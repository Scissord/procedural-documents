import { AxiosError } from 'axios';

export function normalizeError(error: unknown): string {
  // 1. Обычная ошибка JS/TS
  if (error instanceof Error) {
    return error.message;
  }

  // 2. Строка
  if (typeof error === 'string') {
    return error;
  }

  // 3. PostgreSQL (pg) ошибки
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'detail' in error
  ) {
    const pgErr = error as { code?: string; detail?: string; message?: string };
    return `PostgreSQL error [${pgErr.code}]: ${pgErr.detail || pgErr.message || 'Unknown'}`;
  }

  // 4. Axios ошибки
  if (error instanceof AxiosError) {
    return `Axios error [${error.code}]: ${error.message} - ${JSON.stringify(error.response?.data)}`;
  }

  // 5. Фолбэк на случай чего-то странного
  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}
