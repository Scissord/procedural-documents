export interface IClassification extends Record<string, unknown> {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}
