import { Document, Packer, Paragraph, TextRun } from 'docx';

export const DocumentExportService = {
  async toDocxBuffer(text: string): Promise<Buffer> {
    const raw = typeof text === 'string' ? text.trim() : '';
    const lines = raw.length > 0 ? raw.split(/\r?\n/) : [''];

    const paragraphs = lines.map(
      (line) =>
        new Paragraph({
          children: [new TextRun(line)],
        }),
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    return Packer.toBuffer(doc);
  },
};
