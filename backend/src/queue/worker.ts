import 'dotenv/config';
import { closeRabbitMQ, consumeQueue, logger } from '@services';

interface JobMessage {
  job_id: number;
  document_id: number;
}

async function startWorker(): Promise<void> {
  await consumeQueue(async (payload: unknown) => {
    const { job_id, document_id } = payload as JobMessage;

    logger.info(`Job received: ${job_id} for document ${document_id}`);

    // TODO: add document generation logic here
    // - update job status to processing
    // - generate document
    // - store result and set status
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
