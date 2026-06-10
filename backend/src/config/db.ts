import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const config: PoolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      user: process.env.PGUSER || 'postgres',
      database: process.env.PGDATABASE || 'multivendor_db',
      password: process.env.PGPASSWORD || 'postgres',
      port: parseInt(process.env.PGPORT || '5432', 10),
    };

// Enable SSL in production environments (like Render or Neon)
if (process.env.NODE_ENV === 'production') {
  config.ssl = {
    rejectUnauthorized: false,
  };
}

let useMockDb = false;
const pool = new Pool(config);

// Try to test the connection early
pool.connect((err, client, release) => {
  if (err) {
    console.warn('\n=== [DB CONNECT FALLBACK] ===');
    console.warn('PostgreSQL database connection failed (ECONNREFUSED).');
    console.warn('Running in LOCAL MOCK DATABASE MODE (using mock_db.json).');
    console.warn('=============================\n');
    useMockDb = true;
  } else {
    if (client) release();
  }
});

pool.on('error', (err) => {
  if (!useMockDb) {
    console.error('Unexpected error on idle database client', err);
  }
});

/**
 * Basic in-memory JSON SQL query evaluator for offline fallback.
 */
function evaluateMockQuery(text: string, params: any[] = []): any {
  const dbPath = path.join(__dirname, 'mock_db.json');
  let data: any = {};
  try {
    data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    console.error('Error reading mock_db.json:', e);
    return { rows: [], rowCount: 0 };
  }

  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();

  // 1. Roles query
  if (normalized.includes('select') && normalized.includes('from roles')) {
    return { rows: data.roles || [], rowCount: data.roles?.length || 0 };
  }

  // 2. Categories query
  if (normalized.includes('select') && normalized.includes('from categories') && !normalized.includes('from products')) {
    return { rows: data.categories || [], rowCount: data.categories?.length || 0 };
  }

  // 3. Products list or detail queries
  if (normalized.includes('select') && normalized.includes('from products')) {
    // Find detailed by slug
    if (normalized.includes('where p.slug = $1') || normalized.includes('where slug = $1')) {
      const slug = params[0];
      const prod = data.products.find((p: any) => p.slug === slug);
      if (prod) {
        prod.images = data.products.find((p: any) => p.id === prod.id)?.images || [
          { id: 'img-1', image_url: prod.image_url, is_featured: true }
        ];
        prod.reviews_count = data.reviews.filter((r: any) => r.product_id === prod.id).length;
        const totalRating = data.reviews.filter((r: any) => r.product_id === prod.id).reduce((sum: number, r: any) => sum + r.rating, 0);
        prod.rating = prod.reviews_count > 0 ? parseFloat((totalRating / prod.reviews_count).toFixed(1)) : 5.0;
      }
      return { rows: prod ? [prod] : [], rowCount: prod ? 1 : 0 };
    }

    // Find detailed by ID
    if (normalized.includes('where p.id = $1') || normalized.includes('where id = $1')) {
      const id = params[0];
      const prod = data.products.find((p: any) => p.id === id);
      if (prod) {
        prod.images = data.products.find((p: any) => p.id === prod.id)?.images || [
          { id: 'img-1', image_url: prod.image_url, is_featured: true }
        ];
        prod.reviews_count = data.reviews.filter((r: any) => r.product_id === prod.id).length;
        const totalRating = data.reviews.filter((r: any) => r.product_id === prod.id).reduce((sum: number, r: any) => sum + r.rating, 0);
        prod.rating = prod.reviews_count > 0 ? parseFloat((totalRating / prod.reviews_count).toFixed(1)) : 5.0;
      }
      return { rows: prod ? [prod] : [], rowCount: prod ? 1 : 0 };
    }

    // List products (search, filters, catalog)
    let filtered = [...data.products];

    // Filter featured
    if (normalized.includes('p.is_featured = $') || normalized.includes('is_featured')) {
      const featParam = params.find(p => typeof p === 'boolean');
      if (featParam !== undefined) {
        filtered = filtered.filter((p: any) => p.is_featured === featParam);
      } else {
        filtered = filtered.filter((p: any) => p.is_featured === true);
      }
    }

    // Filter category slug
    const catSlugParam = params.find(p => typeof p === 'string' && data.categories.some((c: any) => c.slug === p));
    if (catSlugParam) {
      filtered = filtered.filter((p: any) => {
        const cat = data.categories.find((c: any) => c.slug === catSlugParam);
        return p.category_id === cat?.id || p.category_slug === catSlugParam;
      });
    }

    // Filter search term
    const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
    if (searchParam) {
      const term = searchParam.replace(/%/g, '').toLowerCase();
      filtered = filtered.filter((p: any) => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    }

    // Numeric params for pagination (limit, offset)
    const numericParams = params.filter(p => typeof p === 'number');
    let limit = 12;
    let offset = 0;
    if (numericParams.length >= 2) {
      offset = numericParams[numericParams.length - 1];
      limit = numericParams[numericParams.length - 2];
    }

    // Sort evaluation
    if (normalized.includes('order by p.price asc')) {
      filtered.sort((a, b) => a.price - b.price);
    } else if (normalized.includes('order by p.price desc')) {
      filtered.sort((a, b) => b.price - a.price);
    } else if (normalized.includes('order by rating desc')) {
      filtered.sort((a, b) => b.rating - a.rating);
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const totalCount = filtered.length;

    // Count-only query checks
    if (normalized.startsWith('select count(*)')) {
      return { rows: [{ total: totalCount }], rowCount: 1 };
    }

    const sliced = filtered.slice(offset, offset + limit);
    return { rows: sliced, rowCount: sliced.length };
  }

  // 4. Users / Auth queries
  if (normalized.includes('from users')) {
    if (normalized.includes('email = $1')) {
      const email = params[0];
      const user = data.users.find((u: any) => u.email === email);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    if (normalized.includes('u.id = $1') || normalized.includes('id = $1')) {
      const id = params[0];
      const user = data.users.find((u: any) => u.id === id);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    if (normalized.includes('refresh_token = $1')) {
      const token = params[0];
      const user = data.users.find((u: any) => u.refresh_token === token);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    if (normalized.includes('verification_token = $1')) {
      const token = params[0];
      const user = data.users.find((u: any) => u.verification_token === token);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
  }

  // Insert User
  if (normalized.includes('insert into users')) {
    const newUser = {
      id: `u-${Math.random().toString(36).substring(2, 10)}`,
      email: params[0],
      password_hash: params[1],
      role_id: params[2],
      role_name: data.roles.find((r: any) => r.id === params[2])?.name || 'customer',
      full_name: params[3],
      phone: params[4] || null,
      is_verified: params[6] === undefined ? false : true,
      verification_token: params[5] || null,
      refresh_token: null
    };
    data.users.push(newUser);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [newUser], rowCount: 1 };
  }

  // Update User
  if (normalized.includes('update users')) {
    if (normalized.includes('refresh_token = $1')) {
      const token = params[0];
      const id = params[1];
      const user = data.users.find((u: any) => u.id === id);
      if (user) {
        user.refresh_token = token;
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      }
      return { rows: [user], rowCount: 1 };
    }
    if (normalized.includes('full_name = $1')) {
      const fullName = params[0];
      const phone = params[1];
      const avatarUrl = params[2];
      const id = params[3];
      const user = data.users.find((u: any) => u.id === id);
      if (user) {
        user.full_name = fullName;
        user.phone = phone;
        user.avatar_url = avatarUrl;
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      }
      return { rows: [user], rowCount: 1 };
    }
    if (normalized.includes('is_verified = true')) {
      const token = params[0];
      const user = data.users.find((u: any) => u.verification_token === token);
      if (user) {
        user.is_verified = true;
        user.verification_token = null;
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      }
      return { rows: [user], rowCount: user ? 1 : 0 };
    }
  }

  // 5. Vendor queries
  if (normalized.includes('from vendors')) {
    if (normalized.includes('user_id = $1')) {
      const userId = params[0];
      const vendor = data.vendors.find((v: any) => v.user_id === userId);
      return { rows: vendor ? [vendor] : [], rowCount: vendor ? 1 : 0 };
    }
  }

  // Stores
  if (normalized.includes('from stores')) {
    if (normalized.includes('vendor_id = $1')) {
      const vendorId = params[0];
      const store = data.stores.find((s: any) => s.vendor_id === vendorId);
      return { rows: store ? [store] : [], rowCount: store ? 1 : 0 };
    }
  }

  // 6. Cart Queries
  if (normalized.includes('from cart')) {
    if (normalized.includes('select')) {
      const customerId = params[0];
      const items = data.cart.filter((c: any) => c.customer_id === customerId).map((c: any) => {
        const prod = data.products.find((p: any) => p.id === c.product_id);
        return {
          cart_item_id: c.id,
          product_id: c.product_id,
          quantity: c.quantity,
          name: prod?.name || 'Nike Shoe',
          slug: prod?.slug || '',
          price: prod?.price || 7495.00,
          sku: prod?.sku || '',
          store_id: prod?.store_id || 's1111111-1111-1111-1111-111111111111',
          store_name: prod?.store_name || 'Nike Official Store',
          stock_quantity: prod?.stock_quantity || 10,
          image_url: prod?.image_url || ''
        };
      });
      return { rows: items, rowCount: items.length };
    }
  }

  if (normalized.includes('insert into cart') || normalized.includes('insert into cart_items')) {
    const customerId = params[0];
    const productId = params[1];
    const qty = params[2];
    
    const existing = data.cart.find((c: any) => c.customer_id === customerId && c.product_id === productId);
    if (existing) {
      existing.quantity += qty;
    } else {
      data.cart.push({
        id: `cart-${Math.random().toString(36).substring(2, 10)}`,
        customer_id: customerId,
        product_id: productId,
        quantity: qty
      });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('update cart')) {
    const qty = params[0];
    const customerId = params[1];
    const productId = params[2];
    const item = data.cart.find((c: any) => c.customer_id === customerId && c.product_id === productId);
    if (item) {
      item.quantity = qty;
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('delete from cart')) {
    if (normalized.includes('product_id = $2')) {
      const customerId = params[0];
      const productId = params[1];
      data.cart = data.cart.filter((c: any) => !(c.customer_id === customerId && c.product_id === productId));
    } else {
      const customerId = params[0];
      data.cart = data.cart.filter((c: any) => c.customer_id !== customerId);
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [], rowCount: 1 };
  }

  // 7. Wishlist Queries
  if (normalized.includes('from wishlist') || normalized.includes('from wishlists')) {
    if (normalized.includes('select')) {
      const customerId = params[0];
      const items = (data.wishlist || []).filter((w: any) => w.customer_id === customerId).map((w: any) => {
        const prod = data.products.find((p: any) => p.id === w.product_id);
        return {
          wishlist_item_id: w.id,
          id: w.product_id,
          name: prod?.name || 'Nike Shoe',
          slug: prod?.slug || '',
          price: prod?.price || 7495.00,
          store_name: prod?.store_name || 'Nike Official Store',
          image_url: prod?.image_url || '',
          created_at: w.created_at
        };
      });
      return { rows: items, rowCount: items.length };
    }
  }

  if (normalized.includes('insert into wishlist') || normalized.includes('insert into wishlists')) {
    const customerId = params[0];
    const productId = params[1];
    data.wishlist = data.wishlist || [];
    const exists = data.wishlist.some((w: any) => w.customer_id === customerId && w.product_id === productId);
    if (!exists) {
      data.wishlist.push({
        id: `wish-${Math.random().toString(36).substring(2, 10)}`,
        customer_id: customerId,
        product_id: productId,
        created_at: new Date().toISOString()
      });
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('delete from wishlist') || normalized.includes('delete from wishlists')) {
    const customerId = params[0];
    const productId = params[1];
    data.wishlist = data.wishlist || [];
    data.wishlist = data.wishlist.filter((w: any) => !(w.customer_id === customerId && w.product_id === productId));
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [], rowCount: 1 };
  }

  // 8. Reviews queries
  if (normalized.includes('from reviews')) {
    if (normalized.includes('product_id = $1')) {
      const prodId = params[0];
      const revs = (data.reviews || []).filter((r: any) => r.product_id === prodId && r.is_approved !== false).map((r: any) => ({
        ...r,
        customer_name: data.users.find((u: any) => u.id === r.customer_id)?.full_name || 'Customer',
        customer_avatar: data.users.find((u: any) => u.id === r.customer_id)?.avatar_url || null
      }));
      return { rows: revs, rowCount: revs.length };
    }
    // Admin list all reviews
    if (normalized.includes('select') && !normalized.includes('product_id = $1')) {
      const list = (data.reviews || []).map((r: any) => ({
        ...r,
        customer_name: data.users.find((u: any) => u.id === r.customer_id)?.full_name || 'Customer',
        product_name: data.products.find((p: any) => p.id === r.product_id)?.name || 'Nike Shoe'
      }));
      return { rows: list, rowCount: list.length };
    }
    // Customer owner check
    if (normalized.includes('customer_id') && normalized.includes('id = $1')) {
      const rev = (data.reviews || []).find((r: any) => r.id === params[0]);
      return { rows: rev ? [rev] : [], rowCount: rev ? 1 : 0 };
    }
  }

  if (normalized.includes('insert into reviews')) {
    const newRev = {
      id: `rev-${Math.random().toString(36).substring(2, 10)}`,
      product_id: params[0],
      customer_id: params[1],
      customer_name: data.users.find((u: any) => u.id === params[1])?.full_name || 'Anonymous Customer',
      rating: params[2],
      title: params[3] || '',
      comment: params[4] || '',
      is_approved: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.reviews = data.reviews || [];
    // Handle conflict (product_id, customer_id)
    const existingIdx = data.reviews.findIndex((r: any) => r.product_id === params[0] && r.customer_id === params[1]);
    if (existingIdx >= 0) {
      data.reviews[existingIdx].rating = params[2];
      data.reviews[existingIdx].title = params[3] || '';
      data.reviews[existingIdx].comment = params[4] || '';
      data.reviews[existingIdx].updated_at = new Date().toISOString();
      return { rows: [data.reviews[existingIdx]], rowCount: 1 };
    } else {
      data.reviews.push(newRev);
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      return { rows: [newRev], rowCount: 1 };
    }
  }

  if (normalized.includes('update reviews')) {
    // Admin approve/reject review
    const isApproved = params[0];
    const reviewId = params[1];
    data.reviews = data.reviews || [];
    const rev = data.reviews.find((r: any) => r.id === reviewId);
    if (rev) {
      rev.is_approved = isApproved;
      rev.updated_at = new Date().toISOString();
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: rev ? [{ id: reviewId }] : [], rowCount: rev ? 1 : 0 };
  }

  if (normalized.includes('delete from reviews')) {
    data.reviews = data.reviews || [];
    data.reviews = data.reviews.filter((r: any) => r.id !== params[0]);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [], rowCount: 1 };
  }

  // 9. Orders & Order Items queries
  if (normalized.includes('insert into orders')) {
    const newOrder = {
      id: `order-${Math.random().toString(36).substring(2, 10)}`,
      customer_id: params[0],
      order_number: params[1],
      total_amount: params[2],
      tax_amount: params[3],
      shipping_amount: params[4],
      discount_amount: params[5],
      coupon_code: params[6] || null,
      shipping_address: typeof params[7] === 'string' ? JSON.parse(params[7]) : params[7],
      billing_address: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payment_status: 'completed',
      gateway: 'stripe',
      items: []
    };
    data.orders = data.orders || [];
    data.orders.push(newOrder);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [newOrder], rowCount: 1 };
  }

  if (normalized.includes('insert into order_items')) {
    const orderId = params[0];
    const productId = params[1];
    const qty = params[2];
    const price = params[3];
    data.orders = data.orders || [];
    const order = data.orders.find((o: any) => o.id === orderId);
    if (order) {
      const prod = data.products.find((p: any) => p.id === productId);
      order.items = order.items || [];
      order.items.push({
        id: `item-${Math.random().toString(36).substring(2, 10)}`,
        product_id: productId,
        quantity: qty,
        price: price,
        status: 'pending',
        name: prod?.name || 'Nike Shoe',
        sku: prod?.sku || '',
        slug: prod?.slug || '',
        store_id: prod?.store_id || '',
        store_name: prod?.store_name || ''
      });
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('update orders')) {
    const status = params[0];
    const orderId = params[1];
    data.orders = data.orders || [];
    const order = data.orders.find((o: any) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updated_at = new Date().toISOString();
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: [{ id: orderId }], rowCount: order ? 1 : 0 };
  }

  if (normalized.includes('from orders')) {
    data.orders = data.orders || [];
    if (normalized.includes('customer_id = $1')) {
      const customerId = params[0];
      const customerOrders = data.orders.filter((o: any) => o.customer_id === customerId).map((o: any) => ({
        ...o,
        items_count: (o.items || []).length
      }));
      return { rows: customerOrders, rowCount: customerOrders.length };
    }
    if (normalized.includes('o.id = $1') || normalized.includes('id = $1')) {
      const orderId = params[0];
      const order = data.orders.find((o: any) => o.id === orderId);
      return { rows: order ? [{
        ...order,
        customer_name: data.users.find((u: any) => u.id === order.customer_id)?.full_name || 'Customer',
        customer_email: data.users.find((u: any) => u.id === order.customer_id)?.email || 'customer@shopper.com',
        payment_status: order.payment_status || 'completed',
        transaction_id: `txn_${order.order_number}`,
        gateway: order.gateway || 'stripe'
      }] : [], rowCount: order ? 1 : 0 };
    }
    // Admin list all orders
    const allOrders = data.orders.map((o: any) => ({
      ...o,
      customer_name: data.users.find((u: any) => u.id === o.customer_id)?.full_name || 'Customer',
      items_count: (o.items || []).length,
      payment_status: o.payment_status || 'completed'
    }));
    return { rows: allOrders, rowCount: allOrders.length };
  }

  if (normalized.includes('from order_items')) {
    if (normalized.includes('where id = $1') || normalized.includes('where order_items.id = $1')) {
      const itemId = params[0];
      let foundItem: any = null;
      data.orders = data.orders || [];
      data.orders.forEach((o: any) => {
        const item = (o.items || []).find((i: any) => i.id === itemId);
        if (item) {
          foundItem = {
            ...item,
            order_id: o.id
          };
        }
      });
      return { rows: foundItem ? [foundItem] : [], rowCount: foundItem ? 1 : 0 };
    }

    // List orders for vendor
    const storeId = params[0];
    const vendorItems: any[] = [];
    data.orders = data.orders || [];
    data.orders.forEach((o: any) => {
      const matchingItems = (o.items || []).filter((item: any) => item.store_id === storeId);
      matchingItems.forEach((item: any) => {
        vendorItems.push({
          id: o.id,
          order_number: o.order_number,
          created_at: o.created_at,
          shipping_address: o.shipping_address,
          item_id: item.id,
          quantity: item.quantity,
          price: item.price,
          item_status: item.status || o.status || 'pending',
          product_name: item.name,
          product_slug: item.slug,
          payment_status: o.payment_status || 'completed'
        });
      });
    });
    return { rows: vendorItems, rowCount: vendorItems.length };
  }

  if (normalized.includes('update order_items')) {
    const status = params[0];
    const orderItemId = params[1];
    let foundOrderId = null;
    data.orders = data.orders || [];
    data.orders.forEach((o: any) => {
      const item = (o.items || []).find((i: any) => i.id === orderItemId);
      if (item) {
        item.status = status;
        foundOrderId = o.id;
      }
    });
    if (foundOrderId) {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: [{ order_id: foundOrderId }], rowCount: foundOrderId ? 1 : 0 };
  }

  // 10. Addresses Queries
  if (normalized.includes('from addresses')) {
    data.addresses = data.addresses || [];
    if (normalized.includes('id = $1')) {
      const addrId = params[0];
      const userId = params[1];
      const addr = data.addresses.find((a: any) => a.id === addrId && a.user_id === userId);
      return { rows: addr ? [addr] : [], rowCount: addr ? 1 : 0 };
    }
    const list = data.addresses.filter((a: any) => a.user_id === params[0]);
    list.sort((a: any, b: any) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    return { rows: list, rowCount: list.length };
  }

  if (normalized.includes('insert into addresses')) {
    const newAddress = {
      id: `addr-${Math.random().toString(36).substring(2, 10)}`,
      user_id: params[0],
      address_type: params[1],
      full_name: params[2],
      address_line1: params[3],
      address_line2: params[4] || null,
      city: params[5],
      state: params[6],
      postal_code: params[7],
      country: params[8],
      phone: params[9],
      is_default: params[10] || false,
      created_at: new Date().toISOString()
    };
    data.addresses = data.addresses || [];
    data.addresses.push(newAddress);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [newAddress], rowCount: 1 };
  }

  if (normalized.includes('update addresses')) {
    data.addresses = data.addresses || [];
    data.addresses.forEach((a: any) => {
      if (a.user_id === params[0]) {
        a.is_default = false;
      }
    });
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('delete from addresses')) {
    data.addresses = data.addresses || [];
    data.addresses = data.addresses.filter((a: any) => !(a.id === params[0] && a.user_id === params[1]));
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [], rowCount: 1 };
  }

  // 11. Coupons Queries
  if (normalized.includes('from coupons')) {
    data.coupons = data.coupons || [];
    if (normalized.includes('code = $1')) {
      const code = params[0].toUpperCase().trim();
      const now = new Date();
      const coupon = data.coupons.find((c: any) => 
        c.code.toUpperCase() === code && 
        c.active && 
        new Date(c.start_date) <= now && 
        new Date(c.end_date) >= now
      );
      return { rows: coupon ? [coupon] : [], rowCount: coupon ? 1 : 0 };
    }
    let list = [...data.coupons];
    if (params.length > 0) {
      const storeId = params[0];
      list = list.filter((c: any) => c.store_id === storeId || c.store_id === null);
    }
    return { rows: list, rowCount: list.length };
  }

  if (normalized.includes('insert into coupons')) {
    const newCoupon = {
      id: `coupon-${Math.random().toString(36).substring(2, 10)}`,
      store_id: params[0],
      code: params[1].toUpperCase(),
      type: params[2],
      value: parseFloat(params[3]),
      min_order_value: parseFloat(params[4] || 0),
      start_date: params[5],
      end_date: params[6],
      max_uses: params[7] || null,
      uses_count: 0,
      active: true,
      created_at: new Date().toISOString()
    };
    data.coupons = data.coupons || [];
    data.coupons.push(newCoupon);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [newCoupon], rowCount: 1 };
  }

  if (normalized.includes('delete from coupons')) {
    data.coupons = data.coupons || [];
    data.coupons = data.coupons.filter((c: any) => {
      if (params.length > 1) {
        return !(c.id === params[0] && c.store_id === params[1]);
      }
      return c.id !== params[0];
    });
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [], rowCount: 1 };
  }

  // 12. Vendors Queries (Admin approval)
  if (normalized.includes('from vendors') && normalized.includes('join users')) {
    data.vendors = data.vendors || [];
    const list = data.vendors.map((v: any) => {
      const u = data.users.find((user: any) => user.id === v.user_id);
      const s = data.stores.find((store: any) => store.vendor_id === v.id);
      return {
        ...v,
        email: u?.email || '',
        full_name: u?.full_name || '',
        store_slug: s?.slug || '',
        store_name: s?.name || ''
      };
    });
    return { rows: list, rowCount: list.length };
  }

  if (normalized.includes('update vendors')) {
    const status = params[0];
    const vendorId = params[1];
    data.vendors = data.vendors || [];
    const vendor = data.vendors.find((v: any) => v.id === vendorId);
    if (vendor) {
      vendor.status = status;
      const roleName = status === 'approved' ? 'vendor' : 'customer';
      const user = data.users.find((u: any) => u.id === vendor.user_id);
      if (user) {
        user.role_name = roleName;
        user.role_id = data.roles.find((r: any) => r.name === roleName)?.id || user.role_id;
      }
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: vendor ? [vendor] : [], rowCount: vendor ? 1 : 0 };
  }

  // 13. Users Queries (Admin management)
  if (normalized.includes('from users') && normalized.includes('join roles')) {
    const list = data.users.filter((u: any) => u.role_name !== 'admin').map((u: any) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      phone: u.phone,
      avatar_url: u.avatar_url || null,
      is_verified: u.is_verified,
      created_at: u.created_at || new Date().toISOString(),
      role_name: u.role_name
    }));
    return { rows: list, rowCount: list.length };
  }

  if (normalized.includes('delete from users')) {
    data.users = data.users.filter((u: any) => u.id !== params[0]);
    const vendor = data.vendors.find((v: any) => v.user_id === params[0]);
    if (vendor) {
      data.vendors = data.vendors.filter((v: any) => v.user_id !== params[0]);
      data.stores = data.stores.filter((s: any) => s.vendor_id !== vendor.id);
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [], rowCount: 1 };
  }

  // 14. Payments Queries
  if (normalized.includes('insert into payments')) {
    const newPayment = {
      id: `pay-${Math.random().toString(36).substring(2, 10)}`,
      order_id: params[0],
      transaction_id: params[1],
      gateway: params[2],
      amount: parseFloat(params[3]),
      status: params[4],
      payload: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    data.payments = data.payments || [];
    const existingIdx = data.payments.findIndex((p: any) => p.transaction_id === params[1]);
    if (existingIdx >= 0) {
      data.payments[existingIdx].status = params[4];
      data.payments[existingIdx].payload = newPayment.payload;
      data.payments[existingIdx].updated_at = new Date().toISOString();
    } else {
      data.payments.push(newPayment);
    }
    
    if (params[4] === 'completed') {
      const order = data.orders.find((o: any) => o.id === params[0]);
      if (order) {
        order.payment_status = 'completed';
        order.status = 'processing';
      }
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [newPayment], rowCount: 1 };
  }

  if (normalized.includes('update payments')) {
    data.payments = data.payments || [];
    const payment = data.payments.find((p: any) => p.transaction_id === params[2]);
    let orderId: string | null = null;
    if (payment) {
      payment.status = params[0];
      payment.payload = typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1];
      payment.updated_at = new Date().toISOString();
      orderId = payment.order_id;
      
      if (params[0] === 'completed') {
        const order = data.orders.find((o: any) => o.id === orderId);
        if (order) {
          order.payment_status = 'completed';
          order.status = 'processing';
        }
      }
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: [{ order_id: orderId }], rowCount: payment ? 1 : 0 };
  }

  // 15. Reviews Purchase Check
  if (normalized.includes('from order_items') && normalized.includes('where o.customer_id = $1')) {
    const customerId = params[0];
    const productId = params[1];
    const order = data.orders.find((o: any) => o.customer_id === customerId && (o.items || []).some((item: any) => item.product_id === productId));
    return { rows: order ? [{ id: 'bought-1' }] : [], rowCount: order ? 1 : 0 };
  }

  // 16. Categories Management Queries
  if (normalized.includes('insert into categories')) {
    const name = params[0];
    const slug = params[1];
    const desc = params[2];
    const parentId = params[3] || null;
    const newCat = {
      id: `cat-${Math.random().toString(36).substring(2, 10)}`,
      name,
      slug,
      description: desc,
      parent_id: parentId
    };
    data.categories = data.categories || [];
    data.categories.push(newCat);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [newCat], rowCount: 1 };
  }

  if (normalized.includes('update categories')) {
    const catId = params[params.length - 1];
    const cat = data.categories.find((c: any) => c.id === catId);
    if (cat) {
      let valIdx = 0;
      if (normalized.includes('name =')) cat.name = params[valIdx++];
      if (normalized.includes('slug =')) cat.slug = params[valIdx++];
      if (normalized.includes('description =')) cat.description = params[valIdx++];
      if (normalized.includes('parent_id =')) cat.parent_id = params[valIdx++];
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: cat ? [cat] : [], rowCount: cat ? 1 : 0 };
  }

  if (normalized.includes('delete from categories')) {
    const catId = params[0];
    data.categories = data.categories.filter((c: any) => c.id !== catId);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [], rowCount: 1 };
  }

  // 17. Products Management Queries
  if (normalized.includes('insert into products')) {
    const storeId = params[0];
    const catId = params[1];
    const name = params[2];
    const slug = params[3];
    const desc = params[4];
    const price = parseFloat(params[5]);
    const compareAt = params[6] ? parseFloat(params[6]) : null;
    const sku = params[7];
    const status = params[8] || 'draft';

    const newProduct = {
      id: `p-${Math.random().toString(36).substring(2, 10)}`,
      store_id: storeId,
      category_id: catId,
      name,
      slug,
      description: desc,
      price,
      compare_at_price: compareAt,
      sku,
      is_approved: false,
      is_featured: false,
      status,
      created_at: new Date().toISOString(),
      store_name: data.stores.find((s: any) => s.id === storeId)?.name || 'Nike Official Store',
      store_slug: data.stores.find((s: any) => s.id === storeId)?.slug || 'nike-official',
      category_name: data.categories.find((c: any) => c.id === catId)?.name || '',
      stock_quantity: 0,
      low_stock_threshold: 10,
      rating: 5.0,
      reviews_count: 0,
      image_url: '',
      images: []
    };
    data.products = data.products || [];
    data.products.push(newProduct);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [newProduct], rowCount: 1 };
  }

  if (normalized.includes('update products')) {
    if (normalized.includes('is_approved = $1') && normalized.includes('status = $2')) {
      const isApproved = params[0];
      const status = params[1];
      const prodId = params[2];
      const prod = data.products.find((p: any) => p.id === prodId);
      if (prod) {
        prod.is_approved = isApproved;
        prod.status = status;
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      }
      return { rows: prod ? [prod] : [], rowCount: prod ? 1 : 0 };
    }
    if (normalized.includes('is_featured = $1')) {
      const isFeatured = params[0];
      const prodId = params[1];
      const prod = data.products.find((p: any) => p.id === prodId);
      if (prod) {
        prod.is_featured = isFeatured;
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      }
      return { rows: prod ? [prod] : [], rowCount: prod ? 1 : 0 };
    }
    const prodId = params[params.length - 1];
    const prod = data.products.find((p: any) => p.id === prodId);
    if (prod) {
      let valIdx = 0;
      if (normalized.includes('name =')) {
        prod.name = params[valIdx++];
        prod.slug = params[valIdx++];
      }
      if (normalized.includes('category_id =')) {
        prod.category_id = params[valIdx++];
        prod.category_name = data.categories.find((c: any) => c.id === prod.category_id)?.name || '';
      }
      if (normalized.includes('description =')) {
        prod.description = params[valIdx++];
      }
      if (normalized.includes('price =')) {
        prod.price = parseFloat(params[valIdx++]);
      }
      if (normalized.includes('compare_at_price =')) {
        prod.compare_at_price = params[valIdx] ? parseFloat(params[valIdx]) : null;
        valIdx++;
      }
      if (normalized.includes('sku =')) {
        prod.sku = params[valIdx++];
      }
      if (normalized.includes('status =')) {
        prod.status = params[valIdx++];
      }
      prod.is_approved = false;
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: prod ? [prod] : [], rowCount: prod ? 1 : 0 };
  }

  if (normalized.includes('delete from products')) {
    const prodId = params[0];
    data.products = data.products.filter((p: any) => p.id !== prodId);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('insert into product_images')) {
    const prodId = params[0];
    const imgUrl = params[1];
    const isFeatured = params[2] || false;
    const prod = data.products.find((p: any) => p.id === prodId);
    if (prod) {
      prod.images = prod.images || [];
      const newImg = {
        id: `img-${Math.random().toString(36).substring(2, 10)}`,
        image_url: imgUrl,
        is_featured: isFeatured
      };
      prod.images.push(newImg);
      if (isFeatured || !prod.image_url) {
        prod.image_url = imgUrl;
      }
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: [], rowCount: 1 };
  }

  if (normalized.includes('delete from product_images')) {
    const prodId = params[0];
    const prod = data.products.find((p: any) => p.id === prodId);
    if (prod) {
      prod.images = [];
      prod.image_url = '';
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    }
    return { rows: [], rowCount: 1 };
  }

  // 18. Inventory Management Queries
  if (normalized.includes('inventory')) {
    if (normalized.includes('update inventory')) {
      if (normalized.includes('stock_quantity = stock_quantity -')) {
        const quantity = params[0];
        const prodId = params[1];
        const prod = data.products.find((p: any) => p.id === prodId);
        if (prod) {
          prod.stock_quantity = (prod.stock_quantity || 0) - quantity;
          fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        }
        return { rows: [], rowCount: 1 };
      }
      const prodId = params[params.length - 1];
      const prod = data.products.find((p: any) => p.id === prodId);
      if (prod) {
        if (normalized.includes('stock_quantity =')) {
          if (normalized.includes('low_stock_threshold =')) {
            prod.stock_quantity = params[0];
            prod.low_stock_threshold = params[1];
          } else {
            prod.stock_quantity = params[0];
          }
        } else if (normalized.includes('low_stock_threshold =')) {
          prod.low_stock_threshold = params[0];
        }
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      }
      return { rows: [], rowCount: 1 };
    }
    if (normalized.includes('insert into inventory')) {
      const prodId = params[0];
      const qty = params[1];
      const threshold = params[2];
      const prod = data.products.find((p: any) => p.id === prodId);
      if (prod) {
        prod.stock_quantity = qty;
        prod.low_stock_threshold = threshold;
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      }
      return { rows: [], rowCount: 1 };
    }
  }

  return { rows: [], rowCount: 0 };
}

export const db = {
  /**
   * Execute a query on the pool, falling back to mock evaluator if pool fails.
   */
  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (useMockDb) {
      return evaluateMockQuery(text, params);
    }
    try {
      const start = Date.now();
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL === 'true') {
        console.log('Executed query', { text, duration, rowsCount: res.rowCount });
      }
      return res;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
        console.warn('PostgreSQL query error. Falling back to local JSON DB mode.');
        useMockDb = true;
        return evaluateMockQuery(text, params);
      }
      console.error('Database query error:', { text, error });
      throw error;
    }
  },

  /**
   * Run operations inside a database transaction, with JSON mock fallback.
   */
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    if (useMockDb) {
      const mockClient = {
        query: async (text: string, params?: any[]) => {
          return evaluateMockQuery(text, params);
        }
      };
      return callback(mockClient);
    }
    
    let client;
    try {
      client = await pool.connect();
    } catch (error: any) {
      console.warn('PostgreSQL pool connection failed in transaction. Falling back to local JSON DB.');
      useMockDb = true;
      const mockClient = {
        query: async (text: string, params?: any[]) => {
          return evaluateMockQuery(text, params);
        }
      };
      return callback(mockClient);
    }

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction rollback due to error:', error);
      throw error;
    } finally {
      client.release();
    }
  },
};
