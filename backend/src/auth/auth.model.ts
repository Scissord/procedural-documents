export interface IUserProfile extends Record<string, unknown> {
  id: number;
  email: string;
  is_active: boolean;
  created_at: Date;
  profile_id: number;
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
