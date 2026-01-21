import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import swagger from '@swagger';
import { logger } from '@services';
import routes from '@routes';
import cors from 'cors';
import { bot } from './bot/telegram';
// import cron from 'node-cron';

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(
  cors({
    origin: '*',
    credentials: true,
  }),
);
app.use('/api-docs', swagger());
app.use('/api', routes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Запуск Telegram бота
if (process.env.TELEGRAM_BOT_TOKEN) {
  const webhookPath = '/api/telegram/webhook';
  const webhookUrl = process.env.WEBHOOK_URL
    ? process.env.WEBHOOK_URL.endsWith(webhookPath)
      ? process.env.WEBHOOK_URL
      : `${process.env.WEBHOOK_URL}${webhookPath}`
    : `${process.env.API_BASE_URL || `http://localhost:${PORT}`}${webhookPath}`;

  bot.telegram
    .setWebhook(webhookUrl)
    .then(() => {
      logger.info(`Telegram bot webhook set to: ${webhookUrl}`);
    })
    .catch((error: unknown) => {
      logger.error('Failed to set Telegram webhook', { error });
    });
} else {
  logger.warn('TELEGRAM_BOT_TOKEN not set, Telegram bot disabled');
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default app;
