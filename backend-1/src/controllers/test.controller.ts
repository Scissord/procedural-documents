import { logger, JobService, DocumentService } from '@services';
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
      const { situation } = req.body;

      // Создаем запись о генерации документа
      const document = await DocumentService.createDocument(situation);

      // Создаём Job
      const job = await JobService.createJob(situation, document.id);

      // Пишем в очередь
      await JobService.writeToQueue(job.id, document.id);

      // Сразу 202 + jobId
      res.status(202).json({
        success: true,
        job_id: job.id,
        document_id: document.id,
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
