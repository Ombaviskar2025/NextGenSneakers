import { db } from '../config/db';

export interface AddressData {
  address_type: 'shipping' | 'billing';
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default?: boolean;
}

export const OrderModel = {
  // ==========================================
  // WISHLIST OPERATIONS
  // ==========================================

  async getWishlist(userId: string): Promise<any[]> {
    const query = `
      SELECT w.id as wishlist_item_id, w.created_at, p.id, p.name, p.slug, p.price, p.compare_at_price,
             (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_featured DESC LIMIT 1) as image_url,
             s.name as store_name
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `;
    const res = await db.query(query, [userId]);
    return res.rows;
  },

  async addToWishlist(userId: string, productId: string): Promise<boolean> {
    const query = `
      INSERT INTO wishlists (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
    `;
    const res = await db.query(query, [userId, productId]);
    return (res.rowCount ?? 0) > 0;
  },

  async removeFromWishlist(userId: string, productId: string): Promise<boolean> {
    const query = 'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2';
    const res = await db.query(query, [userId, productId]);
    return (res.rowCount ?? 0) > 0;
  },

  // ==========================================
  // CART OPERATIONS
  // ==========================================

  async getCart(userId: string): Promise<any[]> {
    const query = `
      SELECT c.id as cart_item_id, c.quantity, c.created_at, p.id as product_id, p.name, p.slug, p.price, p.sku,
             p.store_id, s.name as store_name, i.stock_quantity,
             (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_featured DESC LIMIT 1) as image_url
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;
    const res = await db.query(query, [userId]);
    return res.rows;
  },

  async addToCart(userId: string, productId: string, quantity: number): Promise<any> {
    const query = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id) 
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const res = await db.query(query, [userId, productId, quantity]);
    return res.rows[0];
  },

  async updateCartQuantity(userId: string, productId: string, quantity: number): Promise<boolean> {
    const query = `
      UPDATE cart_items 
      SET quantity = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = $2 AND product_id = $3
    `;
    const res = await db.query(query, [quantity, userId, productId]);
    return (res.rowCount ?? 0) > 0;
  },

  async removeFromCart(userId: string, productId: string): Promise<boolean> {
    const query = 'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2';
    const res = await db.query(query, [userId, productId]);
    return (res.rowCount ?? 0) > 0;
  },

  async clearCart(userId: string): Promise<void> {
    const query = 'DELETE FROM cart_items WHERE user_id = $1';
    await db.query(query, [userId]);
  },

  // ==========================================
  // ADDRESS OPERATIONS
  // ==========================================

  async getAddresses(userId: string): Promise<any[]> {
    const query = 'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC';
    const res = await db.query(query, [userId]);
    return res.rows;
  },

  async createAddress(userId: string, data: AddressData): Promise<any> {
    return db.transaction(async (client) => {
      // If setting as default, unset previous default
      if (data.is_default) {
        await client.query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
      }

      const query = `
        INSERT INTO addresses (user_id, address_type, full_name, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const res = await client.query(query, [
        userId,
        data.address_type,
        data.full_name,
        data.address_line1,
        data.address_line2 || null,
        data.city,
        data.state,
        data.postal_code,
        data.country,
        data.phone,
        data.is_default || false,
      ]);
      return res.rows[0];
    });
  },

  async deleteAddress(addressId: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM addresses WHERE id = $1 AND user_id = $2';
    const res = await db.query(query, [addressId, userId]);
    return (res.rowCount ?? 0) > 0;
  },

  // ==========================================
  // COUPON OPERATIONS
  // ==========================================

  async findCouponByCode(code: string): Promise<any | null> {
    const query = `
      SELECT * FROM coupons 
      WHERE code = $1 AND active = TRUE 
        AND start_date <= CURRENT_TIMESTAMP 
        AND end_date >= CURRENT_TIMESTAMP
    `;
    const res = await db.query(query, [code.toUpperCase().trim()]);
    return res.rows[0] || null;
  },

  async listCoupons(storeId?: string): Promise<any[]> {
    let query = 'SELECT * FROM coupons ORDER BY created_at DESC';
    const values: any[] = [];
    
    if (storeId) {
      query = 'SELECT * FROM coupons WHERE store_id = $1 OR store_id IS NULL ORDER BY created_at DESC';
      values.push(storeId);
    }
    
    const res = await db.query(query, values);
    return res.rows;
  },

  async createCoupon(data: {
    storeId?: string | null;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderValue?: number;
    startDate: Date;
    endDate: Date;
    maxUses?: number | null;
  }): Promise<any> {
    const query = `
      INSERT INTO coupons (store_id, code, type, value, min_order_value, start_date, end_date, max_uses, uses_count, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, TRUE)
      RETURNING *
    `;
    const res = await db.query(query, [
      data.storeId || null,
      data.code.toUpperCase().trim(),
      data.type,
      data.value,
      data.minOrderValue || 0.00,
      data.startDate,
      data.endDate,
      data.maxUses || null,
    ]);
    return res.rows[0];
  },

  async deleteCoupon(couponId: string, storeId?: string): Promise<boolean> {
    let query = 'DELETE FROM coupons WHERE id = $1';
    const params = [couponId];
    if (storeId) {
      query = 'DELETE FROM coupons WHERE id = $1 AND store_id = $2';
      params.push(storeId);
    }
    const res = await db.query(query, params);
    return (res.rowCount ?? 0) > 0;
  },

  // ==========================================
  // ORDERS & CHECKOUT WORKFLOW
  // ==========================================

  /**
   * Place Order (using db transaction)
   * Calculates amounts, checks inventory, updates inventory, updates coupon counts, clears cart.
   */
  async createOrder(
    customerId: string,
    data: {
      addressId: string;
      couponCode?: string;
      shippingAmount?: number;
    }
  ): Promise<any> {
    return db.transaction(async (client) => {
      // 1. Get cart items with inventory checks
      const cartItemsQuery = `
        SELECT c.quantity, p.id as product_id, p.price, p.store_id, p.name, i.stock_quantity
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE c.user_id = $1
      `;
      const cartRes = await client.query(cartItemsQuery, [customerId]);
      const cartItems = cartRes.rows;

      if (cartItems.length === 0) {
        throw new Error('Shopping cart is empty');
      }

      // Check stock
      for (const item of cartItems) {
        if (item.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product: ${item.name}. Available: ${item.stock_quantity}, Requested: ${item.quantity}`);
        }
      }

      // 2. Fetch shipping address
      const addressQuery = 'SELECT * FROM addresses WHERE id = $1 AND user_id = $2';
      const addressRes = await client.query(addressQuery, [data.addressId, customerId]);
      const address = addressRes.rows[0];
      if (!address) {
        throw new Error('Invalid delivery address selected');
      }

      // 3. Math calculations
      let itemsSubtotal = 0;
      for (const item of cartItems) {
        itemsSubtotal += parseFloat(item.price) * item.quantity;
      }

      let discountAmount = 0.00;
      let couponCodeUsed: string | null = null;

      // Handle Coupon logic
      if (data.couponCode) {
        const couponQuery = `
          SELECT * FROM coupons 
          WHERE code = $1 AND active = TRUE 
            AND start_date <= CURRENT_TIMESTAMP 
            AND end_date >= CURRENT_TIMESTAMP
        `;
        const couponRes = await client.query(couponQuery, [data.couponCode.toUpperCase().trim()]);
        const coupon = couponRes.rows[0];

        if (coupon) {
          const isMinOrderValid = itemsSubtotal >= parseFloat(coupon.min_order_value);
          const isUsesLeft = coupon.max_uses === null || coupon.uses_count < coupon.max_uses;
          
          if (isMinOrderValid && isUsesLeft) {
            couponCodeUsed = coupon.code;
            if (coupon.type === 'percentage') {
              discountAmount = itemsSubtotal * (parseFloat(coupon.value) / 100);
            } else {
              discountAmount = parseFloat(coupon.value);
            }
            // Cap discount to subtotal
            if (discountAmount > itemsSubtotal) {
              discountAmount = itemsSubtotal;
            }

            // Increment usage
            await client.query('UPDATE coupons SET uses_count = uses_count + 1 WHERE id = $1', [coupon.id]);
          }
        }
      }

      const shippingAmount = data.shippingAmount ?? 5.00; // Flat fee
      const taxAmount = (itemsSubtotal - discountAmount) * 0.08; // 8% sales tax
      const totalAmount = itemsSubtotal - discountAmount + taxAmount + shippingAmount;

      const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 4. Create Order Record
      const orderInsertQuery = `
        INSERT INTO orders (customer_id, order_number, status, total_amount, tax_amount, shipping_amount, discount_amount, coupon_code, shipping_address, billing_address)
        VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const orderRes = await client.query(orderInsertQuery, [
        customerId,
        orderNumber,
        totalAmount.toFixed(2),
        taxAmount.toFixed(2),
        shippingAmount.toFixed(2),
        discountAmount.toFixed(2),
        couponCodeUsed,
        JSON.stringify(address),
        JSON.stringify(address), // Default billing to shipping
      ]);
      const order = orderRes.rows[0];

      // 5. Insert Order Items & Deduct stock
      for (const item of cartItems) {
        // Insert order item
        const orderItemQuery = `
          INSERT INTO order_items (order_id, product_id, store_id, quantity, price, discount, status)
          VALUES ($1, $2, $3, $4, $5, 0.00, 'pending')
        `;
        await client.query(orderItemQuery, [
          order.id,
          item.product_id,
          item.store_id,
          item.quantity,
          item.price,
        ]);

        // Deduct inventory
        const inventoryDeductQuery = `
          UPDATE inventory 
          SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = $2
        `;
        await client.query(inventoryDeductQuery, [item.quantity, item.product_id]);
      }

      // 6. Clear shopping cart
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [customerId]);

      return order;
    });
  },

  /**
   * Get Order Details
   */
  async getOrderById(orderId: string): Promise<any | null> {
    const query = `
      SELECT o.*, u.full_name as customer_name, u.email as customer_email,
             (SELECT JSON_AGG(JSON_BUILD_OBJECT(
                'id', oi.id,
                'product_id', oi.product_id,
                'name', p.name,
                'slug', p.slug,
                'sku', p.sku,
                'quantity', oi.quantity,
                'price', oi.price,
                'status', oi.status,
                'store_name', s.name,
                'store_id', s.id,
                'image_url', (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_featured DESC LIMIT 1)
             )) FROM order_items oi 
             JOIN products p ON oi.product_id = p.id
             JOIN stores s ON oi.store_id = s.id
             WHERE oi.order_id = o.id) as items,
             p.id as payment_id, p.transaction_id, p.gateway, p.status as payment_status
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.id = $1
    `;
    const res = await db.query(query, [orderId]);
    return res.rows[0] || null;
  },

  async listOrdersForCustomer(customerId: string): Promise<any[]> {
    const query = `
      SELECT o.*,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
      FROM orders o
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC
    `;
    const res = await db.query(query, [customerId]);
    return res.rows;
  },

  async listOrdersForVendor(storeId: string): Promise<any[]> {
    const query = `
      SELECT o.id, o.order_number, o.created_at, o.shipping_address,
             oi.id as item_id, oi.quantity, oi.price, oi.status as item_status,
             p.name as product_name, p.slug as product_slug,
             pm.status as payment_status
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN payments pm ON o.id = pm.order_id
      WHERE oi.store_id = $1
      ORDER BY o.created_at DESC
    `;
    const res = await db.query(query, [storeId]);
    return res.rows;
  },

  async listOrdersForAdmin(): Promise<any[]> {
    const query = `
      SELECT o.*, u.full_name as customer_name,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count,
             p.status as payment_status
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id
      ORDER BY o.created_at DESC
    `;
    const res = await db.query(query);
    return res.rows;
  },

  /**
   * Update full order status
   */
  async updateOrderStatus(orderId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'): Promise<boolean> {
    const query = 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id';
    const res = await db.query(query, [status, orderId]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Update item status (Vendor task)
   */
  async updateOrderItemStatus(orderItemId: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'): Promise<boolean> {
    return db.transaction(async (client) => {
      // Update item status
      const itemQuery = 'UPDATE order_items SET status = $1 WHERE id = $2 RETURNING order_id';
      const itemRes = await client.query(itemQuery, [status, orderItemId]);
      const orderId = itemRes.rows[0]?.order_id;
      
      if (!orderId) return false;

      // Check if all items in this order are updated
      const statusCheckQuery = 'SELECT status FROM order_items WHERE order_id = $1';
      const statusRes = await client.query(statusCheckQuery, [orderId]);
      const statuses = statusRes.rows.map((row: any) => row.status);

      // Simple status propagation to main order:
      // If all items are delivered, order is delivered.
      // If all items are cancelled, order is cancelled.
      // Else if any is shipped, order is shipped.
      // Else processing.
      let newOrderStatus = 'processing';
      if (statuses.every((s: string) => s === 'delivered')) {
        newOrderStatus = 'delivered';
      } else if (statuses.every((s: string) => s === 'cancelled')) {
        newOrderStatus = 'cancelled';
      } else if (statuses.some((s: string) => s === 'shipped' || s === 'delivered')) {
        newOrderStatus = 'shipped';
      }

      await client.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [
        newOrderStatus,
        orderId,
      ]);

      return true;
    });
  },

  // ==========================================
  // PAYMENT LOGGING
  // ==========================================

  async createPayment(
    orderId: string,
    transactionId: string,
    gateway: 'stripe' | 'razorpay',
    amount: number,
    status: 'pending' | 'completed' | 'failed',
    payload: any = {}
  ): Promise<any> {
    const query = `
      INSERT INTO payments (order_id, transaction_id, gateway, amount, status, payload)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (transaction_id) 
      DO UPDATE SET status = EXCLUDED.status, payload = EXCLUDED.payload, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const res = await db.query(query, [
      orderId,
      transactionId,
      gateway,
      amount,
      status,
      JSON.stringify(payload),
    ]);
    return res.rows[0];
  },

  async updatePaymentStatus(transactionId: string, status: 'completed' | 'failed' | 'refunded', payload: any = {}): Promise<boolean> {
    return db.transaction(async (client) => {
      const query = `
        UPDATE payments 
        SET status = $1, payload = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE transaction_id = $3
        RETURNING order_id
      `;
      const res = await client.query(query, [status, JSON.stringify(payload), transactionId]);
      const orderId = res.rows[0]?.order_id;

      if (orderId && status === 'completed') {
        // Automatically progress order from pending to processing on successful payment
        await client.query("UPDATE orders SET status = 'processing' WHERE id = $1 AND status = 'pending'", [
          orderId,
        ]);
      }

      return (res.rowCount ?? 0) > 0;
    });
  },
};
