export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'customer' | 'vendor' | 'admin';
  isVerified: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  parent_name?: string;
}

export interface ProductImage {
  id?: string;
  image_url: string;
  is_featured: boolean;
}

export interface Product {
  id: string;
  store_id: string;
  category_id?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  sku: string;
  is_approved: boolean;
  is_featured: boolean;
  status: 'draft' | 'published' | 'rejected';
  store_name: string;
  store_slug: string;
  category_name?: string;
  category_slug?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  rating: number;
  reviews_count: number;
  image_url?: string; // Main featured image
  images?: ProductImage[]; // All images
}

export interface CartItem {
  cart_item_id: string;
  quantity: number;
  product_id: string;
  name: string;
  slug: string;
  price: string;
  sku: string;
  store_id: string;
  store_name: string;
  stock_quantity: number;
  image_url?: string;
}

export interface WishlistItem {
  wishlist_item_id: string;
  id: string; // Product ID
  name: string;
  slug: string;
  price: string;
  compare_at_price?: string;
  store_name: string;
  image_url?: string;
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  address_type: 'shipping' | 'billing';
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

export interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  sku: string;
  quantity: number;
  price: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  store_id: string;
  store_name: string;
  image_url?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: string;
  tax_amount: string;
  shipping_amount: string;
  discount_amount: string;
  coupon_code?: string;
  shipping_address: Address;
  billing_address: Address;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  gateway?: 'stripe' | 'razorpay';
}

export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar?: string;
  rating: number;
  title?: string;
  comment?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  store_id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_value: string;
  start_date: string;
  end_date: string;
  max_uses?: number;
  uses_count: number;
  active: boolean;
}
