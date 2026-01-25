import { IUser, IUserLogin, IRegistration } from '@/interfaces';
import { base_url } from '@/utils';
import z from 'zod';

interface LoginResult {
  user: IUser | null;
  accessToken: string | null;
}

type ApiError = {
  errors?: Array<{ msg: string }>;
  error?: string;
};

const loginSchema = z.object({
  email: z.email('Некорректный email').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Пароль должен быть не менее 8 символов')
    .max(128, 'Пароль должен быть не более 128 символов'),
});

type loginFormData = z.infer<typeof loginSchema>;

export const AuthService = {
  async registration(data: IRegistration): Promise<IUser | string> {
    try {
      const response = await fetch(`${base_url}/auth/registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        // Бэкенд возвращает { errors: [{ msg: string }] }
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          return result.errors[0].msg;
        }
        throw result;
      }

      return result;
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.errors && Array.isArray(apiErr.errors) && apiErr.errors.length > 0) {
        return apiErr.errors[0].msg;
      }
      if (apiErr?.error) {
        return apiErr.error;
      }

      return 'Произошла ошибка при регистрации';
    }
  },

  async login(data: loginFormData): Promise<LoginResult | string> {
    try {
      const response = await fetch(`${base_url}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw result;
      }

      return result;
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.error) {
        return apiErr.error; // "EMAIL_EXISTS" | "PHONE_EXISTS"
      }

      return 'UNKNOWN_ERROR';
    }
  },

  async logout() {},

  async refresh() {},
};
