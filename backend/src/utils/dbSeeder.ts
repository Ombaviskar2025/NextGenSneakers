import { db } from '../config/db';

export async function seedDatabase() {
  try {
    // 1. Check if the latest sneaker products already exist
    const checkProd = await db.query("SELECT count(*) FROM products WHERE id = 'p-nike-gpchallenge'");
    const count = parseInt(checkProd.rows[0].count, 10);
    if (count > 0) {
      console.log('[DB AUTOSEED] All sneaker products already exist. Skipping seeding.');
      return;
    }

    console.log('[DB AUTOSEED] Sneaker categories not found. Seeding database with sneakers and categories...');

    // 2. Insert Roles
    await db.query(`
      INSERT INTO roles (id, name) VALUES
      ('d01fcf21-b0e1-4c28-98e3-9828231db621', 'admin'),
      ('d01fcf21-b0e1-4c28-98e3-9828231db622', 'vendor'),
      ('d01fcf21-b0e1-4c28-98e3-9828231db623', 'customer')
      ON CONFLICT DO NOTHING;
    `);

    // 3. Insert Nike Vendor User
    await db.query(`
      INSERT INTO users (id, email, password_hash, role_id, full_name, is_verified, phone) VALUES
      ('b2222222-2222-2222-2222-222222222229', 'nike@store.com', '$2b$10$wK1c7Yv8lO49b3vC8N1O2.3L2mN4oP5qR6sT7uU8vV9wWxXyYzZa2', 'd01fcf21-b0e1-4c28-98e3-9828231db622', 'Nike India Retailer', TRUE, '+919999977777')
      ON CONFLICT DO NOTHING;
    `);

    // 4. Insert Nike Vendor Business Profile
    await db.query(`
      INSERT INTO vendors (id, user_id, business_name, business_description, status, tax_id) VALUES
      ('v1111111-1111-1111-1111-111111111129', 'b2222222-2222-2222-2222-222222222229', 'Nike India Retail Ltd', 'Official local retailer for Nike footwear and apparel.', 'approved', 'GSTIN-123456789')
      ON CONFLICT DO NOTHING;
    `);

    // 5. Insert Nike Store
    await db.query(`
      INSERT INTO stores (id, vendor_id, name, slug, description, banner_url) VALUES
      ('s1111111-1111-1111-1111-111111111129', 'v1111111-1111-1111-1111-111111111129', 'Nike Official Store', 'nike-official', 'Official Nike storefront presenting running, basketball, lifestyle, and gym models.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200')
      ON CONFLICT DO NOTHING;
    `);

    // 6. Insert Sneaker Categories
    const categories = [
      { id: 'cat-lifestyle', name: 'Lifestyle', slug: 'lifestyle', desc: 'Everyday wear classics, retro models, and street culture styles.' },
      { id: 'cat-running', name: 'Running', slug: 'running', desc: 'High-performance cushioning and responsiveness for street running.' },
      { id: 'cat-basketball', name: 'Basketball', slug: 'basketball', desc: 'On-court stability and premium ankle support from retro to modern pro models.' },
      { id: 'cat-training', name: 'Training & Gym', slug: 'training', desc: 'Flat bases and high durability for weight training and functional fitness.' },
      { id: 'cat-tennis', name: 'Tennis', slug: 'tennis', desc: 'Nike premium tennis shoes for grass and clay courts.' }
    ];

    for (const cat of categories) {
      await db.query(`
        INSERT INTO categories (id, name, slug, description) VALUES
        ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING;
      `, [cat.id, cat.name, cat.slug, cat.desc]);
    }

    // 7. Insert Sneaker Products
    const products = [
      {
        id: 'p-nike-af1',
        cat_id: 'cat-lifestyle',
        name: "Nike Air Force 1 '07",
        slug: 'nike-air-force-1-07',
        desc: "The radiance lives on in the Nike Air Force 1 '07, the b-ball icon that puts a fresh spin on what you know best: crisp leather, bold colours and the perfect amount of flash to make you shine.",
        price: 7495.00,
        compare_at: 9995.00,
        sku: 'NK-AF1-07-WHT',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600',
        stock: 37
      },
      {
        id: 'p-nike-am90',
        cat_id: 'cat-lifestyle',
        name: 'Nike Air Max 90',
        slug: 'nike-air-max-90',
        desc: "Clean lines, versatile and timeless. The people's shoe returns with the Nike Air Max 90. Featuring the same iconic Waffle sole, stitched overlays and classic TPU accents you've come to love, it lets you walk among the pantheon of Air.",
        price: 9995.00,
        compare_at: 11995.00,
        sku: 'NK-AM90-INF-RED',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
        stock: 20
      },
      {
        id: 'p-nike-dunk',
        cat_id: 'cat-lifestyle',
        name: 'Nike Dunk Low Retro',
        slug: 'nike-dunk-low-retro',
        desc: "Created for the hardwood but taken to the streets, the Nike Dunk Low Retro returns with crisp overlays and original team colours. This basketball icon channels '80s vibes with premium leather in the upper.",
        price: 8295.00,
        compare_at: 9995.00,
        sku: 'NK-DUNK-RETRO-WOB',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
        stock: 30
      },
      {
        id: 'p-nike-pegasus',
        cat_id: 'cat-running',
        name: 'Nike Air Zoom Pegasus 40',
        slug: 'nike-air-zoom-pegasus-40',
        desc: "A springy ride for every run, the Peg's familiar, just-for-you feel returns to help you accomplish your goals. This version has the same responsiveness and neutral support you love, but with improved comfort in those sensitive areas.",
        price: 9695.00,
        compare_at: 11995.00,
        sku: 'NK-PEG-40-BLK',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
        stock: 50
      },
      {
        id: 'p-nike-trail',
        cat_id: 'cat-running',
        name: 'Nike Pegasus Trail 4',
        slug: 'nike-pegasus-trail-4',
        desc: "Run on roads, trails, or anywhere in between with the Nike Pegasus Trail 4. Durability and traction support you through rugged landscapes, while Air Zoom cushioning keeps your strides springy.",
        price: 10995.00,
        compare_at: 12995.00,
        sku: 'NK-PEG-TR4-BRN',
        is_featured: false,
        image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600',
        stock: 18
      },
      {
        id: 'p-nike-jordan',
        cat_id: 'cat-basketball',
        name: 'Air Jordan 1 Retro High OG',
        slug: 'air-jordan-1-retro-high-og',
        desc: "Familiar but always fresh, the iconic Air Jordan 1 is remastered for today's sneakerhead culture. This Retro High OG edition features premium leather, comfortable cushioning and classic design details.",
        price: 14995.00,
        compare_at: 16995.00,
        sku: 'AJ-1-RET-HI-CHI',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600',
        stock: 15
      },
      {
        id: 'p-nike-lebron',
        cat_id: 'cat-basketball',
        name: "LeBron XXI 'Queen Conch'",
        slug: 'lebron-xxi-queen-conch',
        desc: "The LeBron XXI features a cabling system that works with Zoom Air cushioning and a light, low-to-the-ground design, giving you agile explosiveness and premium court-feel without excess weight.",
        price: 17995.00,
        compare_at: 19995.00,
        sku: 'NK-LB21-CONCH',
        is_featured: false,
        image_url: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=600',
        stock: 12
      },
      {
        id: 'p-nike-metcon',
        cat_id: 'cat-training',
        name: 'Nike Metcon 9',
        slug: 'nike-metcon-9',
        desc: "Whatever your 'why' is for working out, the Metcon 9 makes it all worth it. We improved on the 8 with a larger Hyperlift plate and added rubber rope wrap. Sworn to by some of the greatest athletes in the world, it's gold standard for training.",
        price: 11995.00,
        compare_at: 13995.00,
        sku: 'NK-METCON-9-GRN',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',
        stock: 25
      },
      {
        id: 'p-nike-jordan4',
        cat_id: 'cat-basketball',
        name: 'Air Jordan 4 Retro Bred Reimagined',
        slug: 'air-jordan-4-retro-bred-reimagined',
        desc: "The Air Jordan 4 Retro Bred Reimagined updates the iconic silhouette with a premium black leather upper, replacing the traditional nubuck of the 1989 original. Classic detailing remains intact, including retro Nike Air branding on the heel tab.",
        price: 18995.00,
        compare_at: 21995.00,
        sku: 'AJ-4-RET-BRED-REIM',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
        stock: 18
      },
      {
        id: 'p-nike-travis',
        cat_id: 'cat-lifestyle',
        name: "Travis Scott x Air Jordan 1 Low 'Medium Olive'",
        slug: 'travis-scott-air-jordan-1-low-medium-olive',
        desc: "The Travis Scott x Air Jordan 1 Low 'Medium Olive' features the Houston rapper's signature reverse Swoosh on the lateral side, dressed in olive leather, contrasted by white leather overlays and an olive suede base.",
        price: 16995.00,
        compare_at: 19995.00,
        sku: 'AJ-1-LOW-TS-OLV',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600',
        stock: 8
      },
      {
        id: 'p-nike-vaporfly',
        cat_id: 'cat-running',
        name: 'Nike ZoomX Vaporfly 3',
        slug: 'nike-zoomx-vaporfly-3',
        desc: "Giving you race-day speed to conquer any distance, the Nike ZoomX Vaporfly 3 is built for the chasers, the racers and the elevated pacers who can't turn down the thrill of the pursuit.",
        price: 20695.00,
        compare_at: 22995.00,
        sku: 'NK-VAPORFLY-3-WHT',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600',
        stock: 15
      },
      {
        id: 'p-nike-bella',
        cat_id: 'cat-training',
        name: 'Nike Zoom Bella 6',
        slug: 'nike-zoom-bella-6',
        desc: "Release your inner force and drive in the Nike Zoom Bella 6. This design supports heavy lifts, explosive movements and post-set struts as you flaunt your hard-earned progress on the gym floor.",
        price: 7495.00,
        compare_at: 8995.00,
        sku: 'NK-BELLA-6-PNK',
        is_featured: false,
        image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',
        stock: 24
      },
      {
        id: 'p-nike-courtpro',
        cat_id: 'cat-tennis',
        name: 'Nike Court Zoom Pro',
        slug: 'nike-court-zoom-pro',
        desc: "Harness the power of your serve in the Nike Court Zoom Pro. Working in tandem with the Zoom Air unit in the forefoot, it has a full-length plate that acts like a springboard for maximum energy return.",
        price: 8495.00,
        compare_at: 9995.00,
        sku: 'NK-CRT-ZM-PRO',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
        stock: 12
      },
      // ─── NEW SHOES ────────────────────────────────────────
      {
        id: 'p-nike-blazer77',
        cat_id: 'cat-lifestyle',
        name: "Nike Blazer Mid '77 Vintage",
        slug: 'nike-blazer-mid-77-vintage',
        desc: "In the '70s, Nike was the new shoe on the block. So new that the first Blazer was drawn on a napkin and hoped to gain the approval of athletes. Clean, crisp and classic, this mid-top has a timeless design with premium suede and vintage stitching.",
        price: 7995.00,
        compare_at: 9495.00,
        sku: 'NK-BLZR-77-WHT',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=600',
        stock: 32
      },
      {
        id: 'p-nike-am97',
        cat_id: 'cat-lifestyle',
        name: 'Nike Air Max 97',
        slug: 'nike-air-max-97',
        desc: "Push your style full speed ahead with the Nike Air Max 97. Its full-length Nike Air unit pairs with a sleek, bullet-inspired design, representing a revolutionary chapter in Air Max history with reflective 3M detailing.",
        price: 12995.00,
        compare_at: 15995.00,
        sku: 'NK-AM97-SLV',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600',
        stock: 22
      },
      {
        id: 'p-nike-huarache',
        cat_id: 'cat-lifestyle',
        name: 'Nike Air Huarache',
        slug: 'nike-air-huarache',
        desc: "Born from the creative mind of Tinker Hatfield, the Nike Air Huarache changed the sneaker game with its neoprene inner sleeve for a sock-like fit. This icon remains a streetwear essential with bold colorways and unmatched comfort.",
        price: 8695.00,
        compare_at: 10995.00,
        sku: 'NK-HUARACHE-WHT',
        is_featured: false,
        image_url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600',
        stock: 28
      },
      {
        id: 'p-nike-sbdunk',
        cat_id: 'cat-lifestyle',
        name: 'Nike SB Dunk Low Pro',
        slug: 'nike-sb-dunk-low-pro',
        desc: "The Nike SB Dunk Low Pro takes the iconic basketball silhouette and reworks it for skateboarding with Zoom Air cushioning in the insole. Padded collar, grippy sole and premium suede upper deliver skate-ready durability and board feel.",
        price: 9295.00,
        compare_at: 11495.00,
        sku: 'NK-SB-DUNK-LP-BLK',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=600',
        stock: 14
      },
      {
        id: 'p-nike-reactinfinity',
        cat_id: 'cat-running',
        name: 'Nike React Infinity Run 3',
        slug: 'nike-react-infinity-run-3',
        desc: "Designed to help reduce injury and keep you on the run, the React Infinity Run 3 offers a wider forefoot, higher foam heights, and a rocker geometry to deliver cushioned comfort and a smooth transition during your run.",
        price: 11495.00,
        compare_at: 13995.00,
        sku: 'NK-REACT-INF3-BLU',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600',
        stock: 35
      },
      {
        id: 'p-nike-invincible3',
        cat_id: 'cat-running',
        name: 'Nike ZoomX Invincible Run 3',
        slug: 'nike-zoomx-invincible-run-3',
        desc: "Maximum cushioning, maximum energy return. The Invincible 3 offers the most ZoomX foam ever in a Nike running shoe for a soft, bouncy ride on your everyday runs. Flyknit upper provides breathable containment.",
        price: 14995.00,
        compare_at: 16995.00,
        sku: 'NK-INVINC-3-ORG',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=600',
        stock: 19
      },
      {
        id: 'p-nike-alphafly3',
        cat_id: 'cat-running',
        name: 'Nike Air Zoom Alphafly 3',
        slug: 'nike-air-zoom-alphafly-3',
        desc: "The latest evolution of Nike's marathon racing super shoe. The Alphafly 3 combines ZoomX foam, a full-length carbon-fibre plate, and dual Air Zoom units to deliver unprecedented energy return for record-breaking performance.",
        price: 24995.00,
        compare_at: 27995.00,
        sku: 'NK-ALPHAFLY-3-GRN',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600',
        stock: 10
      },
      {
        id: 'p-nike-kd16',
        cat_id: 'cat-basketball',
        name: 'Nike KD 16',
        slug: 'nike-kd-16',
        desc: "Kevin Durant's signature shoe returns with a full-length Air Zoom Strobel unit for an ultra-responsive court feel. Low-profile with a lightweight knit upper, the KD 16 keeps you locked in during quick cuts.",
        price: 13995.00,
        compare_at: 15995.00,
        sku: 'NK-KD16-BLK',
        is_featured: false,
        image_url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600',
        stock: 16
      },
      {
        id: 'p-nike-kyrielow5',
        cat_id: 'cat-basketball',
        name: 'Kyrie Low 5',
        slug: 'kyrie-low-5',
        desc: "Designed for Kyrie Irving's shifty style of play, the Low 5 features a curved outsole for multi-directional traction, Nike Air cushioning for impact protection, and a lightweight upper for unmatched agility on the court.",
        price: 10495.00,
        compare_at: 12495.00,
        sku: 'NK-KYRIE-L5-BLU',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=600',
        stock: 22
      },
      {
        id: 'p-nike-aj11',
        cat_id: 'cat-basketball',
        name: 'Air Jordan 11 Retro Cool Grey',
        slug: 'air-jordan-11-retro-cool-grey',
        desc: "The Air Jordan 11 is one of the most beloved sneakers of all time. The Cool Grey edition features premium leather and ballistic mesh upper with the iconic patent leather mudguard and a full-length Air-Sole unit for responsive cushioning.",
        price: 19995.00,
        compare_at: 22995.00,
        sku: 'AJ-11-RET-CG',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=600',
        stock: 11
      },
      {
        id: 'p-nike-ja1',
        cat_id: 'cat-basketball',
        name: "Nike Ja 1 'Scratch'",
        slug: 'nike-ja-1-scratch',
        desc: "Ja Morant's debut signature shoe is built for explosive guards. The Ja 1 features a lightweight cushioning system, herringbone outsole for court-gripping traction, and a playful design that reflects Ja's high-flying energy.",
        price: 9995.00,
        compare_at: 11995.00,
        sku: 'NK-JA1-SCRATCH',
        is_featured: false,
        image_url: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600',
        stock: 30
      },
      {
        id: 'p-nike-freemetcon5',
        cat_id: 'cat-training',
        name: 'Nike Free Metcon 5',
        slug: 'nike-free-metcon-5',
        desc: "The Nike Free Metcon 5 combines the flexibility of Nike Free with the stability of Metcon. Its split design gives you a flexible forefoot for agility exercises while the flat, stable heel supports heavy lifting.",
        price: 9295.00,
        compare_at: 10995.00,
        sku: 'NK-FREEMET-5-GRY',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600',
        stock: 27
      },
      {
        id: 'p-nike-superrep3',
        cat_id: 'cat-training',
        name: 'Nike SuperRep Go 3 Flyknit',
        slug: 'nike-superrep-go-3-flyknit',
        desc: "An ultra-lightweight training shoe designed for HIIT and circuit sessions. Breathable Flyknit wraps your foot, while the curved outsole eases transitions between exercises for a smooth, multi-movement workout.",
        price: 7695.00,
        compare_at: 8995.00,
        sku: 'NK-SUPERREP-3-PNK',
        is_featured: false,
        image_url: 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=600',
        stock: 33
      },
      {
        id: 'p-nike-courtlite4',
        cat_id: 'cat-tennis',
        name: 'Nike Court Lite 4',
        slug: 'nike-court-lite-4',
        desc: "A versatile, lightweight tennis shoe that brings cushioned comfort and durable traction to the court. The Court Lite 4 features a mesh upper for breathability, reinforced toe cap, and a herringbone outsole for superior grip.",
        price: 5495.00,
        compare_at: 6995.00,
        sku: 'NK-CRT-LT4-WHT',
        is_featured: false,
        image_url: 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=600',
        stock: 40
      },
      {
        id: 'p-nike-gpchallenge',
        cat_id: 'cat-tennis',
        name: 'Nike GP Challenge Pro',
        slug: 'nike-gp-challenge-pro',
        desc: "Step onto the court with pro-level performance. The GP Challenge Pro offers a supportive fit with a cushioned Zoom Air unit in the heel, durable herringbone traction pattern, and a sleek low-top design built for aggressive baseline play.",
        price: 9995.00,
        compare_at: 11995.00,
        sku: 'NK-GP-CHALL-PRO',
        is_featured: true,
        image_url: 'https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=600',
        stock: 17
      }
    ];

    for (const p of products) {
      // Create Product
      await db.query(`
        INSERT INTO products (id, store_id, category_id, name, slug, description, price, compare_at_price, sku, is_approved, is_featured, status) VALUES
        ($1, 's1111111-1111-1111-1111-111111111129', $2, $3, $4, $5, $6, $7, $8, TRUE, $9, 'published')
        ON CONFLICT DO NOTHING;
      `, [p.id, p.cat_id, p.name, p.slug, p.desc, p.price, p.compare_at, p.sku, p.is_featured]);

      // Create Featured Product Image
      await db.query(`
        INSERT INTO product_images (product_id, image_url, is_featured) VALUES
        ($1, $2, TRUE)
        ON CONFLICT DO NOTHING;
      `, [p.id, p.image_url]);

      // Create Inventory
      await db.query(`
        INSERT INTO inventory (product_id, stock_quantity, low_stock_threshold) VALUES
        ($1, $2, 5)
        ON CONFLICT (product_id) DO NOTHING;
      `, [p.id, p.stock]);
    }

    console.log('[DB AUTOSEED] Seeding completed successfully!');
  } catch (error) {
    console.error('[DB AUTOSEED] Error seeding database:', error);
  }
}
