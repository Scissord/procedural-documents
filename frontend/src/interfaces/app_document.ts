export interface IAppDocument {
  id: string;
  user_id: number;
  docs: any[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
