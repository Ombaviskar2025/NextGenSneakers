import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { requireCustomer, requireVendor, requireAuth, requireAdmin } from '../middleware/auth.middleware';
import { validateSchema } from '../middleware/validation.middleware';
import { checkoutValidators } from '../utils/validators';

const router = Router();

// ==========================================
// WISHLIST (Customer Only)
// ==========================================
router.get('/wishlist', requireCustomer, orderController.getWishlist);
router.post('/wishlist', requireCustomer, orderController.addToWishlist);
router.delete('/wishlist/:productId', requireCustomer, orderController.removeFromWishlist);

// ==========================================
// CART (Customer Only)
// ==========================================
router.get('/cart', requireCustomer, orderController.getCart);
router.post('/cart', requireCustomer, orderController.addToCart);
router.put('/cart', requireCustomer, orderController.updateCartQuantity);
router.delete('/cart/:productId', requireCustomer, orderController.removeFromCart);

// ==========================================
// ADDRESSES (Customer Only)
// ==========================================
router.get('/address', requireCustomer, orderController.getAddresses);
router.post('/address', requireCustomer, validateSchema(checkoutValidators.address), orderController.createAddress);
router.delete('/address/:id', requireCustomer, orderController.deleteAddress);

// ==========================================
// COUPONS
// ==========================================
router.get('/coupons', requireVendor, orderController.listCoupons);
router.post('/coupons', requireVendor, validateSchema(checkoutValidators.coupon), orderController.createCoupon);
router.delete('/coupons/:id', requireVendor, orderController.deleteCoupon);
router.get('/coupons/apply/:code', requireCustomer, orderController.checkCouponValidity);

// ==========================================
// ORDERS & CHECKOUT
// ==========================================
router.post('/checkout', requireCustomer, validateSchema(checkoutValidators.order), orderController.checkout);
router.get('/', requireAuth, orderController.listOrders);
router.get('/:id', requireAuth, orderController.getOrderDetails);
router.get('/:id/invoice', requireAuth, orderController.downloadInvoice);

// Order statuses updates
router.put('/:id/status', requireAdmin, orderController.updateOrderStatus);
router.put('/item/:itemId/status', requireVendor, orderController.updateOrderItemStatus);

// ==========================================
// PAYMENTS
// ==========================================
router.post('/payment/session', requireCustomer, orderController.createPaymentSession);
router.post('/payment/verify', requireCustomer, orderController.verifyPayment);

export default router;
