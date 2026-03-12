export interface IRole extends Record<string, unknown> {
  id: number;
  name_ru: string;
  code: string;
  is_active: boolean;
}
