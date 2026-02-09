export interface IProfile extends Record<string, unknown> {
  id: string;
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
  created_at: Date;
  updated_at: Date;
}
