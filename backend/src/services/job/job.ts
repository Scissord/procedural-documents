import { db, publishToQueue } from '@services';

interface IJob {
  id: number;
  situation: string;
  document_id: number;
}

export const JobService = {
  async createJob(situation: string, document_id: number): Promise<IJob> {
    const query = `
      INSERT INTO app.job (situation, document_id)
      VALUES ($1, $2)
      RETURNING id;
    `;

    const job = await db.query(query, [situation, document_id]);

    return job.rows[0];
  },

  async writeToQueue(job_id: number, document_id: number): Promise<void> {
    await publishToQueue({
      job_id,
      document_id,
    });
  },
};
