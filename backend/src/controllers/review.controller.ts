import { Request, Response } from 'express';
import { ReviewModel } from '../models/review.model';

export const reviewController = {
  /**
   * Add or update a product review
   */
  async createReview(req: any, res: Response) {
    const { productId, rating, title, comment } = req.body;
    const customerId = req.user.id;

    try {
      // Check if user bought the product (optional strict check, we can allow reviews for simplicity, or enforce)
      // For a production system, you can verify if a delivered order item exists for this customer.
      const boughtQuery = `
        SELECT DISTINCT oi.id 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.customer_id = $1 AND oi.product_id = $2 AND o.status = 'delivered'
      `;
      const boughtRes = await require('../config/db').db.query(boughtQuery, [customerId, productId]);
      
      const verifiedPurchase = boughtRes.rows.length > 0;

      const review = await ReviewModel.createReview({
        productId,
        customerId,
        rating,
        title,
        comment,
      });

      return res.status(201).json({
        message: 'Review submitted successfully',
        verifiedPurchase,
        review,
      });
    } catch (error) {
      console.error('Review submit error:', error);
      return res.status(500).json({ message: 'Error submitting review' });
    }
  },

  /**
   * Fetch approved reviews for a specific product
   */
  async listProductReviews(req: Request, res: Response) {
    const { productId } = req.params;
    try {
      const reviews = await ReviewModel.listReviewsForProduct(productId);
      return res.status(200).json(reviews);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving product reviews' });
    }
  },

  /**
   * Fetch all reviews (Admin overview)
   */
  async listReviewsAll(req: Request, res: Response) {
    try {
      const reviews = await ReviewModel.listReviewsAll();
      return res.status(200).json(reviews);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving reviews list' });
    }
  },

  /**
   * Update review approval status (Admin moderation)
   */
  async approveReview(req: Request, res: Response) {
    const { id } = req.params;
    const { isApproved } = req.body;

    try {
      const success = await ReviewModel.approveReview(id, isApproved);
      if (!success) {
        return res.status(404).json({ message: 'Review not found' });
      }
      return res.status(200).json({ message: `Review approval status set to ${isApproved}` });
    } catch (error) {
      return res.status(500).json({ message: 'Error moderating review' });
    }
  },

  /**
   * Delete review (Admin / Customer owner)
   */
  async deleteReview(req: any, res: Response) {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    try {
      const query = 'SELECT customer_id FROM reviews WHERE id = $1';
      const reviewRes = await require('../config/db').db.query(query, [id]);
      const review = reviewRes.rows[0];

      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      if (userRole !== 'admin' && review.customer_id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await ReviewModel.deleteReview(id);
      return res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting review' });
    }
  },
};
