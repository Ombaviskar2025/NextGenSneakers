import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateSchema } from '../middleware/validation.middleware';
import { authValidators } from '../utils/validators';

const router = Router();

router.post('/register', validateSchema(authValidators.register), authController.register);
router.post('/login', validateSchema(authValidators.login), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', validateSchema(authValidators.forgotPassword), authController.forgotPassword);
router.post('/reset-password', validateSchema(authValidators.resetPassword), authController.resetPassword);
router.post('/google', authController.googleLogin);

// Protected profile operations
router.get('/profile', requireAuth, authController.getProfile);
router.put('/profile', requireAuth, authController.updateProfile);
router.post('/apply-vendor', requireAuth, validateSchema(authValidators.createVendor), authController.applyForVendor);

export default router;
