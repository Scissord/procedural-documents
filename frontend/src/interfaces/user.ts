export interface IUserBase {
  login: string;
}

export interface IUserLogin extends IUserBase {
  password: string;
}

export type IRegistration = IUserLogin & {
  email?: string;
  phone?: string | '';
  birthday?: string;
  locale?: string;
  timezone?: string;
};

export interface IUser extends IUserBase {
  id: number;
  created_at: string;
  is_active: boolean;
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  birthday: Date;
  gender: 'male' | 'female' | 'other';
  locale: string;
  timezone: string;
  access_token: string;
}
