import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import swagger from '@swagger';
import { logger } from '@services';
import routes from '@routes';
import cors from 'cors';
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
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to procedural-documents-backend!');
});
app.use('/api-docs', swagger());
app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  // '0 * * * *' - every hour for production
  // '* * * * *' - every minute for developing
  // cron.schedule('0 * * * *', async () => {
  //   try {
  //     logger.info('Cron job started: start_cron');
  //     await start_cron();
  //     logger.info('Cron job finished: start_cron');
  //   } catch (error) {
  //     logger.error(
  //       'Cron job failed: ' + (error instanceof Error ? error.stack : error),
  //     );
  //   }
  // });
});

export default app;
