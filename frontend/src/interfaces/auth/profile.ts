export interface IProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name: string;
  phone: string;
  avatar_url: string;
  birthday: string;
  gender: string;
  locale: string;
  timezone: string;
}

export interface IUpdateProfileInput {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  locale?: string;
  timezone?: string;
}
