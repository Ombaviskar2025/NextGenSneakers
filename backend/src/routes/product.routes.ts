import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { requireAdmin, requireVendor, requireAuth } from '../middleware/auth.middleware';
import { validateSchema } from '../middleware/validation.middleware';
import { productValidators } from '../utils/validators';

const router = Router();

// ==========================================
// CATEGORIES ROUTES (Admin Moderated)
// ==========================================
router.get('/categories', productController.listCategories);
router.post('/categories', requireAdmin, validateSchema(productValidators.category), productController.createCategory);
router.put('/categories/:id', requireAdmin, validateSchema(productValidators.category), productController.updateCategory);
router.delete('/categories/:id', requireAdmin, productController.deleteCategory);

// ==========================================
// PRODUCTS ROUTES
// ==========================================
// Public Browsing
router.get('/', productController.listProducts);
router.get('/:slugOrId', productController.getProduct);

// Vendor store products list
router.get('/store/my-products', requireVendor, productController.listStoreProducts);

// Vendor catalog management
router.post('/', requireVendor, validateSchema(productValidators.createProduct), productController.createProduct);
router.put('/:id', requireVendor, validateSchema(productValidators.createProduct), productController.updateProduct);
router.delete('/:id', requireAuth, productController.deleteProduct);

// Admin Moderation / Approvals
router.put('/:id/approve', requireAdmin, productController.approveProduct);
router.put('/:id/feature', requireAdmin, productController.featureProduct);

export default router;
