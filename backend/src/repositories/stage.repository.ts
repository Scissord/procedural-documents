import { db } from '@services';
import { IStage } from '@interfaces';

export const StageRepository = {
  async get(classification_id: number): Promise<IStage[]> {
    const result = await db.query(
      `
        SELECT * FROM ref.stage
        WHERE classification_id = $1
        ORDER BY id ASC;
      `,
      [classification_id],
    );

    return result.rows;
  },
};
