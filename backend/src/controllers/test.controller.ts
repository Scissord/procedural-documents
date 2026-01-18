import { logger, JobService } from '@services';
import { normalizeError } from '@helpers';
import { Request, Response } from 'express';

/**
 * Контроллер для работы с юридическими документами
 */
export const TestController = {
  /**
   * Генерация юридического документа
   * POST /api/documents/generate
   **/
  async generateDocument(req: Request, res: Response): Promise<void> {
    // message - situation
    // user_id - user_id
    try {
      const { situation, document_id = 1 } = req.body;

      // Создаём Job
      const job = await JobService.createJob(situation, document_id);

      // Пишем в очередь
      await JobService.writeToQueue(job.id, document_id);

      // Сразу 202 + jobId
      res.status(202).json({
        success: true,
        jobId: job.id,
      });
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error(`
        Failed to generate document
        Error: ${message}
      `);
      res.status(500).json({
        success: false,
        error: 'Ошибка при генерации документа',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      });
    }
  },
};
