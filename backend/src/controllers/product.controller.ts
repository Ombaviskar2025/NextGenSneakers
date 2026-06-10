import { Request, Response } from 'express';
import { ProductModel } from '../models/product.model';
import { UserModel } from '../models/user.model';
import { socketService } from '../services/socket.service';

export const productController = {
  // ==========================================
  // CATEGORIES
  // ==========================================

  async listCategories(req: Request, res: Response) {
    try {
      const categories = await ProductModel.listCategories();
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving categories' });
    }
  },

  async createCategory(req: Request, res: Response) {
    const { name, slug, description, parentId } = req.body;
    try {
      const category = await ProductModel.createCategory({ name, slug, description, parentId });
      return res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
      return res.status(500).json({ message: 'Error creating category' });
    }
  },

  async updateCategory(req: Request, res: Response) {
    const { id } = req.params;
    const { name, slug, description, parentId } = req.body;
    try {
      const category = await ProductModel.updateCategory(id, { name, slug, description, parentId });
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      return res.status(200).json({ message: 'Category updated successfully', category });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating category' });
    }
  },

  async deleteCategory(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const success = await ProductModel.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ message: 'Category not found' });
      }
      return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting category' });
    }
  },

  // ==========================================
  // PRODUCTS
  // ==========================================

  /**
   * Search / Filter Products for Customers (approved & published only)
   */
  async listProducts(req: Request, res: Response) {
    try {
      const search = req.query.search as string;
      const categorySlug = req.query.categorySlug as string;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const sortBy = req.query.sortBy as any;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;

      const result = await ProductModel.listProducts({
        search,
        categorySlug,
        minPrice,
        maxPrice,
        sortBy,
        isApproved: true,
        status: 'published',
        page,
        limit,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('List products error:', error);
      return res.status(500).json({ message: 'Error retrieving products' });
    }
  },

  /**
   * Get Product Details by Slug or ID
   */
  async getProduct(req: Request, res: Response) {
    const { slugOrId } = req.params;
    try {
      let product = await ProductModel.findBySlug(slugOrId);
      if (!product) {
        // Fallback check if it's a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
        if (isUuid) {
          product = await ProductModel.findById(slugOrId);
        }
      }

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      return res.status(200).json(product);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving product' });
    }
  },

  /**
   * Create Product (Vendor only)
   */
  async createProduct(req: any, res: Response) {
    const {
      name,
      categoryId,
      description,
      price,
      compareAtPrice,
      sku,
      stockQuantity,
      lowStockThreshold,
      images,
      status,
    } = req.body;

    const storeId = req.user.storeId;
    if (!storeId) {
      return res.status(403).json({ message: 'Access denied. Store credentials not found.' });
    }

    try {
      // Check SKU duplication
      const existingSku = await ProductModel.findBySku(sku);
      if (existingSku) {
        return res.status(400).json({ message: `A product with SKU '${sku}' already exists.` });
      }

      const product = await ProductModel.createProduct({
        storeId,
        categoryId,
        name,
        description,
        price,
        compareAtPrice,
        sku,
        stockQuantity,
        lowStockThreshold,
        images,
        status: status || 'draft',
      });

      // Notify Admins about new product approval request
      socketService.notifyAdmins({
        title: 'Product Review Required',
        message: `Vendor store ${req.user.storeId} submitted a new product: ${name}`,
        type: 'system',
      });

      return res.status(201).json({
        message: 'Product created successfully. Pending Admin verification before going public.',
        product,
      });
    } catch (error) {
      console.error('Create product error:', error);
      return res.status(500).json({ message: 'Error creating product' });
    }
  },

  /**
   * Update Product (Vendor only)
   */
  async updateProduct(req: any, res: Response) {
    const { id } = req.params;
    const storeId = req.user.storeId;

    if (!storeId) {
      return res.status(403).json({ message: 'Access denied. Store credentials not found.' });
    }

    try {
      // Verify product belongs to store
      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (product.store_id !== storeId) {
        return res.status(403).json({ message: 'Unauthorized. You do not own this product.' });
      }

      await ProductModel.updateProduct(id, req.body);

      // Notify admin product is modified and needs re-approval
      socketService.notifyAdmins({
        title: 'Product Updated',
        message: `Product ${product.name} was updated and needs re-approval.`,
        type: 'system',
      });

      return res.status(200).json({
        message: 'Product updated successfully. It has been set to draft mode pending re-approval.',
      });
    } catch (error) {
      console.error('Update product error:', error);
      return res.status(500).json({ message: 'Error updating product' });
    }
  },

  /**
   * Delete Product (Vendor / Admin)
   */
  async deleteProduct(req: any, res: Response) {
    const { id } = req.params;
    const userRole = req.user.role;
    const storeId = req.user.storeId;

    try {
      const product = await ProductModel.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // If vendor, check ownership
      if (userRole === 'vendor' && product.store_id !== storeId) {
        return res.status(403).json({ message: 'Unauthorized. You do not own this product.' });
      }

      await ProductModel.deleteProduct(id);
      return res.status(200).json({ message: 'Product deleted successfully.' });
    } catch (error) {
      return res.status(500).json({ message: 'Error deleting product' });
    }
  },

  /**
   * Approve/Reject Product (Admin only)
   */
  async approveProduct(req: Request, res: Response) {
    const { id } = req.params;
    const { isApproved, status } = req.body; // status: 'published' | 'rejected'

    try {
      const success = await ProductModel.approveProduct(id, isApproved, status);
      if (!success) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const product = await ProductModel.findById(id);
      
      // Notify vendor via real-time notifications
      socketService.notifyStore(product.store_id, {
        title: `Product ${isApproved ? 'Approved' : 'Rejected'}`,
        message: `Your product '${product.name}' has been ${isApproved ? 'approved and published' : 'rejected'}.`,
        type: 'stock',
      });

      return res.status(200).json({ 
        message: `Product has been ${isApproved ? 'approved' : 'rejected'} successfully.` 
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating approval status' });
    }
  },

  /**
   * Feature/Unfeature Product (Admin only)
   */
  async featureProduct(req: Request, res: Response) {
    const { id } = req.params;
    const { isFeatured } = req.body;

    try {
      const success = await ProductModel.setFeatured(id, isFeatured);
      if (!success) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.status(200).json({ 
        message: `Product feature status updated to ${isFeatured}.` 
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error updating product feature status' });
    }
  },

  /**
   * List products by store (Vendor's inventory)
   */
  async listStoreProducts(req: any, res: Response) {
    const storeId = req.user.storeId || req.params.storeId;
    if (!storeId) {
      return res.status(400).json({ message: 'Store ID is required' });
    }

    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await ProductModel.listProducts({
        storeId,
        page,
        limit,
      });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving store products' });
    }
  },
};
