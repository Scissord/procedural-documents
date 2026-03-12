export interface ICase {
  id: string;
  user_id: number;
  status: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
