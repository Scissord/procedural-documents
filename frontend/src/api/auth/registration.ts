import { IUser, IRegistration } from '@/interfaces';

interface IRegistrationResult {
  user: IUser | null;
  access_token: string | null;
}

export const useRegistration = async (
  data: IRegistration,
): Promise<IRegistrationResult> => {
  try {
    const response = await fetch(
      'http://localhost:8080/api/auth/registration',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error('Registration failed');
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
