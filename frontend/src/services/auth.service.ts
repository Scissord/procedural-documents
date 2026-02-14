import {
  IUpdateProfileInput,
  IRegistrationInput,
  ILoginInput,
  IResponse,
} from '@/interfaces';
import { BASE_URL } from '@/utils';

export const AuthService = {
  async register(data: IRegistrationInput): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result: IResponse = await response.json();

    return result;
  },

  async login(data: ILoginInput): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result: IResponse = await response.json();

    return result;
  },

  async logout(): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result: IResponse = await response.json();

    return result;
  },

  async updateProfile(data: IUpdateProfileInput): Promise<IResponse> {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    const result: IResponse = await response.json();

    return result;
  },
};
