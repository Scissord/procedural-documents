export interface IResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
  data?: Record<string, unknown>;
}
