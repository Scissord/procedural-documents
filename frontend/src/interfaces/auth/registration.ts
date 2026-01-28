import { IBaseResponse, IUser } from '@/interfaces';

export type IRegistrationInput = {
  first_name: string;
  email: string;
  password: string;
  gender: 'male' | 'female' | 'other';
  locale: string;
  timezone: string;
};

export type IRegistrationOutput = IBaseResponse<{
  user: IUser;
}>;
