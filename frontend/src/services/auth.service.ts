import {
  IUser,
  IRegistrationInput,
  IRegistrationOutput,
  ILoginInput,
  ILoginOutput,
} from '@/interfaces';
import { base_url } from '@/utils';
import z from 'zod';

const BASE_URL = process.env.NEXT_BACKEND_API_URL!;

export const AuthService = {
  async registration(data: IRegistrationInput): Promise<IRegistrationOutput> {
    const response = await fetch(`${base_url}/auth/registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: IRegistrationOutput = await response.json();

    return result;
  },

  async login(data: ILoginInput): Promise<ILoginOutput> {
    const response = await fetch(`${base_url}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result = await response.json();

    return result;
  },

  async logout() {},

  async refresh(): Promise<string> {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Refresh failed');
    }

    const data = await res.json();
    return data.accessToken;
  },

  async getProfile(): Promise<IUser | string> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return 'Токен доступа не найден';
    }

    const response = await fetch(`${base_url}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      if (
        result.errors &&
        Array.isArray(result.errors) &&
        result.errors.length > 0
      ) {
        return result.errors[0].msg;
      }
      throw result;
    }

    return result.user;
  },

  async updateProfile(data: { phone?: string }): Promise<IUser | string> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return 'Токен доступа не найден';
    }

    const response = await fetch(`${base_url}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      if (
        result.errors &&
        Array.isArray(result.errors) &&
        result.errors.length > 0
      ) {
        return result.errors[0].msg;
      }
      throw result;
    }

    return result.user;
  },
};
