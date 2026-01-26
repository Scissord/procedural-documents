import { IUser } from '@/interfaces';

export type ILoginInput = {
  email: string;
  password: string;
};

export type ILoginOutput = {
  user?: IUser | null;
  access_token?: string | null;
  code: string;
  error?: string;
  message?: string;
};
