import { Telegraf } from 'telegraf';
import axios from 'axios';
import { logger } from '@services';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start((ctx) => {
  logger.info('Bot start command', { userId: ctx.from?.id });
  ctx.reply('Отправь JSON и хуй не надо для генерации документа');
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text;

  if (text.startsWith('/')) {
    ctx.reply(
      '❓ Неизвестная команда. Отправьте JSON для генерации документа.',
    );
    return;
  }

  try {
    const data = JSON.parse(text);
    const msg = await ctx.reply('⏳ Обрабатываю...');

    const res = await axios.post(
      `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/documents/generate`,
      data,
      { timeout: 300000 },
    );

    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id);
    await ctx.reply(`✅ Документ:\n\n\`\`\`\n${res.data.document}\n\`\`\``, {
      parse_mode: 'Markdown',
    });
  } catch (error: any) {
    logger.error('Bot error', { error: error.message });
    const errorMsg =
      error.response?.data?.error ||
      error.message ||
      'Ошибка при обработке запроса';
    ctx.reply(`❌ Ошибка: ${errorMsg}`);
  }
});

export { bot };
