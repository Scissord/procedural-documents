export interface IDocumentTemplate {
  id: number;
  name_ru: string;
  role_id: number;
  stage_id: number;
  jurisdiction_id: number;
  classification_id: number;
  placeholders: {
    required: string[];
    optional: string[];
  };
  sections: Array<{
    key: string;
    title_ru: string;
    template: string;
  }>;
  rules: {
    stages_allowed?: string[];
  };
}

/**
 * Интерфейс для документа пользователя из таблицы app.document
 * Примечание: Date типы на бэкенде автоматически сериализуются в строки при отправке на фронтенд
 */
export interface IUserDocument {
  id: number;
  user_id: number;
  situation: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
