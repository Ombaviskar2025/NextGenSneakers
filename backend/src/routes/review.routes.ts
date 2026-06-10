import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { requireCustomer, requireAdmin, requireAuth } from '../middleware/auth.middleware';
import { validateSchema } from '../middleware/validation.middleware';
import { reviewValidators } from '../utils/validators';

const router = Router();

router.post('/', requireCustomer, validateSchema(reviewValidators.createReview), reviewController.createReview);
router.get('/product/:productId', reviewController.listProductReviews);

// Admin Moderation
router.get('/', requireAdmin, reviewController.listReviewsAll);
router.put('/:id/approve', requireAdmin, reviewController.approveReview);
router.delete('/:id', requireAuth, reviewController.deleteReview);

export default router;
