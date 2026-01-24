import { Router } from 'express';
import collectionsRoutes from './collection.routes';
import documentsRoutes from './document.routes';
import telegramRoutes from './telegram.routes';
import authRoutes from './auth.routes';
import testRoutes from './test.routes';
import classificationRoutes from './classification.routes';
import stageRoutes from './stage.routes';
import { health } from '@helpers';
const router = Router();

/**
 * Health check
 */
router.get('/health', health);
router.use('/collections', collectionsRoutes);
router.use('/documents', documentsRoutes);
router.use('/telegram', telegramRoutes);
router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/classifications', classificationRoutes);
router.use('/stages', stageRoutes);

export default router;
