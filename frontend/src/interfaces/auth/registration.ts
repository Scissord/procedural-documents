import { IUser } from '@/interfaces';

export type IRegistrationInput = {
  first_name: string;
  email: string;
  password: string;
  gender: 'male' | 'female' | 'other';
  locale: string;
  timezone: string;
};

export type IRegistrationOutput = {
  user?: IUser;
  code: string;
  error?: string;
  message?: string;
};
