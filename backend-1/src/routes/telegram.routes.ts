import { Router } from 'express';
import { bot } from '../bot/telegram';
import { logger } from '@services';

const router = Router();

router.post('/webhook', (req, res) => {
  logger.info('Webhook received', {
    updateId: req.body?.update_id,
    message: req.body?.message?.text,
  });
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

export default router;
