export interface IAppDocument extends Record<string, unknown> {
  id: number;
  user_id: number;
  situation: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
