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
app.use('/api-docs', swagger());
app.use('/api', routes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;
