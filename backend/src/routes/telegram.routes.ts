import { Router } from 'express';
import { bot } from '../bot/telegram';

const router = Router();
router.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});
export default router;
