import { z } from 'zod';

export const authValidators = {
  register: z.object({
    body: z.object({
      email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
      password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
      fullName: z.string({ required_error: 'Full name is required' }).min(2, 'Full name must be at least 2 characters'),
      phone: z.string().optional(),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
      password: z.string({ required_error: 'Password is required' }),
    }),
  }),

  forgotPassword: z.object({
    body: z.object({
      email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    }),
  }),

  resetPassword: z.object({
    body: z.object({
      token: z.string({ required_error: 'Token is required' }),
      password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
    }),
  }),
  
  createVendor: z.object({
    body: z.object({
      businessName: z.string({ required_error: 'Business name is required' }).min(2, 'Business name must be at least 2 characters'),
      businessDescription: z.string().optional(),
      taxId: z.string({ required_error: 'Tax ID (VAT/GST/EIN) is required' }),
    }),
  }),
};

export const productValidators = {
  createProduct: z.object({
    body: z.object({
      name: z.string({ required_error: 'Product name is required' }).min(2, 'Product name must be at least 2 characters'),
      categoryId: z.string().optional(),
      description: z.string().optional(),
      price: z.number({ required_error: 'Price is required' }).nonnegative('Price must be positive or zero'),
      compareAtPrice: z.number().nonnegative().optional().nullable(),
      sku: z.string({ required_error: 'SKU is required' }),
      stockQuantity: z.number({ required_error: 'Stock quantity is required' }).int().nonnegative('Stock must be positive or zero'),
      lowStockThreshold: z.number().int().nonnegative().optional(),
      images: z.array(z.object({
        image_url: z.string().url('Invalid image URL'),
        is_featured: z.boolean(),
      })).min(1, 'At least one product image is required'),
      status: z.enum(['draft', 'published']).optional(),
    }),
  }),

  category: z.object({
    body: z.object({
      name: z.string({ required_error: 'Category name is required' }),
      slug: z.string({ required_error: 'Slug is required' }),
      description: z.string().optional(),
      parentId: z.string().optional().nullable(),
    }),
  }),
};

export const checkoutValidators = {
  address: z.object({
    body: z.object({
      address_type: z.enum(['shipping', 'billing']),
      full_name: z.string().min(2, 'Name is too short'),
      address_line1: z.string().min(5, 'Address line 1 is too short'),
      address_line2: z.string().optional(),
      city: z.string().min(2, 'City is too short'),
      state: z.string().min(2, 'State is too short'),
      postal_code: z.string().min(2, 'Postal code is too short'),
      country: z.string().min(2, 'Country is too short'),
      phone: z.string().min(5, 'Phone number is too short'),
      is_default: z.boolean().optional(),
    }),
  }),

  coupon: z.object({
    body: z.object({
      code: z.string().min(3, 'Coupon code must be at least 3 characters'),
      type: z.enum(['percentage', 'fixed']),
      value: z.number().positive('Coupon value must be positive'),
      minOrderValue: z.number().nonnegative().optional(),
      startDate: z.string().transform((str) => new Date(str)),
      endDate: z.string().transform((str) => new Date(str)),
      maxUses: z.number().int().positive().optional().nullable(),
    }),
  }),

  order: z.object({
    body: z.object({
      addressId: z.string(),
      couponCode: z.string().optional(),
    }),
  }),
};

export const reviewValidators = {
  createReview: z.object({
    body: z.object({
      productId: z.string(),
      rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
      title: z.string().optional(),
      comment: z.string().optional(),
    }),
  }),
};
