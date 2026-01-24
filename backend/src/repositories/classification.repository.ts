import { db } from '@services';
import { IClassification } from '@interfaces';

export const ClassificationRepository = {
  async get(): Promise<IClassification[]> {
    const result = await db.query(
      `
        SELECT * FROM ref.classification
        ORDER BY id ASC;
      `,
      [],
    );

    return result.rows;
  },
};
