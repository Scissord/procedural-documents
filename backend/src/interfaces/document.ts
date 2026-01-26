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