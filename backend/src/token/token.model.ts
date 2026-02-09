export interface IToken extends Record<string, unknown> {
  id: number;
  email: string;
  password_hash?: string;
  is_active: boolean;
  created_at: Date;
}
