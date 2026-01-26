import { Telegraf, Markup } from 'telegraf';
import axios from 'axios';
import { logger, DocxGeneratorService } from '@services';
import fs from 'fs';
import { documents } from '../tables/documents';
import { stages } from '../tables/stages';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!, {
  handlerTimeout: 300000,
});

const safeAnswerCbQuery = async (ctx: any, text?: string) => {
  try {
    await ctx.answerCbQuery(text);
  } catch (error) {
    logger.warn('Failed to answer callback query', { error });
  }
};

const DOCUMENTS_PER_PAGE = 6;

type UserState = {
  stageId?: number;
  documentId?: number;
  classificationId?: number;
  roleId?: number;
  awaitingSituation?: boolean;
};

const userStates = new Map<number, UserState>();

const getUserState = (userId: number): UserState => {
  const state = userStates.get(userId);
  if (state) {
    return state;
  }
  const newState: UserState = {};
  userStates.set(userId, newState);
  return newState;
};

const buildStageKeyboard = () =>
  Markup.inlineKeyboard(
    stages.map((stage) => [
      Markup.button.callback(stage.name, `stage:${stage.id}`),
    ]),
  );

const getStageDocuments = (stageId: number) =>
  documents.filter((doc) => doc.stage_id === stageId);

const buildDocumentKeyboard = (stageId: number, page: number) => {
  const stageDocs = getStageDocuments(stageId);
  const totalPages = Math.max(
    1,
    Math.ceil(stageDocs.length / DOCUMENTS_PER_PAGE),
  );
  const currentPage = Math.min(Math.max(page, 0), totalPages - 1);
  const startIndex = currentPage * DOCUMENTS_PER_PAGE;
  const pageDocs = stageDocs.slice(startIndex, startIndex + DOCUMENTS_PER_PAGE);

  const rows = pageDocs.map((doc) => [
    Markup.button.callback(doc.name_ru, `doc:${doc.id}`),
  ]);

  const navRow = [];
  if (currentPage > 0) {
    navRow.push(
      Markup.button.callback('⬅️ Назад', `page:${stageId}:${currentPage - 1}`),
    );
  }
  if (currentPage < totalPages - 1) {
    navRow.push(
      Markup.button.callback('Дальше ➡️', `page:${stageId}:${currentPage + 1}`),
    );
  }
  if (navRow.length > 0) {
    rows.push(navRow);
  }

  rows.push([Markup.button.callback('⬅️ К стадиям', 'stages')]);

  return Markup.inlineKeyboard(rows);
};

const resetUserState = (userId: number) => {
  userStates.set(userId, {});
};

const promptStageSelection = async (ctx: any) => {
  const userId = ctx.from?.id;
  if (typeof userId === 'number') {
    resetUserState(userId);
  }
  await ctx.reply('Выберите стадию:', buildStageKeyboard());
};

bot.start((ctx) => {
  logger.info('Bot start command', { userId: ctx.from?.id });
  ctx.reply(
    '👋 Привет! Сначала выберите стадию, затем тип документа. После этого отправьте описание ситуации.',
  );
  return promptStageSelection(ctx);
});

bot.command('stage', async (ctx) => {
  return promptStageSelection(ctx);
});

bot.action('stages', async (ctx) => {
  await safeAnswerCbQuery(ctx);
  return promptStageSelection(ctx);
});

bot.action(/stage:(\d+)/, async (ctx) => {
  await safeAnswerCbQuery(ctx);
  const stageId = Number(ctx.match[1]);
  const stage = stages.find((item) => item.id === stageId);
  if (!stage) {
    await safeAnswerCbQuery(ctx, 'Стадия не найдена');
    return;
  }
  const userId = ctx.from?.id;
  if (typeof userId === 'number') {
    const state = getUserState(userId);
    state.stageId = stageId;
    state.documentId = undefined;
    state.classificationId = undefined;
    state.roleId = undefined;
    state.awaitingSituation = false;
  }
  await ctx.editMessageText(
    `Стадия: ${stage.name}\nВыберите тип документа:`,
    buildDocumentKeyboard(stageId, 0),
  );
});

bot.action(/page:(\d+):(\d+)/, async (ctx) => {
  await safeAnswerCbQuery(ctx);
  const stageId = Number(ctx.match[1]);
  const page = Number(ctx.match[2]);
  const stage = stages.find((item) => item.id === stageId);
  if (!stage) {
    await safeAnswerCbQuery(ctx, 'Стадия не найдена');
    return;
  }
  await ctx.editMessageText(
    `Стадия: ${stage.name}\nВыберите тип документа:`,
    buildDocumentKeyboard(stageId, page),
  );
});

bot.action(/doc:(\d+)/, async (ctx) => {
  await safeAnswerCbQuery(ctx);
  const documentId = Number(ctx.match[1]);
  const document = documents.find((doc) => doc.id === documentId);
  if (!document) {
    await safeAnswerCbQuery(ctx, 'Документ не найден');
    return;
  }
  const userId = ctx.from?.id;
  if (typeof userId === 'number') {
    const state = getUserState(userId);
    state.documentId = documentId;
    state.stageId = document.stage_id;
    state.classificationId = document.classification_id;
    state.roleId = document.role_id;
    state.awaitingSituation = true;
  }
  await ctx.editMessageText(
    `Тип документа: ${document.name_ru}\nТеперь отправьте описание ситуации.`,
    Markup.inlineKeyboard([Markup.button.callback('⬅️ К стадиям', 'stages')]),
  );
});

bot.on('text', async (ctx: any) => {
  const text = ctx.message.text;

  if (text.startsWith('/')) {
    await ctx.reply('Используйте /start или /stage для выбора стадии.');
    return;
  }

  const userId = ctx.from?.id;
  const state = typeof userId === 'number' ? getUserState(userId) : undefined;
  if (!state?.documentId || !state.stageId || !state.awaitingSituation) {
    await ctx.reply(
      'Сначала выберите стадию и тип документа.',
      buildStageKeyboard(),
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
      `${process.env.API_BASE_URL || 'http://localhost:3001'}/api/documents/telegram/generate`,
      {
        situation: text,
        document_id: state.documentId,
      },
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
    state.awaitingSituation = false;
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
