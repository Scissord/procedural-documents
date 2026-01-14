import { Telegraf } from 'telegraf';
import axios from 'axios';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start((ctx) => ctx.reply('Отправь JSON для генерации документа'));

bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return;

  try {
    const data = JSON.parse(ctx.message.text);
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
    ctx.reply(`❌ Ошибка: ${error.message}`);
  }
});

export { bot };
