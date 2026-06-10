import { Response } from 'express';
import { OrderModel } from '../models/order.model';
import { ProductModel } from '../models/product.model';
import { paymentService } from '../services/payment.service';
import { socketService } from '../services/socket.service';
import { invoiceService } from '../services/invoice.service';

export const orderController = {
  // ==========================================
  // WISHLIST
  // ==========================================

  async getWishlist(req: any, res: Response) {
    try {
      const items = await OrderModel.getWishlist(req.user.id);
      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching wishlist' });
    }
  },

  async addToWishlist(req: any, res: Response) {
    const { productId } = req.body;
    try {
      await OrderModel.addToWishlist(req.user.id, productId);
      return res.status(201).json({ message: 'Added to wishlist' });
    } catch (error) {
      return res.status(500).json({ message: 'Error adding to wishlist' });
    }
  },

  async removeFromWishlist(req: any, res: Response) {
    const { productId } = req.params;
    try {
      await OrderModel.removeFromWishlist(req.user.id, productId);
      return res.status(200).json({ message: 'Removed from wishlist' });
    } catch (error) {
      return res.status(500).json({ message: 'Error removing from wishlist' });
    }
  },

  // ==========================================
  // CART
  // ==========================================

  async getCart(req: any, res: Response) {
    try {
      const items = await OrderModel.getCart(req.user.id);
      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching cart' });
    }
  },

  async addToCart(req: any, res: Response) {
    const { productId, quantity = 1 } = req.body;
    try {
      // Verify stock availability
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (product.stock_quantity < quantity) {
        return res.status(400).json({ 
          message: `Only ${product.stock_quantity} items available in stock` 
        });
      }

      const cartItem = await OrderModel.addToCart(req.user.id, productId, quantity);
      return res.status(201).json({ message: 'Added to cart', cartItem });
    } catch (error) {
      return res.status(500).json({ message: 'Error adding to cart' });
    }
  },

  async updateCartQuantity(req: any, res: Response) {
    const { productId, quantity } = req.body;
    
    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than zero' });
    }

    try {
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (product.stock_quantity < quantity) {
        return res.status(400).json({ 
          message: `Only ${product.stock_quantity} items available in stock` 
        });
      }

      await OrderModel.updateCartQuantity(req.user.id, productId, quantity);
      return res.status(200).json({ message: 'Cart updated successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating cart' });
    }
  },

  async removeFromCart(req: any, res: Response) {
    const { productId } = req.params;
    try {
      await OrderModel.removeFromCart(req.user.id, productId);
      return res.status(200).json({ message: 'Removed from cart' });
    } catch (error) {
      return res.status(500).json({ message: 'Error removing from cart' });
    }
  },

  // ==========================================
  // ADDRESSES
  // ==========================================

  async getAddresses(req: any, res: Response) {
    try {
      const addresses = await OrderModel.getAddresses(req.user.id);
      return res.status(200).json(addresses);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching addresses' });
    }
  },

  async createAddress(req: any, res: Response) {
    try {
      const address = await OrderModel.createAddress(req.user.id, req.body);
      return res.status(201).json({ message: 'Address added successfully', address });
    } catch (error) {
      return res.status(500).json({ message: 'Error adding address' });
    }
  },

  async deleteAddress(req: any, res: Response) {
    const { id } = req.params;
    try {
      const success = await OrderModel.deleteAddress(id, req.user.id);
      if (!success) {
        return res.status(404).json({ message: 'Address not found' });
      }
      return res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting address' });
    }
  },

  // ==========================================
  // COUPONS
  // ==========================================

  async listCoupons(req: any, res: Response) {
    try {
      const coupons = await OrderModel.listCoupons(req.user.storeId);
      return res.status(200).json(coupons);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching coupons' });
    }
  },

  async createCoupon(req: any, res: Response) {
    try {
      const coupon = await OrderModel.createCoupon({
        ...req.body,
        storeId: req.user.storeId, // Vendor coupon linked to vendor's store
      });
      return res.status(201).json({ message: 'Coupon created successfully', coupon });
    } catch (error) {
      return res.status(500).json({ message: 'Error creating coupon' });
    }
  },

  async deleteCoupon(req: any, res: Response) {
    const { id } = req.params;
    try {
      const success = await OrderModel.deleteCoupon(id, req.user.storeId);
      if (!success) {
        return res.status(404).json({ message: 'Coupon not found' });
      }
      return res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting coupon' });
    }
  },

  async checkCouponValidity(req: any, res: Response) {
    const { code } = req.params;
    try {
      const coupon = await OrderModel.findCouponByCode(code);
      if (!coupon) {
        return res.status(400).json({ message: 'Coupon code is invalid, expired, or inactive' });
      }
      return res.status(200).json(coupon);
    } catch (error) {
      return res.status(500).json({ message: 'Error checking coupon' });
    }
  },

  // ==========================================
  // CHECKOUT & ORDERS
  // ==========================================

  /**
   * Checkout cart and place order
   */
  async checkout(req: any, res: Response) {
    const { addressId, couponCode } = req.body;
    const customerId = req.user.id;

    try {
      // Create order in transaction
      const order = await OrderModel.createOrder(customerId, { addressId, couponCode });

      // Notify vendor store owners about new orders
      const detailedOrder = await OrderModel.getOrderById(order.id);
      if (detailedOrder && detailedOrder.items) {
        // Collect distinct store IDs in this order
        const stores = new Set<string>();
        detailedOrder.items.forEach((item: any) => stores.add(item.store_id));
        
        stores.forEach((storeId) => {
          socketService.notifyStore(storeId, {
            title: 'New Order Received',
            message: `A customer placed a new order containing items from your store. Order ID: ${order.order_number}`,
            type: 'order',
          });
        });
      }

      return res.status(201).json({
        message: 'Order created successfully. Please finalize payment.',
        order,
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      return res.status(400).json({ message: error.message || 'Checkout failed.' });
    }
  },

  /**
   * List Orders based on Role
   */
  async listOrders(req: any, res: Response) {
    const userRole = req.user.role;
    try {
      if (userRole === 'admin') {
        const orders = await OrderModel.listOrdersForAdmin();
        return res.status(200).json(orders);
      } else if (userRole === 'vendor') {
        if (!req.user.storeId) {
          return res.status(400).json({ message: 'Vendor store not found' });
        }
        const orders = await OrderModel.listOrdersForVendor(req.user.storeId);
        return res.status(200).json(orders);
      } else {
        const orders = await OrderModel.listOrdersForCustomer(req.user.id);
        return res.status(200).json(orders);
      }
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving orders' });
    }
  },

  /**
   * Get Order Details
   */
  async getOrderDetails(req: any, res: Response) {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;
    const storeId = req.user.storeId;

    try {
      const order = await OrderModel.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Authorization guard
      if (userRole === 'customer' && order.customer_id !== userId) {
        return res.status(403).json({ message: 'Access denied. You do not own this order.' });
      }

      if (userRole === 'vendor') {
        // Filter items in the response to only show this vendor's products
        const ownedItems = order.items.filter((item: any) => item.store_id === storeId);
        if (ownedItems.length === 0) {
          return res.status(403).json({ message: 'Access denied. No items from your store in this order.' });
        }
        order.items = ownedItems;
      }

      return res.status(200).json(order);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving order details' });
    }
  },

  /**
   * Download Invoice PDF
   */
  async downloadInvoice(req: any, res: Response) {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
      const order = await OrderModel.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (userRole === 'customer' && order.customer_id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      invoiceService.generateInvoicePdf(order, res);
    } catch (error) {
      console.error('Invoice generation error:', error);
      return res.status(500).json({ message: 'Error downloading invoice' });
    }
  },

  /**
   * Update Order Item Status (Vendor task)
   */
  async updateOrderItemStatus(req: any, res: Response) {
    const { itemId } = req.params;
    const { status } = req.body; // 'processing' | 'shipped' | 'delivered' | 'cancelled'
    const storeId = req.user.storeId;

    try {
      // Find order item details
      const query = 'SELECT * FROM order_items WHERE id = $1';
      const itemRes = await require('../config/db').db.query(query, [itemId]);
      const item = itemRes.rows[0];

      if (!item) {
        return res.status(404).json({ message: 'Order item not found' });
      }

      if (item.store_id !== storeId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await OrderModel.updateOrderItemStatus(itemId, status);

      // Notify customer about order status change
      const orderQuery = 'SELECT customer_id, order_number FROM orders WHERE id = $1';
      const orderRes = await require('../config/db').db.query(orderQuery, [item.order_id]);
      const order = orderRes.rows[0];

      if (order) {
        socketService.sendNotification(order.customer_id, {
          title: 'Order Status Update',
          message: `Your item in order #${order.order_number} has been updated to '${status}'.`,
          type: 'order',
        });
      }

      return res.status(200).json({ message: 'Item status updated successfully' });
    } catch (error) {
      console.error('Update item status error:', error);
      return res.status(500).json({ message: 'Error updating status' });
    }
  },

  /**
   * Update full order status (Admin task)
   */
  async updateOrderStatus(req: any, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    try {
      const success = await OrderModel.updateOrderStatus(id, status);
      if (!success) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const order = await OrderModel.getOrderById(id);
      socketService.sendNotification(order.customer_id, {
        title: 'Order Status Changed',
        message: `Your order #${order.order_number} status has been updated to '${status}'.`,
        type: 'order',
      });

      return res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating order status' });
    }
  },

  // ==========================================
  // PAYMENT INTEGRATIONS
  // ==========================================

  /**
   * Initialize Stripe Payment Intent or Razorpay Order
   */
  async createPaymentSession(req: any, res: Response) {
    const { orderId, gateway } = req.body; // gateway: 'stripe' | 'razorpay'

    try {
      const order = await OrderModel.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order.customer_id !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const amount = parseFloat(order.total_amount);

      if (gateway === 'stripe') {
        const session = await paymentService.createStripePaymentIntent(amount, 'usd', orderId);
        // Save pending payment record
        await OrderModel.createPayment(orderId, session.id, 'stripe', amount, 'pending', session);
        return res.status(200).json(session);
      } else {
        const orderRes = await paymentService.createRazorpayOrder(amount, 'INR', order.order_number);
        // Save pending payment record
        await OrderModel.createPayment(orderId, orderRes.id, 'razorpay', amount, 'pending', orderRes);
        return res.status(200).json(orderRes);
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      return res.status(500).json({ message: error.message || 'Payment setup failed' });
    }
  },

  /**
   * Verify Payment (Razorpay or Client-Side Stripe Confirmation)
   */
  async verifyPayment(req: any, res: Response) {
    const { gateway, transactionId, status, razorpayPaymentId, razorpaySignature } = req.body;

    try {
      if (gateway === 'razorpay') {
        // Razorpay signature validation
        const isValid = paymentService.verifyRazorpayPayment(transactionId, razorpayPaymentId, razorpaySignature);
        if (!isValid) {
          await OrderModel.updatePaymentStatus(transactionId, 'failed', { error: 'Signature mismatch' });
          return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
        }

        await OrderModel.updatePaymentStatus(transactionId, 'completed', { razorpayPaymentId });
        return res.status(200).json({ message: 'Payment verified successfully.' });
      } else {
        // Stripe: client tells us payment is completed
        const isSuccess = status === 'succeeded' || status === 'completed';
        const finalStatus = isSuccess ? 'completed' : 'failed';
        await OrderModel.updatePaymentStatus(transactionId, finalStatus, req.body);
        
        return res.status(200).json({ message: `Stripe payment logged as ${finalStatus}.` });
      }
    } catch (error) {
      console.error('Payment verify error:', error);
      return res.status(500).json({ message: 'Payment logging failed' });
    }
  },
};
