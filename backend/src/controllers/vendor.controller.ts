import { Response } from 'express';
import { db } from '../config/db';

export const vendorController = {
  /**
   * Vendor Dashboard analytical stats
   */
  async getDashboardStats(req: any, res: Response) {
    const storeId = req.user.storeId;
    if (!storeId) {
      return res.status(403).json({ message: 'Access denied. Vendor store not found.' });
    }

    try {
      // 1. Core metric counters
      const totalRevenueQ = `
        SELECT SUM(oi.price * oi.quantity) as total 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.store_id = $1 AND o.status != 'cancelled'
      `;

      const totalOrdersQ = `
        SELECT COUNT(DISTINCT oi.order_id) as total 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.store_id = $1 AND o.status != 'cancelled'
      `;

      const totalProductsQ = `
        SELECT COUNT(*) as total 
        FROM products 
        WHERE store_id = $1
      `;

      // 2. Monthly Revenue line chart data
      const monthlyRevenueQ = `
        SELECT TO_CHAR(o.created_at, 'Mon YYYY') as month, SUM(oi.price * oi.quantity) as revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.store_id = $1 AND o.status != 'cancelled'
        GROUP BY TO_CHAR(o.created_at, 'Mon YYYY'), DATE_TRUNC('month', o.created_at)
        ORDER BY DATE_TRUNC('month', o.created_at) ASC
        LIMIT 12
      `;

      // 3. Best Selling Products (for listing table)
      const bestSellersQ = `
        SELECT p.name, p.sku, SUM(oi.quantity) as sales, SUM(oi.price * oi.quantity) as revenue,
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_featured DESC LIMIT 1) as image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.store_id = $1 AND o.status != 'cancelled'
        GROUP BY p.id, p.name, p.sku
        ORDER BY sales DESC
        LIMIT 5
      `;

      // 4. Low stock products alert
      const lowStockQ = `
        SELECT p.name, p.sku, i.stock_quantity, i.low_stock_threshold
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        WHERE p.store_id = $1 AND i.stock_quantity <= i.low_stock_threshold
        ORDER BY i.stock_quantity ASC
      `;

      const [revRes, ordRes, prodRes, monthRes, bestRes, lowRes] = await Promise.all([
        db.query(totalRevenueQ, [storeId]),
        db.query(totalOrdersQ, [storeId]),
        db.query(totalProductsQ, [storeId]),
        db.query(monthlyRevenueQ, [storeId]),
        db.query(bestSellersQ, [storeId]),
        db.query(lowStockQ, [storeId]),
      ]);

      return res.status(200).json({
        metrics: {
          totalRevenue: parseFloat(revRes.rows[0]?.total || '0.00'),
          totalOrders: parseInt(ordRes.rows[0]?.total || '0', 10),
          totalProducts: parseInt(prodRes.rows[0]?.total || '0', 10),
        },
        monthlyRevenue: monthRes.rows,
        bestSellers: bestRes.rows,
        lowStock: lowRes.rows,
      });
    } catch (error) {
      console.error('Vendor dashboard stats error:', error);
      return res.status(500).json({ message: 'Error retrieving store statistics' });
    }
  },
};
