import { db } from '../config/db';

export interface ProductFilterOptions {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  storeId?: string;
  isApproved?: boolean;
  status?: 'draft' | 'published' | 'rejected';
  isFeatured?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc' | 'created_desc';
  page?: number;
  limit?: number;
}

export const ProductModel = {
  // ==========================================
  // CATEGORIES OPERATIONS
  // ==========================================

  async listCategories(): Promise<any[]> {
    const query = `
      SELECT c.*, p.name as parent_name
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.name ASC
    `;
    const res = await db.query(query);
    return res.rows;
  },

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string | null;
  }): Promise<any> {
    const query = `
      INSERT INTO categories (name, slug, description, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const res = await db.query(query, [
      data.name,
      data.slug.toLowerCase().trim(),
      data.description || null,
      data.parentId || null,
    ]);
    return res.rows[0];
  },

  async updateCategory(
    id: string,
    data: { name?: string; slug?: string; description?: string; parentId?: string | null }
  ): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let counter = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${counter++}`);
      values.push(data.name);
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${counter++}`);
      values.push(data.slug.toLowerCase().trim());
    }
    if (data.description !== undefined) {
      updates.push(`description = $${counter++}`);
      values.push(data.description);
    }
    if (data.parentId !== undefined) {
      updates.push(`parent_id = $${counter++}`);
      values.push(data.parentId);
    }

    if (updates.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE categories 
      SET ${updates.join(', ')} 
      WHERE id = $${counter} 
      RETURNING *
    `;
    const res = await db.query(query, values);
    return res.rows[0] || null;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const query = 'DELETE FROM categories WHERE id = $1';
    const res = await db.query(query, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  // ==========================================
  // PRODUCTS OPERATIONS
  // ==========================================

  /**
   * Find detailed Product by ID
   */
  async findById(id: string): Promise<any | null> {
    const query = `
      SELECT p.*, s.name as store_name, s.slug as store_slug, c.name as category_name, c.slug as category_slug,
             i.stock_quantity, i.low_stock_threshold,
             COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND is_approved = TRUE), 0.0) as rating,
             COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = TRUE), 0) as reviews_count,
             (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', img.id, 'image_url', img.image_url, 'is_featured', img.is_featured)) 
              FROM product_images img WHERE img.product_id = p.id) as images
      FROM products p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1
    `;
    const res = await db.query(query, [id]);
    return res.rows[0] || null;
  },

  /**
   * Find product by SKU
   */
  async findBySku(sku: string): Promise<any | null> {
    const query = 'SELECT * FROM products WHERE sku = $1';
    const res = await db.query(query, [sku]);
    return res.rows[0] || null;
  },

  /**
   * Find detailed Product by Slug
   */
  async findBySlug(slug: string): Promise<any | null> {
    const query = `
      SELECT p.*, s.name as store_name, s.slug as store_slug, c.name as category_name, c.slug as category_slug,
             i.stock_quantity, i.low_stock_threshold,
             COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND is_approved = TRUE), 0.0) as rating,
             COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = TRUE), 0) as reviews_count,
             (SELECT JSON_AGG(JSON_BUILD_OBJECT('id', img.id, 'image_url', img.image_url, 'is_featured', img.is_featured)) 
              FROM product_images img WHERE img.product_id = p.id) as images
      FROM products p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.slug = $1
    `;
    const res = await db.query(query, [slug]);
    return res.rows[0] || null;
  },

  /**
   * Create Product (using db transaction)
   */
  async createProduct(data: {
    storeId: string;
    categoryId?: string;
    name: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    sku: string;
    stockQuantity: number;
    lowStockThreshold?: number;
    images: { image_url: string; is_featured: boolean }[];
    status?: 'draft' | 'published';
  }): Promise<any> {
    return db.transaction(async (client) => {
      // 1. Generate slug
      const baseSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

      // 2. Insert product
      const productQuery = `
        INSERT INTO products (store_id, category_id, name, slug, description, price, compare_at_price, sku, is_approved, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9)
        RETURNING *
      `;
      const productRes = await client.query(productQuery, [
        data.storeId,
        data.categoryId || null,
        data.name,
        slug,
        data.description || null,
        data.price,
        data.compareAtPrice || null,
        data.sku,
        data.status || 'draft',
      ]);
      const product = productRes.rows[0];

      // 3. Insert inventory
      const inventoryQuery = `
        INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold)
        VALUES ($1, $2, $3)
      `;
      await client.query(inventoryQuery, [
        product.id,
        data.stockQuantity,
        data.lowStockThreshold ?? 10,
      ]);

      // 4. Insert images
      if (data.images && data.images.length > 0) {
        const imageQueries = data.images.map((img) => {
          return client.query(
            `
            INSERT INTO product_images (product_id, image_url, is_featured)
            VALUES ($1, $2, $3)
          `,
            [product.id, img.image_url, img.is_featured]
          );
        });
        await Promise.all(imageQueries);
      }

      return product;
    });
  },

  /**
   * Update Product
   */
  async updateProduct(
    productId: string,
    data: {
      name?: string;
      categoryId?: string | null;
      description?: string;
      price?: number;
      compareAtPrice?: number | null;
      sku?: string;
      stockQuantity?: number;
      lowStockThreshold?: number;
      images?: { image_url: string; is_featured: boolean }[];
      status?: 'draft' | 'published';
    }
  ): Promise<any> {
    return db.transaction(async (client) => {
      const updates: string[] = [];
      const values: any[] = [];
      let counter = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${counter++}`);
        values.push(data.name);
        // Regene slug
        const baseSlug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
        updates.push(`slug = $${counter++}`);
        values.push(slug);
      }
      if (data.categoryId !== undefined) {
        updates.push(`category_id = $${counter++}`);
        values.push(data.categoryId);
      }
      if (data.description !== undefined) {
        updates.push(`description = $${counter++}`);
        values.push(data.description);
      }
      if (data.price !== undefined) {
        updates.push(`price = $${counter++}`);
        values.push(data.price);
      }
      if (data.compareAtPrice !== undefined) {
        updates.push(`compare_at_price = $${counter++}`);
        values.push(data.compareAtPrice);
      }
      if (data.sku !== undefined) {
        updates.push(`sku = $${counter++}`);
        values.push(data.sku);
      }
      if (data.status !== undefined) {
        updates.push(`status = $${counter++}`);
        values.push(data.status);
      }

      if (updates.length > 0) {
        values.push(productId);
        const query = `
          UPDATE products 
          SET ${updates.join(', ')}, is_approved = FALSE 
          WHERE id = $${counter}
        `;
        await client.query(query, values);
      }

      // Update Inventory
      if (data.stockQuantity !== undefined || data.lowStockThreshold !== undefined) {
        const invUpdates: string[] = [];
        const invValues: any[] = [];
        let invCounter = 1;

        if (data.stockQuantity !== undefined) {
          invUpdates.push(`stock_quantity = $${invCounter++}`);
          invValues.push(data.stockQuantity);
        }
        if (data.lowStockThreshold !== undefined) {
          invUpdates.push(`low_stock_threshold = $${invCounter++}`);
          invValues.push(data.lowStockThreshold);
        }

        invValues.push(productId);
        const invQuery = `
          UPDATE inventory 
          SET ${invUpdates.join(', ')} 
          WHERE product_id = $${invCounter}
        `;
        await client.query(invQuery, invValues);
      }

      // Sync Images if provided (delete old images, replace with new)
      if (data.images !== undefined) {
        await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
        if (data.images.length > 0) {
          const imageQueries = data.images.map((img) => {
            return client.query(
              `
              INSERT INTO product_images (product_id, image_url, is_featured)
              VALUES ($1, $2, $3)
            `,
              [productId, img.image_url, img.is_featured]
            );
          });
          await Promise.all(imageQueries);
        }
      }

      return true;
    });
  },

  /**
   * Delete Product
   */
  async deleteProduct(productId: string): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = $1';
    const res = await db.query(query, [productId]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Admin approves/rejects a product
   */
  async approveProduct(productId: string, isApproved: boolean, status: 'published' | 'rejected'): Promise<boolean> {
    const query = `
      UPDATE products 
      SET is_approved = $1, status = $2 
      WHERE id = $3 
      RETURNING id
    `;
    const res = await db.query(query, [isApproved, status, productId]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Admin sets featured status on a product
   */
  async setFeatured(productId: string, isFeatured: boolean): Promise<boolean> {
    const query = `
      UPDATE products 
      SET is_featured = $1 
      WHERE id = $2 
      RETURNING id
    `;
    const res = await db.query(query, [isFeatured, productId]);
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Advanced search, filters, sorting, and pagination
   */
  async listProducts(filters: ProductFilterOptions = {}): Promise<{ products: any[]; total: number }> {
    const {
      search,
      categorySlug,
      minPrice,
      maxPrice,
      rating,
      storeId,
      isApproved,
      status,
      isFeatured,
      sortBy = 'created_desc',
      page = 1,
      limit = 12,
    } = filters;

    const queryConditions: string[] = [];
    const queryValues: any[] = [];
    let counter = 1;

    // Default filters for customer side if not specified
    if (isApproved !== undefined) {
      queryConditions.push(`p.is_approved = $${counter++}`);
      queryValues.push(isApproved);
    }
    if (status !== undefined) {
      queryConditions.push(`p.status = $${counter++}`);
      queryValues.push(status);
    }
    if (isFeatured !== undefined) {
      queryConditions.push(`p.is_featured = $${counter++}`);
      queryValues.push(isFeatured);
    }
    if (storeId !== undefined) {
      queryConditions.push(`p.store_id = $${counter++}`);
      queryValues.push(storeId);
    }
    if (minPrice !== undefined) {
      queryConditions.push(`p.price >= $${counter++}`);
      queryValues.push(minPrice);
    }
    if (maxPrice !== undefined) {
      queryConditions.push(`p.price <= $${counter++}`);
      queryValues.push(maxPrice);
    }

    if (categorySlug !== undefined) {
      queryConditions.push(`(c.slug = $${counter} OR c.parent_id = (SELECT id FROM categories WHERE slug = $${counter}))`);
      queryValues.push(categorySlug);
      counter++;
    }

    if (search !== undefined && search.trim() !== '') {
      queryConditions.push(`(p.name ILIKE $${counter} OR p.description ILIKE $${counter} OR s.name ILIKE $${counter})`);
      queryValues.push(`%${search.trim()}%`);
      counter++;
    }

    // Build WHERE clause
    const whereClause = queryConditions.length > 0 ? `WHERE ${queryConditions.join(' AND ')}` : '';

    // Build Sorting
    let orderByClause = 'ORDER BY p.created_at DESC';
    if (sortBy === 'price_asc') {
      orderByClause = 'ORDER BY p.price ASC';
    } else if (sortBy === 'price_desc') {
      orderByClause = 'ORDER BY p.price DESC';
    } else if (sortBy === 'rating_desc') {
      orderByClause = 'ORDER BY rating DESC';
    } else if (sortBy === 'created_desc') {
      orderByClause = 'ORDER BY p.created_at DESC';
    }

    // Pagination variables
    const offset = (page - 1) * limit;
    const limitParamIndex = counter++;
    const offsetParamIndex = counter++;
    
    // Core SELECT query
    const selectQuery = `
      SELECT p.id, p.store_id, p.category_id, p.name, p.slug, p.price, p.compare_at_price, p.sku, 
             p.is_approved, p.is_featured, p.status, p.created_at,
             s.name as store_name, s.slug as store_slug, c.name as category_name,
             i.stock_quantity, i.low_stock_threshold,
             COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND is_approved = TRUE), 0.0) as rating,
             COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = TRUE), 0) as reviews_count,
             (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_featured DESC LIMIT 1) as image_url
      FROM products p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ${whereClause}
      ${orderByClause}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    // Total Count query (for pagination math)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const selectValues = [...queryValues, limit, offset];
    
    const [selectRes, countRes] = await Promise.all([
      db.query(selectQuery, selectValues),
      db.query(countQuery, queryValues),
    ]);

    return {
      products: selectRes.rows,
      total: parseInt(countRes.rows[0]?.total || '0', 10),
    };
  },
};
