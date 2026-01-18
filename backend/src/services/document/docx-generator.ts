import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  PageOrientation,
  convertInchesToTwip,
} from 'docx';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger } from '@services';

/**
 * Сервис для генерации DOCX файлов из текста докумета
 */
export const DocxGeneratorService = {
  /**
   * Создает DOCX файл из текста документа
   * Форматирует на 1 страницу с компактным оформлением
   */
  async createDocxFromText(documentText: string): Promise<string> {
    // Разбиваем текст на параграфы
    const lines = documentText
      .split('\n')
      .filter((line) => line.trim().length > 0);

    const paragraphs: Paragraph[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Определяем тип параграфа по содержимому
      if (
        line.startsWith('Исковое заявление') ||
        line.startsWith('ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ')
      ) {
        // Заголовок документа - по центру
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                bold: true,
                size: 28, // 14pt
                color: '000000', // черный цвет
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200, before: 200 },
          }),
        );
      } else if (line.match(/^(Шапка|Текст документа|Стадия|БЛОК)/)) {
        // Заголовок секции - скрываем, не добавляем
        continue;
      } else if (line.match(/^\[.*\]$/)) {
        // Разделитель секций в квадратных скобках
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                bold: true,
                size: 12,
                font: 'Times New Roman',
                color: '000000',
              }),
            ],
            spacing: { after: 100, before: 100 },
          }),
        );
      } else if (line.startsWith('В ') && !line.includes(':')) {
        // Название суда - по центру
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 22, // 11pt
                font: 'Times New Roman',
                color: '000000',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120, before: 0 },
          }),
        );
      } else if (
        line.startsWith('Адрес:') ||
        line.startsWith('Дело №:') ||
        line.startsWith('Контакты:') ||
        (line.includes('@') &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line.trim())) ||
        line.startsWith('Представитель')
      ) {
        // Адрес, дело №, контакты, email, представитель - справа
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 12, // 11pt
                font: 'Times New Roman',
                color: '000000',
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 60, before: 0 },
          }),
        );
      } else if (line.startsWith('Истец:') || line.startsWith('Ответчик:')) {
        // Истец/Ответчик - слева (название)
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 12, // 11pt
                font: 'Times New Roman',
                color: '000000',
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 60, before: 0 },
          }),
        );
      } else {
        // Обычный текст - слева
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 12, // 11pt
                font: 'Times New Roman',
                color: '000000',
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 60, before: 0 },
          }),
        );
      }
    }

    // Создаем документ с настройками для компактного размещения на 1 страницу
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: PageOrientation.PORTRAIT,
                width: convertInchesToTwip(8.27), // A4 width (21cm)
                height: convertInchesToTwip(11.69), // A4 height (29.7cm)
              },
              margin: {
                top: convertInchesToTwip(0.79), // 2cm
                right: convertInchesToTwip(0.79), // 2cm
                bottom: convertInchesToTwip(0.79), // 2cm
                left: convertInchesToTwip(0.79), // 2cm
              },
            },
          },
          children: paragraphs,
        },
      ],
      styles: {
        default: {
          document: {
            run: {
              font: 'Times New Roman',
              size: 22, // 11pt
            },
            paragraph: {
              spacing: {
                line: 240, // 1.15 line spacing
                lineRule: 'auto',
              },
            },
          },
        },
      },
    });

    // Генерируем буфер
    const buffer = await Packer.toBuffer(doc);

    // Создаем временный файл
    const tempDir = os.tmpdir();
    const fileName = `document_${Date.now()}.docx`;
    const filePath = path.join(tempDir, fileName);

    // Сохраняем файл
    fs.writeFileSync(filePath, buffer);

    return filePath;
  },

  /**
   * Удаляет временный файл
   */
  deleteTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Игнорируем ошибки при удалении временных файлов
      logger.error('Error deleting temp file', { error, filePath });
    }
  },
};
