import { Pool } from 'pg';
import { logger } from '@services';
import { normalizeError } from '@helpers';

export const db = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  max: 50,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30000,
});

db.on('error', (err: unknown) => {
  logger.error(`🔥 PG POOL ERROR: ${JSON.stringify(err, null, 2)}`);
  const error = normalizeError(err);
  logger.error(error);
});

// export const db_replica = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_REPLICA_NAME,
//   password: process.env.DB_PASSWORD,
//   port: Number(process.env.DB_PORT),
//   max: 50,
// });
