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

const baseProperties = {
  size: 24, // 12pt
  font: 'Times New Roman',
  color: '000000', // черный цвет
};

const baseSpacing = { after: 100, before: 100 };

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

    const isHeaderLine = (line: string) =>
      (line.startsWith('В ') && !line.includes(':')) ||
      line.startsWith('Адрес:') ||
      line.startsWith('Истец:') ||
      line.startsWith('Ответчик:') ||
      line.startsWith('Контакты:') ||
      line.startsWith('Дело №:') ||
      line.startsWith('Email:') ||
      (line.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line.trim())) ||
      line.startsWith('Представитель');

    const isSectionMarker = (line: string) =>
      line.match(/^(Шапка|Текст документа|Стадия|БЛОК)/);

    const pushTitle = (title: string) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              ...baseProperties,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: baseSpacing,
        }),
      );
    };

    let pendingTitle: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Определяем тип параграфа по содержимому
      if (
        line.startsWith('Исковое заявление') ||
        line.startsWith('ИСКОВОЕ ЗАЯВЛЕНИЕ') ||
        line.startsWith('Предварительное решение суда') ||
        line.startsWith('ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ СУДА')
      ) {
        // Заголовок документа вставим после шапки, перед "Цена иска:"
        pendingTitle = line;
        continue;
      }

      if (
        pendingTitle &&
        (line.startsWith('Цена иска:') ||
          (!isHeaderLine(line) && !isSectionMarker(line)))
      ) {
        pushTitle(pendingTitle);
        pendingTitle = null;
      }

      if (isSectionMarker(line)) {
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
                ...baseProperties,
              }),
            ],
            spacing: baseSpacing,
          }),
        );
      } else if (line.startsWith('В ') && !line.includes(':')) {
        // Название суда - по центру
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                ...baseProperties,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: baseSpacing,
          }),
        );
      } else if (isHeaderLine(line)) {
        // Адрес, дело №, контакты, email, представитель - справа
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                ...baseProperties,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: baseSpacing,
          }),
        );
      } else {
        // Обычный текст - слева
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                ...baseProperties,
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: baseSpacing,
          }),
        );
      }
    }

    if (pendingTitle) {
      pushTitle(pendingTitle);
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
              size: 24, // 12pt
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
