import { IUser, IUserLogin } from '@/interfaces';

interface LoginResult {
  user: IUser | null;
  access_token: string | null;
}

export const useLogin = async (data: IUserLogin): Promise<LoginResult> => {
  try {
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const result = await response.json();

    return {
      user: result.user,
      access_token: result.accessToken,
    };
  } catch (error: unknown) {
    return {
      user: null,
      access_token: null,
    };
  }
};
