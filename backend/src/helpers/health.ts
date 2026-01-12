import { Request, Response } from 'express';

export const health = async (req: Request, res: Response): Promise<void> => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
