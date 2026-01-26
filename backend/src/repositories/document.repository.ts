import { db } from '@services';
import { IDocumentTemplate, IUserDocument } from '@interfaces';

export const DocumentRepository = {
  /**
   * Получить все документы по stage_id
   */
  async getByStageId(stage_id: number): Promise<IDocumentTemplate[]> {
    const result = await db.query(
      `
        SELECT
          id,
          name_ru,
          role_id,
          stage_id,
          jurisdiction_id,
          classification_id,
          placeholders,
          sections,
          rules
        FROM ref.documents
        WHERE stage_id = $1 AND deleted_at IS NULL
        ORDER BY id ASC;
      `,
      [stage_id],
    );

    return result.rows;
  },

  /**
   * Получить документ по id
   */
  async getById(id: number): Promise<IDocumentTemplate | null> {
    const result = await db.query(
      `
        SELECT
          id,
          name_ru,
          role_id,
          stage_id,
          jurisdiction_id,
          classification_id,
          placeholders,
          sections,
          rules
        FROM ref.documents
        WHERE id = $1 AND deleted_at IS NULL;
      `,
      [id],
    );

    return result.rows[0] || null;
  },

  /**
   * Получить все документы
   */
  async getAll(): Promise<IDocumentTemplate[]> {
    const result = await db.query(
      `
        SELECT
          id,
          name_ru,
          role_id,
          stage_id,
          jurisdiction_id,
          classification_id,
          placeholders,
          sections,
          rules
        FROM ref.documents
        WHERE deleted_at IS NULL
        ORDER BY id ASC;
      `,
      [],
    );

    return result.rows;
  },

  /**
   * Получить все документы пользователя из app.document
   */
  async getUserDocuments(user_id: number): Promise<IUserDocument[]> {
    const result = await db.query(
      `
        SELECT
          id,
          user_id,
          situation,
          created_at,
          updated_at,
          deleted_at
        FROM app.document
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY created_at DESC;
      `,
      [user_id],
    );

    return result.rows;
  },
};
