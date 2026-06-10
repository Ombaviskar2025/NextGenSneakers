import { Request, Response } from 'express';
import { db } from '../config/db';
import { UserModel } from '../models/user.model';
import { emailService } from '../services/email.service';

export const adminController = {
  /**
   * Admin Analytics Dashboard Statistics
   */
  async getDashboardStats(req: Request, res: Response) {
    try {
      // 1. Core counter metrics
      const usersCountQ = "SELECT COUNT(*) as total FROM users JOIN roles r ON users.role_id = r.id WHERE r.name = 'customer'";
      const vendorsCountQ = "SELECT COUNT(*) as total FROM vendors WHERE status = 'approved'";
      const productsCountQ = 'SELECT COUNT(*) as total FROM products';
      const ordersCountQ = 'SELECT COUNT(*) as total FROM orders';
      const revenueTotalQ = "SELECT SUM(amount) as total FROM payments WHERE status = 'completed'";

      // 2. Revenue by month (for Chart.js line graph)
      const monthlyRevenueQ = `
        SELECT TO_CHAR(created_at, 'Mon YYYY') as month, SUM(amount) as revenue
        FROM payments
        WHERE status = 'completed'
        GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
        LIMIT 12
      `;

      // 3. Category Sales Distribution (for Chart.js doughnut chart)
      const categorySalesQ = `
        SELECT c.name as category, SUM(oi.price * oi.quantity) as sales
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status != 'cancelled'
        GROUP BY c.name
        ORDER BY sales DESC
      `;

      // Run queries concurrently
      const [uRes, vRes, pRes, oRes, revRes, monthRes, catRes] = await Promise.all([
        db.query(usersCountQ),
        db.query(vendorsCountQ),
        db.query(productsCountQ),
        db.query(ordersCountQ),
        db.query(revenueTotalQ),
        db.query(monthlyRevenueQ),
        db.query(categorySalesQ),
      ]);

      return res.status(200).json({
        metrics: {
          totalUsers: parseInt(uRes.rows[0]?.total || '0', 10),
          totalVendors: parseInt(vRes.rows[0]?.total || '0', 10),
          totalProducts: parseInt(pRes.rows[0]?.total || '0', 10),
          totalOrders: parseInt(oRes.rows[0]?.total || '0', 10),
          totalRevenue: parseFloat(revRes.rows[0]?.total || '0.00'),
        },
        monthlyRevenue: monthRes.rows,
        categorySales: catRes.rows,
      });
    } catch (error) {
      console.error('Admin dashboard stats error:', error);
      return res.status(500).json({ message: 'Error retrieving platform statistics' });
    }
  },

  /**
   * List Users (excluding Admin)
   */
  async listUsers(req: Request, res: Response) {
    try {
      const users = await UserModel.listUsers();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving users' });
    }
  },

  /**
   * Ban / Delete User
   */
  async banUser(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const success = await UserModel.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({ message: 'User account removed from platform.' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting user' });
    }
  },

  /**
   * List Vendors
   */
  async listVendors(req: Request, res: Response) {
    try {
      const vendors = await UserModel.listVendors();
      return res.status(200).json(vendors);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving vendors list' });
    }
  },

  /**
   * Approve / Reject / Suspend Vendor Status
   */
  async updateVendorStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected' | 'suspended'

    try {
      const vendor = await UserModel.updateVendorStatus(id, status);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor application not found' });
      }

      // Fetch vendor user details to send status email
      const user = await UserModel.findById(vendor.user_id);
      if (user) {
        emailService.sendVendorStatusEmail(user.email, vendor.business_name, status).catch((err) => {
          console.error('Failed to send vendor status notification email:', err);
        });
      }

      return res.status(200).json({ 
        message: `Vendor status updated to '${status}' successfully.`, 
        vendor 
      });
    } catch (error) {
      console.error('Update vendor status error:', error);
      return res.status(500).json({ message: 'Error updating vendor status' });
    }
  },
};
