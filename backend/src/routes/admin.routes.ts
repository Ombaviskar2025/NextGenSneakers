import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Apply admin guard to all routes
router.use(requireAdmin);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.banUser);
router.get('/vendors', adminController.listVendors);
router.put('/vendors/:id/status', adminController.updateVendorStatus);

export default router;
