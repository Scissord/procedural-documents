export interface IProfile extends Record<string, unknown> {
  id: string;
  user_id: number;
  first_name_encrypted: Buffer;
  first_name_hash: string;
  last_name_encrypted: Buffer;
  last_name_hash: string;
  middle_name_encrypted: Buffer;
  middle_name_hash: string;
  phone_encrypted: Buffer;
  phone_hash: string;
  avatar_url: string;
  birthday_encrypted: Buffer;
  birthday_hash: string;
  gender: string;
  locale: string;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}
