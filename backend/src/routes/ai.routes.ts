import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Description generation (Needs auth)
router.post('/generate-description', requireAuth, aiController.generateDescription);

// Insights report (Needs auth - vendor/admin checked in controller)
router.get('/insights', requireAuth, aiController.getSalesInsights);

// Recommendations (Publicly accessible)
router.get('/recommendations/:productId', aiController.getRecommendations);

export default router;
