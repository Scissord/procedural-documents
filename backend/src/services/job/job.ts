import { db, publishToQueue } from '@services';

interface IJob {
  id: number;
  situation: string;
  document_id: number;
}

export const JobService = {
  async getJob(job_id: number): Promise<IJob> {
    const query = `
      SELECT * FROM app.job WHERE id = $1
    `;

    const job = await db.query(query, [job_id]);

    return job.rows[0];
  },

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

  async updateJobStatus(job_id: number, status: string): Promise<IJob> {
    const query = `
      UPDATE app.job
      SET status = $1
      WHERE id = $2
    `;

    const job = await db.query(query, [status, job_id]);

    return job.rows[0] as IJob;
  },
};
