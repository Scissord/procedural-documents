import {
  IUser,
  IRegistrationInput,
  ILoginInput,
  ILoginOutput,
  IResponse,
} from '@/interfaces';
import { base_url } from '@/utils';
import { useNotificationStore } from '@/store';

const BASE_URL = process.env.NEXT_BACKEND_API_URL!;

export const AuthService = {
  async register(data: IRegistrationInput): Promise<IResponse> {
    const response = await fetch(`${base_url}/auth/register`, {
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
    const response = await fetch(`${base_url}/auth/login`, {
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
    const response = await fetch(`${base_url}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const result: IResponse = await response.json();

    return result;
  },

  async update(data: ILoginInput): Promise<IResponse> {
    const response = await fetch(`${base_url}/auth/login`, {
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
};
