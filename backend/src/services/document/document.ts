import { db, DocumentValidationService, TemplateService } from '@services';

interface IDocument {
  id: number;
  user_id: number;
  situation: string;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export const DocumentService = {
  async createDocument(situation: string): Promise<IDocument> {
    const query = `
      INSERT INTO app.document (
        user_id,
        situation
      )
      VALUES ($1, $2)
      RETURNING *;
    `;

    const document = await db.query(query, [8, situation]);

    return document.rows[0];
  },

  async getDocument(document_id: number): Promise<IDocument> {
    const query = `
      SELECT * FROM app.document
      WHERE id = $1
    `;

    const document = await db.query(query, [document_id]);

    return document.rows[0];
  },

  async prepareDocument(
    user_situation: string,
    document_id: number,
  ): Promise<string> {
    // Guard against huge inputs (PDF dumps etc.) causing model context overflow.
    // Keep enough facts for the LLM, but avoid multi-hundred-thousand token prompts.
    const situation = DocumentValidationService.sliceSituation(user_situation);

    let input = '';
    switch (document_id) {
      case 1:
        input = TemplateService.getFirstTemplate(situation);
        break;

      case 2:
        input = TemplateService.getSecondTemplate(situation);
        break;

      default:
        break;
    }

    return input;
  },
};
