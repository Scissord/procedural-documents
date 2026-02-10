export interface ISession extends Record<string, unknown> {
  id: number;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  login_at: Date;
  logout_at: Date;
  last_seen_at: Date;
}
