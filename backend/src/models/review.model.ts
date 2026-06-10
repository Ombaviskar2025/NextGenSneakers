import { db } from '../config/db';

export const ReviewModel = {
  /**
   * Add a product review
   */
  async createReview(data: {
    productId: string;
    customerId: string;
    rating: number;
    title?: string;
    comment?: string;
  }): Promise<any> {
    const query = `
      INSERT INTO reviews (product_id, customer_id, rating, title, comment, is_approved)
      VALUES ($1, $2, $3, $4, $5, TRUE) -- Auto-approved by default; Admin can moderate/hide
      ON CONFLICT (product_id, customer_id)
      DO UPDATE SET rating = EXCLUDED.rating, title = EXCLUDED.title, comment = EXCLUDED.comment, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const res = await db.query(query, [
      data.productId,
      data.customerId,
      data.rating,
      data.title || null,
      data.comment || null,
    ]);
    return res.rows[0];
  },

  /**
   * Fetch approved reviews for a specific product
   */
  async listReviewsForProduct(productId: string): Promise<any[]> {
    const query = `
      SELECT r.*, u.full_name as customer_name, u.avatar_url as customer_avatar
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      WHERE r.product_id = $1 AND r.is_approved = TRUE
      ORDER BY r.created_at DESC
    `;
    const res = await db.query(query, [productId]);
    return res.rows;
  },

  /**
   * Fetch all reviews (Admin overview)
   */
  async listReviewsAll(): Promise<any[]> {
    const query = `
      SELECT r.*, u.full_name as customer_name, p.name as product_name
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `;
    const res = await db.query(query);
    return res.rows;
  },

  /**
   * Update review approval status (Admin action)
   */
  async approveReview(reviewId: string, isApproved: boolean): Promise<boolean> {
    const query = `
      UPDATE reviews 
      SET is_approved = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id
    `;
    const res = await db.query(query, [isApproved, reviewId]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<boolean> {
    const query = 'DELETE FROM reviews WHERE id = $1';
    const res = await db.query(query, [reviewId]);
    return (res.rowCount ?? 0) > 0;
  },
};
