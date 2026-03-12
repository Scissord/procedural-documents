export interface IAppDocument extends Record<string, unknown> {
  id: string;
  user_id: number;
  stage: number;
  docs: { title: string; text: string }[];
  case_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
