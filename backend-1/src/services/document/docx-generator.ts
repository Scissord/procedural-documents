import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  PageOrientation,
  convertInchesToTwip,
  TabStopType,
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
      (line.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line.trim())) ||
      line.startsWith('Представитель') ||
      line.startsWith('Цена иска:');

    const isSectionMarker = (line: string) =>
      line.match(/^(Шапка|Текст документа|Стадия|БЛОК)/);

    const getPluralForm = (value: number, forms: [string, string, string]) => {
      const mod100 = value % 100;
      if (mod100 >= 11 && mod100 <= 19) {
        return forms[2];
      }
      const mod10 = value % 10;
      if (mod10 === 1) {
        return forms[0];
      }
      if (mod10 >= 2 && mod10 <= 4) {
        return forms[1];
      }
      return forms[2];
    };

    const numberToWordsRu = (value: number) => {
      if (!Number.isFinite(value)) {
        return '';
      }
      if (value === 0) {
        return 'ноль';
      }

      const unitsMale = [
        '',
        'один',
        'два',
        'три',
        'четыре',
        'пять',
        'шесть',
        'семь',
        'восемь',
        'девять',
      ];
      const unitsFemale = [
        '',
        'одна',
        'две',
        'три',
        'четыре',
        'пять',
        'шесть',
        'семь',
        'восемь',
        'девять',
      ];
      const teens = [
        'десять',
        'одиннадцать',
        'двенадцать',
        'тринадцать',
        'четырнадцать',
        'пятнадцать',
        'шестнадцать',
        'семнадцать',
        'восемнадцать',
        'девятнадцать',
      ];
      const tens = [
        '',
        '',
        'двадцать',
        'тридцать',
        'сорок',
        'пятьдесят',
        'шестьдесят',
        'семьдесят',
        'восемьдесят',
        'девяносто',
      ];
      const hundreds = [
        '',
        'сто',
        'двести',
        'триста',
        'четыреста',
        'пятьсот',
        'шестьсот',
        'семьсот',
        'восемьсот',
        'девятьсот',
      ];

      const groupToWords = (num: number, gender: 'male' | 'female') => {
        const words: string[] = [];
        const h = Math.floor(num / 100);
        const t = Math.floor((num % 100) / 10);
        const u = num % 10;

        if (h > 0) {
          words.push(hundreds[h]);
        }

        if (t === 1) {
          words.push(teens[u]);
        } else {
          if (t > 1) {
            words.push(tens[t]);
          }
          if (u > 0) {
            words.push((gender === 'female' ? unitsFemale : unitsMale)[u]);
          }
        }

        return words.join(' ');
      };

      const groups = [
        {
          value: 1_000_000_000,
          forms: ['миллиард', 'миллиарда', 'миллиардов'],
          gender: 'male' as const,
        },
        {
          value: 1_000_000,
          forms: ['миллион', 'миллиона', 'миллионов'],
          gender: 'male' as const,
        },
        {
          value: 1000,
          forms: ['тысяча', 'тысячи', 'тысяч'],
          gender: 'female' as const,
        },
      ];

      let remainder = value;
      const parts: string[] = [];

      for (const group of groups) {
        const groupValue = Math.floor(remainder / group.value);
        if (groupValue > 0) {
          parts.push(groupToWords(groupValue, group.gender));
          parts.push(
            getPluralForm(groupValue, group.forms as [string, string, string]),
          );
          remainder %= group.value;
        }
      }

      if (remainder > 0) {
        parts.push(groupToWords(remainder, 'male'));
      }

      return parts.join(' ').trim();
    };

    const formatClaimPriceLine = (line: string) => {
      if (!line.startsWith('Цена иска:')) {
        return line;
      }
      if (line.includes('(') && line.includes(')')) {
        return line;
      }

      const rest = line.replace('Цена иска:', '').trim();
      const numberMatch = rest.match(/[\d\s]+/);
      if (!numberMatch) {
        return line;
      }
      const numberRaw = numberMatch[0].trim();
      const numberDigits = numberRaw.replace(/\s+/g, '');
      if (!numberDigits) {
        return line;
      }
      const numberValue = Number(numberDigits);
      if (!Number.isFinite(numberValue)) {
        return line;
      }

      const words = numberToWordsRu(numberValue);
      if (!words) {
        return line;
      }

      return `Цена иска: ${numberRaw} (${words}) тенге`;
    };

    const isIndentedLine = (line: string) =>
      line.startsWith('Описательная часть') ||
      line.startsWith('Мотивировочная часть') ||
      line.startsWith('На основании изложенного');

    const isBoldSectionLine = (line: string) =>
      line.startsWith('Описательная часть') ||
      line.startsWith('Мотивировочная часть') ||
      line.includes('ПРОШУ СУД');

    const labelLinePrefixes = ['Истец:', 'Ответчик:', 'Представитель:'];
    const isLabelLine = (line: string) =>
      labelLinePrefixes.some((prefix) => line.startsWith(prefix));

    const buildLabelLine = (line: string) => {
      const [label, ...restParts] = line.split(':');
      const rest = restParts.join(':').trim();
      // A4 usable width with 2cm margins ~6.69"
      const rightTab = convertInchesToTwip(6.69);

      return new Paragraph({
        children: [
          new TextRun({
            text: `${label}:`,
            ...baseProperties,
          }),
          new TextRun({
            text: '\t',
            ...baseProperties,
          }),
          new TextRun({
            text: rest,
            ...baseProperties,
          }),
        ],
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: rightTab,
          },
        ],
        alignment: AlignmentType.LEFT,
        spacing: baseSpacing,
      });
    };

    const buildBoldSectionLine = (line: string) => {
      const needsIndent = isIndentedLine(line);
      const indent = needsIndent ? { firstLine: convertInchesToTwip(0.3) } : {};

      if (line.includes('ПРОШУ СУД')) {
        const [before, after] = line.split('ПРОШУ СУД');
        const beforeText = before.trim();
        const afterText = after.trim().replace(/^[:\s]+/, '');

        if (beforeText.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: beforeText,
                  ...baseProperties,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: baseSpacing,
              indent,
            }),
          );
        }

        const titleParagraph = new Paragraph({
          children: [
            new TextRun({
              text: 'ПРОШУ СУД:',
              bold: true,
              ...baseProperties,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: baseSpacing,
        });

        if (afterText.length > 0) {
          paragraphs.push(titleParagraph);
          return new Paragraph({
            children: [
              new TextRun({
                text: afterText,
                ...baseProperties,
              }),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: baseSpacing,
          });
        }

        return titleParagraph;
      }

      if (
        line.startsWith('Описательная часть') ||
        line.startsWith('Мотивировочная часть')
      ) {
        const heading = line.startsWith('Описательная часть')
          ? 'Описательная часть'
          : 'Мотивировочная часть';
        const rest = line.slice(heading.length).trim();

        return new Paragraph({
          children: [
            new TextRun({
              text: heading,
              bold: true,
              ...baseProperties,
            }),
            ...(rest.length > 0
              ? [
                  new TextRun({
                    text: ` ${rest}`,
                    ...baseProperties,
                  }),
                ]
              : []),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: baseSpacing,
          indent,
        });
      }

      return new Paragraph({
        children: [
          new TextRun({
            text: line,
            bold: true,
            ...baseProperties,
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: baseSpacing,
        indent,
      });
    };

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
    let justifyBody = false;
    let lastWasPriceLine = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Определяем тип параграфа по содержимому
      if (
        line.startsWith('Исковое заявление') ||
        line.startsWith('ИСКОВОЕ ЗАЯВЛЕНИЕ') ||
        line.startsWith('Предварительное решение суда') ||
        line.startsWith('ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ СУДА') ||
        line.startsWith('ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕСУДА')
      ) {
        // Заголовок документа вставим после шапки, перед "Цена иска:"
        pendingTitle = line.replace(
          /ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕСУДА/g,
          'ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ СУДА',
        );
        if (
          pendingTitle.startsWith('Предварительное решение суда') ||
          pendingTitle.startsWith('ПРЕДВАРИТЕЛЬНОЕ РЕШЕНИЕ СУДА')
        ) {
          justifyBody = true;
        }
        continue;
      }

      if (
        pendingTitle &&
        (line.startsWith('Цена иска:') ||
          (!isHeaderLine(line) && !isSectionMarker(line)))
      ) {
        if (lastWasPriceLine) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '',
                  ...baseProperties,
                }),
              ],
              spacing: baseSpacing,
            }),
          );
        }
        pushTitle(pendingTitle);
        pendingTitle = null;
        lastWasPriceLine = false;
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
      } else if (line.startsWith('Цена иска:')) {
        const formattedLine = formatClaimPriceLine(line);
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: formattedLine,
                bold: true,
                ...baseProperties,
              }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: baseSpacing,
          }),
        );
        lastWasPriceLine = true;
      } else if (isLabelLine(line)) {
        paragraphs.push(buildLabelLine(line));
        lastWasPriceLine = false;
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
        lastWasPriceLine = false;
      } else if (isBoldSectionLine(line)) {
        paragraphs.push(buildBoldSectionLine(line));
        lastWasPriceLine = false;
      } else {
        // Обычный текст - слева
        const indent = isIndentedLine(line)
          ? { firstLine: convertInchesToTwip(0.3) }
          : {};

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                ...baseProperties,
              }),
            ],
            alignment: justifyBody
              ? AlignmentType.JUSTIFIED
              : AlignmentType.LEFT,
            spacing: baseSpacing,
            indent,
          }),
        );
        lastWasPriceLine = false;
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
