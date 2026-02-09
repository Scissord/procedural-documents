import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';
import { logger } from '@services';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://rabbitmq:5672';
const RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE ?? 'document-generation';
const RABBITMQ_PREFETCH = Number(process.env.RABBITMQ_PREFETCH ?? '1');

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

async function getChannel(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  const activeConnection = await connect(RABBITMQ_URL);
  activeConnection.on('error', (error) => {
    logger.error(`RabbitMQ connection error: ${error.message}`);
  });
  activeConnection.on('close', () => {
    logger.warn('RabbitMQ connection closed');
    connection = null;
    channel = null;
  });

  const activeChannel = await activeConnection.createChannel();
  await activeChannel.assertQueue(RABBITMQ_QUEUE, { durable: true });
  if (Number.isFinite(RABBITMQ_PREFETCH) && RABBITMQ_PREFETCH > 0) {
    await activeChannel.prefetch(RABBITMQ_PREFETCH);
  }

  connection = activeConnection;
  channel = activeChannel;
  return activeChannel;
}

export async function publishToQueue(payload: unknown): Promise<void> {
  const activeChannel = await getChannel();
  const message = Buffer.from(JSON.stringify(payload));
  activeChannel.sendToQueue(RABBITMQ_QUEUE, message, { persistent: true });
}

export async function consumeQueue(
  handler: (payload: unknown) => Promise<void>,
): Promise<void> {
  const activeChannel = await getChannel();
  await activeChannel.consume(
    RABBITMQ_QUEUE,
    async (message: ConsumeMessage | null) => {
      if (!message) {
        return;
      }

      try {
        const payload = JSON.parse(message.content.toString());
        await handler(payload);
        activeChannel.ack(message);
      } catch (error: unknown) {
        logger.error('RabbitMQ message processing failed', { error });
        activeChannel.nack(message, false, false);
      }
    },
    { noAck: false },
  );
}

export async function closeRabbitMQ(): Promise<void> {
  if (channel) {
    await channel.close();
  }
  if (connection) {
    await connection.close();
  }
  channel = null;
  connection = null;
}
