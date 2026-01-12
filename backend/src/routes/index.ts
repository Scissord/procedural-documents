import { Router } from 'express';
import collectionsRoutes from './collection.routes';
import documentsRoutes from './document.routes';
import { health } from '@helpers';
const router = Router();

/**
 * Health check
 */
router.get('/health', health);
router.use('/collections', collectionsRoutes);
router.use('/documents', documentsRoutes);

export default router;
