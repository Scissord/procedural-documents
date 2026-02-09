import { logger } from '@services';
import { normalizeError } from '@helpers';
import { Request, Response } from 'express';
import { CollectionService } from '@services';
import path from 'path';

/**
 * Контроллер для работы с коллекциями QDRANT
 */
export const CollectionController = {
  // TODO: save collections in db, if and field - status, if uploaded, than skip upload
  async uploadKzGk(req: Request, res: Response): Promise<void> {
    try {
      const collectionName = `kz_gk`;

      for (let i = 1; i <= 2; i++) {
        const pdfPath = path.resolve(
          process.cwd(),
          'src',
          'docs',
          'collections',
          'kz_gk',
          `kz_gk_${i}.pdf`,
        );

        const text = await CollectionService.readPdf(pdfPath);
        const articleChunks = await CollectionService.splitByArticles(text);
        const docs =
          articleChunks.length > 0
            ? await CollectionService.createArticleDocuments(
                articleChunks,
                collectionName,
              )
            : await CollectionService.createDocuments(
                await CollectionService.splitText(text),
                collectionName,
              );

        await CollectionService.uploadToQdrant(docs, collectionName);
      }

      logger.info(`completed upload collection ${collectionName}`);

      res.status(200).send('OK');
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Failed to upload collection', { error: message });
      res.status(500).send('Internal server error');
    }
  },

  async uploadKzGpk(req: Request, res: Response): Promise<void> {
    try {
      const collectionName = 'kz_gpk';
      const pdfPath = path.resolve(
        process.cwd(),
        'src',
        'docs',
        'collections',
        'kz_gpk',
        'kz_gpk.pdf',
      );

      const text = await CollectionService.readPdf(pdfPath);
      const articleChunks = await CollectionService.splitByArticles(text);
      const docs =
        articleChunks.length > 0
          ? await CollectionService.createArticleDocuments(
              articleChunks,
              collectionName,
            )
          : await CollectionService.createDocuments(
              await CollectionService.splitText(text),
              collectionName,
            );

      await CollectionService.uploadToQdrant(docs, collectionName);

      logger.info(`completed upload collection ${collectionName}`);

      res.status(200).send('OK');
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Failed to upload collection', { error: message });
      res.status(500).send('Internal server error');
    }
  },

  async uploadKzCivilPractice(req: Request, res: Response): Promise<void> {
    try {
      const collectionName = 'kz_civil_practice';
      const pdfPath = path.resolve(
        process.cwd(),
        'src',
        'docs',
        'collections',
        'kz_civil_practice',
        'kz_civil_practice.pdf',
      );

      const text = await CollectionService.readPdf(pdfPath);
      const articleChunks = await CollectionService.splitByArticles(text);
      const docs =
        articleChunks.length > 0
          ? await CollectionService.createArticleDocuments(
              articleChunks,
              collectionName,
            )
          : await CollectionService.createDocuments(
              await CollectionService.splitText(text),
              collectionName,
            );

      await CollectionService.uploadToQdrant(docs, collectionName);

      logger.info(`completed upload collection ${collectionName}`);

      res.status(200).send('OK');
    } catch (error: unknown) {
      const message = normalizeError(error);
      logger.error('Failed to upload collection', { error: message });
      res.status(500).send('Internal server error');
    }
  },
};
