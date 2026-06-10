-- PostgreSQL seed data for Multi-Vendor E-Commerce Platform

-- 1. Insert Roles
INSERT INTO roles (id, name) VALUES
('d01fcf21-b0e1-4c28-98e3-9828231db621', 'admin'),
('d01fcf21-b0e1-4c28-98e3-9828231db622', 'vendor'),
('d01fcf21-b0e1-4c28-98e3-9828231db623', 'customer')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Users (Password is 'Password123' hashed with bcrypt: $2b$10$wK1c7Yv8lO49b3vC8N1O2.3L2mN4oP5qR6sT7uU8vV9wWxXyYzZa2)
-- Admin
INSERT INTO users (id, email, password_hash, role_id, full_name, is_verified, phone) VALUES
('a1111111-1111-1111-1111-111111111111', 'admin@platform.com', '$2b$10$wK1c7Yv8lO49b3vC8N1O2.3L2mN4oP5qR6sT7uU8vV9wWxXyYzZa2', 'd01fcf21-b0e1-4c28-98e3-9828231db621', 'System Administrator', TRUE, '+15550100')
ON CONFLICT (email) DO NOTHING;

-- Vendors
INSERT INTO users (id, email, password_hash, role_id, full_name, is_verified, phone) VALUES
('b2222222-2222-2222-2222-222222222222', 'vendor1@store.com', '$2b$10$wK1c7Yv8lO49b3vC8N1O2.3L2mN4oP5qR6sT7uU8vV9wWxXyYzZa2', 'd01fcf21-b0e1-4c28-98e3-9828231db622', 'John TechVendor', TRUE, '+15550201'),
('b2222222-2222-2222-2222-222222222223', 'vendor2@store.com', '$2b$10$wK1c7Yv8lO49b3vC8N1O2.3L2mN4oP5qR6sT7uU8vV9wWxXyYzZa2', 'd01fcf21-b0e1-4c28-98e3-9828231db622', 'Sarah CraftVendor', TRUE, '+15550202')
ON CONFLICT (email) DO NOTHING;

-- Customers
INSERT INTO users (id, email, password_hash, role_id, full_name, is_verified, phone) VALUES
('c3333333-3333-3333-3333-333333333333', 'customer@shopper.com', '$2b$10$wK1c7Yv8lO49b3vC8N1O2.3L2mN4oP5qR6sT7uU8vV9wWxXyYzZa2', 'd01fcf21-b0e1-4c28-98e3-9828231db623', 'Alice Customer', TRUE, '+15550301'),
('c3333333-3333-3333-3333-333333333334', 'customer2@shopper.com', '$2b$10$wK1c7Yv8lO49b3vC8N1O2.3L2mN4oP5qR6sT7uU8vV9wWxXyYzZa2', 'd01fcf21-b0e1-4c28-98e3-9828231db623', 'Bob Shopper', TRUE, '+15550302')
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Vendors
INSERT INTO vendors (id, user_id, business_name, business_description, status, tax_id) VALUES
('v1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'ElectroZone', 'Your ultimate destination for premium gadgets and laptops.', 'approved', 'TX-8927-11'),
('v1111111-1111-1111-1111-111111111112', 'b2222222-2222-2222-2222-222222222223', 'EtsyStyles', 'Handcrafted organic home decor and accessories.', 'approved', 'TX-7210-99')
ON CONFLICT (user_id) DO NOTHING;

-- 4. Insert Stores
INSERT INTO stores (id, vendor_id, name, slug, description, banner_url) VALUES
('s1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111111', 'ElectroZone Store', 'electrozone-store', 'Official store of ElectroZone.', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200'),
('s1111111-1111-1111-1111-111111111112', 'v1111111-1111-1111-1111-111111111112', 'EtsyStyles Decor', 'etsystyles-decor', 'Handcrafted elegance for your living spaces.', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200')
ON CONFLICT (vendor_id) DO NOTHING;

-- 5. Insert Categories
INSERT INTO categories (id, name, slug, description, parent_id) VALUES
('cat11111-1111-1111-1111-111111111111', 'Electronics', 'electronics', 'Gadgets, phones, laptops and accessories.', NULL),
('cat11111-1111-1111-1111-111111111112', 'Home & Living', 'home-living', 'Furniture, decorations, and kitchenware.', NULL),
('cat11111-1111-1111-1111-111111111113', 'Computers', 'computers', 'Laptops, desktops, and components.', 'cat11111-1111-1111-1111-111111111111'),
('cat11111-1111-1111-1111-111111111114', 'Wall Art', 'wall-art', 'Paintings, prints, and posters.', 'cat11111-1111-1111-1111-111111111112')
ON CONFLICT (slug) DO NOTHING;

-- 6. Insert Products
-- Product 1: Laptop
INSERT INTO products (id, store_id, category_id, name, slug, description, price, compare_at_price, sku, is_approved, is_featured, status) VALUES
('p1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111113', 'Apex Pro 15 Laptop', 'apex-pro-15-laptop', 'Flagship developer laptop with 32GB RAM, 1TB SSD, and a gorgeous OLED screen.', 1499.99, 1699.99, 'LAP-APEX-15', TRUE, TRUE, 'published')
ON CONFLICT (slug) DO NOTHING;

-- Product 2: Phone
INSERT INTO products (id, store_id, category_id, name, slug, description, price, compare_at_price, sku, is_approved, is_featured, status) VALUES
('p1111111-1111-1111-1111-111111111112', 's1111111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', 'Nexus Core 5G Smartphone', 'nexus-core-5g-smartphone', 'Next-gen cellular phone featuring AI zoom camera and all-day battery life.', 899.00, 999.00, 'PHN-NEXUS-5G', TRUE, TRUE, 'published')
ON CONFLICT (slug) DO NOTHING;

-- Product 3: Craft
INSERT INTO products (id, store_id, category_id, name, slug, description, price, compare_at_price, sku, is_approved, is_featured, status) VALUES
('p1111111-1111-1111-1111-111111111113', 's1111111-1111-1111-1111-111111111112', 'cat11111-1111-1111-1111-111111111114', 'Abstract Canvas Oil Painting', 'abstract-canvas-oil-painting', 'Beautiful hand-painted original canvas art with vibrant gold leaf accents.', 120.00, 150.00, 'ART-ABS-CANVAS', TRUE, TRUE, 'published')
ON CONFLICT (slug) DO NOTHING;

-- Product 4: Wooden Coasters
INSERT INTO products (id, store_id, category_id, name, slug, description, price, compare_at_price, sku, is_approved, is_featured, status) VALUES
('p1111111-1111-1111-1111-111111111114', 's1111111-1111-1111-1111-111111111112', 'cat11111-1111-1111-1111-111111111112', 'Handcrafted Walnut Coasters (Set of 6)', 'handcrafted-walnut-coasters-6', 'Organic walnut wood coasters, water-resistant lacquer coating, non-slip base.', 24.99, 29.99, 'DEC-WLN-COASTER', TRUE, FALSE, 'published')
ON CONFLICT (slug) DO NOTHING;

-- 7. Insert Product Images
INSERT INTO product_images (product_id, image_url, is_featured) VALUES
('p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1496181130204-7552cc14ac4b?w=600', TRUE),
('p1111111-1111-1111-1111-111111111112', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600', TRUE),
('p1111111-1111-1111-1111-111111111113', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600', TRUE),
('p1111111-1111-1111-1111-111111111114', 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600', TRUE);

-- 8. Insert Inventory
INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES
('p1111111-1111-1111-1111-111111111111', 25, 5),
('p1111111-1111-1111-1111-111111111112', 40, 10),
('p1111111-1111-1111-1111-111111111113', 5, 2),
('p1111111-1111-1111-1111-111111111114', 100, 15)
ON CONFLICT (product_id) DO NOTHING;

-- 9. Insert Reviews
INSERT INTO reviews (product_id, customer_id, rating, title, comment) VALUES
('p1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 5, 'Superb Workhorse!', 'Best coding laptop I have ever owned. Super snappy and the screen is amazing.'),
('p1111111-1111-1111-1111-111111111112', 'c3333333-3333-3333-3333-333333333334', 4, 'Great camera, so-so speaker', 'The photos are incredible. Speaker quality is average, but overall highly recommended.')
ON CONFLICT (product_id, customer_id) DO NOTHING;
