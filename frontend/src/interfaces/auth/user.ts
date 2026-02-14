import { IProfile } from './profile';

export interface IUserBase {
  login?: string;
}

export interface IUserLogin extends IUserBase {
  password: string;
}

export interface IUser extends IUserBase {
  id: number;
  created_at: string;
  is_active: boolean;
  first_name: string;
  last_name?: string | null;
  middle_name?: string | null;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  birthday?: Date | string | null;
  gender: 'male' | 'female' | 'other';
  locale: string;
  timezone: string;
  profile: IProfile;
}
