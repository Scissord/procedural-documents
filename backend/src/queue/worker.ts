import 'dotenv/config';
import {
  DocumentService,
  JobService,
  closeRabbitMQ,
  consumeQueue,
  logger,
} from '@services';
import axios from 'axios';

interface JobMessage {
  job_id: number;
  document_id: number;
}

async function startWorker(): Promise<void> {
  await consumeQueue(async (payload: unknown) => {
    const { job_id, document_id } = payload as JobMessage;
    const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';

    logger.info(`Job received: ${job_id}`);

    // - get document
    const document = await DocumentService.getDocument(document_id);

    // - update job status to processing
    await JobService.updateJobStatus(job_id, 'processing');
    // - generate document
    const response = await axios({
      method: 'POST',
      url: `${apiBaseUrl}/api/documents/generate-from-situation`,
      data: {
        situation: document.situation,
      },
    });

    // - store result and set status
    if (response.status === 200) {
      // - update job status to completed
      await JobService.updateJobStatus(job_id, 'completed');
    } else {
      // - update job status to failed
      await JobService.updateJobStatus(job_id, 'failed');
    }
  });

  logger.info('RabbitMQ worker is running');
}

startWorker().catch((error: unknown) => {
  logger.error('RabbitMQ worker failed to start', { error });
  process.exit(1);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Worker shutting down (${signal})`);
  await closeRabbitMQ();
  process.exit(0);
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});
process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});
