import { Router } from 'express';
import { vendorController } from '../controllers/vendor.controller';
import { requireVendor } from '../middleware/auth.middleware';

const router = Router();

router.get('/dashboard', requireVendor, vendorController.getDashboardStats);

export default router;
