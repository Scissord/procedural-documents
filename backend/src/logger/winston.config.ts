import { WinstonModuleOptions } from 'nest-winston';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const ensureLogsDirExists = (logsDirAbsPath: string) => {
  if (!fs.existsSync(logsDirAbsPath)) {
    fs.mkdirSync(logsDirAbsPath, { recursive: true });
  }
};

const safeToString = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack ?? value.message;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const timestamp = typeof info.timestamp === 'string' ? info.timestamp : '';
    const level = safeToString(info.level);
    const message = safeToString(info.message);
    const stackRaw = (info as { stack?: unknown }).stack;
    const stack = stackRaw ? safeToString(stackRaw) : '';

    const meta: Record<string, unknown> = { ...info };
    delete meta.timestamp;
    delete meta.level;
    delete meta.message;
    delete meta.stack;

    const metaString =
      Object.keys(meta).length > 0 ? ` ${safeToString(meta)}` : '';

    const msg = stack ? `${message}\n${stack}` : message;
    return `${timestamp} [${level}]: ${msg}${metaString}`.trim();
  }),
);

export const buildWinstonLogger = (level: string): WinstonModuleOptions => {
  const logsDirAbsPath = path.resolve(process.cwd(), 'logs');
  ensureLogsDirExists(logsDirAbsPath);

  return {
    level,
    transports: [
      new winston.transports.Console({
        level,
        format: winston.format.combine(winston.format.colorize(), logFormat),
      }),
      new DailyRotateFile({
        level,
        dirname: logsDirAbsPath,
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      }),
    ],
  };
};
