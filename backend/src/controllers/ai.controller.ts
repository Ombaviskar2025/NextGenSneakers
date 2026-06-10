import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { db } from '../config/db';

export const aiController = {
  /**
   * AI SEO Product Description Generator
   */
  async generateDescription(req: Request, res: Response) {
    const { name, features } = req.body;

    if (!name || !features || !Array.isArray(features)) {
      return res.status(400).json({ message: 'Product name and bullet features list are required.' });
    }

    try {
      const description = await aiService.generateProductDescription(name, features);
      return res.status(200).json({ description });
    } catch (error: any) {
      return res.status(500).json({ message: 'AI Generation failed', error: error.message });
    }
  },

  /**
   * AI Recommendation Engine
   */
  async getRecommendations(req: Request, res: Response) {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required.' });
    }

    try {
      const recommendations = await aiService.getRecommendations(productId);
      return res.status(200).json(recommendations);
    } catch (error: any) {
      return res.status(500).json({ message: 'AI Recommendations fetch failed', error: error.message });
    }
  },

  /**
   * AI Sales Insights (Vendor or Admin only)
   */
  async getSalesInsights(req: any, res: Response) {
    const storeId = req.user.storeId;
    const role = req.user.role;

    try {
      let storeName = 'All Platform';
      let queryParams: any[] = [];
      let revenueFilter = '';
      let ordersFilter = '';
      let itemsFilter = '';

      if (role === 'vendor') {
        if (!storeId) {
          return res.status(400).json({ message: 'Vendor store credentials not found' });
        }
        
        // Fetch store name
        const storeNameQ = 'SELECT name FROM stores WHERE id = $1';
        const storeRes = await db.query(storeNameQ, [storeId]);
        storeName = storeRes.rows[0]?.name || 'Vendor Store';
        
        queryParams = [storeId];
        revenueFilter = 'WHERE oi.store_id = $1 AND o.status != \'cancelled\'';
        ordersFilter = 'WHERE oi.store_id = $1 AND o.status != \'cancelled\'';
        itemsFilter = 'WHERE oi.store_id = $1 AND o.status != \'cancelled\'';
      } else if (role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      } else {
        revenueFilter = 'WHERE status = \'completed\'';
        ordersFilter = 'WHERE status != \'cancelled\'';
        itemsFilter = 'WHERE o.status != \'cancelled\'';
      }

      // 1. Fetch sales summary stats
      const totalRevQuery = role === 'vendor'
        ? `SELECT SUM(oi.price * oi.quantity) as total FROM order_items oi JOIN orders o ON oi.order_id = o.id ${revenueFilter}`
        : `SELECT SUM(amount) as total FROM payments ${revenueFilter}`;
        
      const totalOrdersQuery = role === 'vendor'
        ? `SELECT COUNT(DISTINCT oi.order_id) as total FROM order_items oi JOIN orders o ON oi.order_id = o.id ${ordersFilter}`
        : `SELECT COUNT(*) as total FROM orders ${ordersFilter}`;

      // 2. Fetch monthly trend
      const monthlyQuery = role === 'vendor'
        ? `
          SELECT TO_CHAR(o.created_at, 'Mon YYYY') as month, SUM(oi.price * oi.quantity) as revenue
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          ${itemsFilter}
          GROUP BY TO_CHAR(o.created_at, 'Mon YYYY'), DATE_TRUNC('month', o.created_at)
          ORDER BY DATE_TRUNC('month', o.created_at) ASC
          LIMIT 6
        `
        : `
          SELECT TO_CHAR(created_at, 'Mon YYYY') as month, SUM(amount) as revenue
          FROM payments
          WHERE status = 'completed'
          GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
          ORDER BY DATE_TRUNC('month', created_at) ASC
          LIMIT 6
        `;

      // 3. Fetch top products
      const topProductsQuery = role === 'vendor'
        ? `
          SELECT p.name, SUM(oi.quantity) as sales, SUM(oi.price * oi.quantity) as revenue
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN orders o ON oi.order_id = o.id
          ${itemsFilter}
          GROUP BY p.id, p.name
          ORDER BY sales DESC
          LIMIT 5
        `
        : `
          SELECT p.name, SUM(oi.quantity) as sales, SUM(oi.price * oi.quantity) as revenue
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          JOIN orders o ON oi.order_id = o.id
          ${itemsFilter}
          GROUP BY p.id, p.name
          ORDER BY sales DESC
          LIMIT 5
        `;

      const [revRes, ordRes, monthRes, bestRes] = await Promise.all([
        db.query(totalRevQuery, queryParams),
        db.query(totalOrdersQuery, queryParams),
        db.query(monthlyQuery, queryParams),
        db.query(topProductsQuery, queryParams),
      ]);

      const stats = {
        totalRevenue: parseFloat(revRes.rows[0]?.total || '0.00'),
        totalOrders: parseInt(ordRes.rows[0]?.total || '0', 10),
        monthlyRevenue: monthRes.rows.map((r: any) => ({ month: r.month, revenue: parseFloat(r.revenue) })),
        topProducts: bestRes.rows.map((r: any) => ({ name: r.name, sales: parseInt(r.sales), revenue: parseFloat(r.revenue) })),
      };

      // Call AI Service to write summary
      const insights = await aiService.generateSalesInsights(storeName, stats);
      return res.status(200).json({ insights });
    } catch (error: any) {
      console.error('Insights generation error:', error);
      return res.status(500).json({ message: 'Could not generate sales insights', error: error.message });
    }
  },
};
