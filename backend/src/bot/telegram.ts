import { Telegraf } from 'telegraf';
import axios from 'axios';
import { logger, DocxGeneratorService } from '@services';
import fs from 'fs';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start((ctx) => {
  logger.info('Bot start command', { userId: ctx.from?.id });
  ctx.reply('Отправьте описание ситуации для генерации документа');
});

bot.on('text', async (ctx: any) => {
  const text = ctx.message.text;

  // Игнорируем команды
  if (text.startsWith('/')) {
    ctx.reply(
      '❓ Неизвестная команда. Отправьте описание ситуации для генерации документа.',
    );
    return;
  }

  let iskFilePath: string | null = null;
  let reshenieFilePath: string | null = null;
  const progressMessages: number[] = [];

  try {
    // Прогресс 1: Обрабатываю
    const msg1 = await ctx.reply('⏳ Обрабатываю...');
    progressMessages.push(msg1.message_id);

    // Генерируем документ через API
    const res = await axios.post(
      `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/documents/generate-from-situation`,
      { situation: text },
      { timeout: 300000 },
    );

    if (!res.data.success || !res.data.document) {
      throw new Error(res.data.error || 'Ошибка генерации документа');
    }

    // Прогресс 2: Генерирую документ
    const msg2 = await ctx.reply('📝 Генерирую документ...');
    progressMessages.push(msg2.message_id);

    // Прогресс 3: Формирую файлы
    const msg3 = await ctx.reply('📄 Формирую файлы...');
    progressMessages.push(msg3.message_id);

    // Разделяем текст на 2 документа
    const fullText = res.data.document;
    const parts = fullText.split('ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ');
    const iskText = parts[0].trim();
    const reshenieText =
      parts.length > 1 ? 'ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ' + parts[1].trim() : '';

    // Создаем DOCX файл исковое заявление
    iskFilePath = await DocxGeneratorService.createDocxFromText(iskText);

    // Создаем DOCX файл предварительное решение суда
    if (reshenieText) {
      reshenieFilePath =
        await DocxGeneratorService.createDocxFromText(reshenieText);
    }

    // Отправляем исковое заявление
    await ctx.replyWithDocument({
      source: fs.createReadStream(iskFilePath),
      filename: `iskovoe_zayavlenie_${Date.now()}.docx`,
    });

    // Отправляем решение суда (если есть)
    if (reshenieFilePath) {
      await ctx.replyWithDocument({
        source: fs.createReadStream(reshenieFilePath),
        filename: `reshenie_suda_${Date.now()}.docx`,
      });
    }

    // Удаляем временные сообщения прогресса
    for (const msgId of progressMessages) {
      try {
        await ctx.deleteMessage(msgId);
      } catch (error) {
        // Игнорируем ошибки при удалении сообщений
        logger.warn('Failed to delete progress message', { msgId, error });
      }
    }

    // Удаляем временные файлы
    if (iskFilePath) {
      DocxGeneratorService.deleteTempFile(iskFilePath);
    }
    if (reshenieFilePath) {
      DocxGeneratorService.deleteTempFile(reshenieFilePath);
    }

    await ctx.reply('✅ Документы готовы!');
  } catch (error: any) {
    logger.error('Bot error', { error: error.message });

    // Удаляем временные сообщения прогресса при ошибке
    for (const msgId of progressMessages) {
      try {
        await ctx.deleteMessage(msgId);
      } catch (deleteError) {
        // Игнорируем ошибки при удалении сообщений
        logger.warn('Failed to delete progress message', {
          msgId,
          error: deleteError,
        });
      }
    }

    // Удаляем временные файлы при ошибке
    if (iskFilePath) {
      DocxGeneratorService.deleteTempFile(iskFilePath);
    }
    if (reshenieFilePath) {
      DocxGeneratorService.deleteTempFile(reshenieFilePath);
    }

    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.details ||
      error.message ||
      'Ошибка при обработке запроса';
    ctx.reply(`❌ Ошибка: ${errorMsg}`);
  }
});

export { bot };
