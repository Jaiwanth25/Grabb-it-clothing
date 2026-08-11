const bcrypt = require('bcryptjs');
const db = require('./db');

function seedDatabase() {
  console.log('Seeding GRABB-IT Database...');

  // Enable foreign keys
  db.pragma('foreign_keys = OFF');

  // Clear existing tables
  db.prepare('DELETE FROM reviews').run();
  db.prepare('DELETE FROM order_items').run();
  db.prepare('DELETE FROM orders').run();
  db.prepare('DELETE FROM coupons').run();
  db.prepare('DELETE FROM wishlists').run();
  db.prepare('DELETE FROM cart_items').run();
  db.prepare('DELETE FROM carts').run();
  db.prepare('DELETE FROM product_images').run();
  db.prepare('DELETE FROM product_variants').run();
  db.prepare('DELETE FROM products').run();
  db.prepare('DELETE FROM categories').run();
  db.prepare('DELETE FROM banners').run();
  db.prepare('DELETE FROM addresses').run();
  db.prepare('DELETE FROM users').run();

  db.pragma('foreign_keys = ON');

  // 1. Users
  const adminPasswordHash = bcrypt.hashSync('Admin@123456', 10);
  const customerPasswordHash = bcrypt.hashSync('Customer@123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const adminResult = insertUser.run('Grabb-It Admin', 'admin@grabb-it.com', adminPasswordHash, 'admin', '+18005550199');
  const customerResult = insertUser.run('Alex Morgan', 'customer@grabb-it.com', customerPasswordHash, 'customer', '+18005550123');

  // Customer address
  db.prepare(`
    INSERT INTO addresses (user_id, full_name, phone, address_line, city, state, pincode, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(customerResult.lastInsertRowid, 'Alex Morgan', '+18005550123', '742 Evergreen Terrace', 'Springfield', 'OR', '97477');

  // 2. Categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, gender, image_url, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const menCategoriesData = [
    { name: 'T-Shirts', slug: 'men-t-shirts', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80' },
    { name: 'Shirts', slug: 'men-shirts', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80' },
    { name: 'Jeans', slug: 'men-jeans', img: 'https://images.unsplash.com/photo-1542272604-780c36856842?w=800&auto=format&fit=crop&q=80' },
    { name: 'Pants', slug: 'men-pants', img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80' },
    { name: 'Joggers', slug: 'men-joggers', img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80' },
    { name: 'Linen', slug: 'men-linen', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80' },
    { name: 'Outerwear', slug: 'men-outerwear', img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80' },
  ];

  const womenCategoriesData = [
    { name: 'T-Shirts', slug: 'women-t-shirts', img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80' },
    { name: 'Shirts', slug: 'women-shirts', img: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80' },
    { name: 'Jeans', slug: 'women-jeans', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80' },
    { name: 'Pants', slug: 'women-pants', img: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800&auto=format&fit=crop&q=80' },
    { name: 'Joggers', slug: 'women-joggers', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80' },
    { name: 'Tops', slug: 'women-tops', img: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&auto=format&fit=crop&q=80' },
    { name: 'Shorts', slug: 'women-shorts', img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80' },
    { name: 'Denims', slug: 'women-denims', img: 'https://images.unsplash.com/photo-1582418702059-97ebdfb35d09?w=800&auto=format&fit=crop&q=80' },
  ];

  const categoryMap = {};

  menCategoriesData.forEach((cat, index) => {
    const res = insertCategory.run(cat.name, cat.slug, 'men', cat.img, index + 1);
    categoryMap[cat.slug] = res.lastInsertRowid;
  });

  womenCategoriesData.forEach((cat, index) => {
    const res = insertCategory.run(cat.name, cat.slug, 'women', cat.img, index + 1);
    categoryMap[cat.slug] = res.lastInsertRowid;
  });

  // 3. Banners
  const insertBanner = db.prepare(`
    INSERT INTO banners (title, subtitle, button_text, button_link, image_url, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertBanner.run(
    'NEW ARRIVALS 2026',
    'Fresh minimal styles designed for everyday confidence.',
    'SHOP MEN',
    '/men',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
    1
  );

  insertBanner.run(
    'WOMEN\'S ESSENTIALS',
    'Clean silhouettes, premium fabrics, effortless elegance.',
    'SHOP WOMEN',
    '/women',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&auto=format&fit=crop&q=80',
    2
  );

  insertBanner.run(
    'SEASONAL SALE - UP TO 40% OFF',
    'Upgrade your wardrobe with tailored outerwear & raw denim.',
    'EXPLORE OFFERS',
    '/offers',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
    3
  );

  // 4. Products & Variants & Images
  const insertProduct = db.prepare(`
    INSERT INTO products (name, slug, description, gender, category_id, price, sale_price, sku, rating, review_count, is_new, is_trending, is_featured, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVariant = db.prepare(`
    INSERT INTO product_variants (product_id, size, color, color_hex, stock)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, image_url, is_primary, display_order)
    VALUES (?, ?, ?, ?)
  `);

  const rawProducts = [
    // MEN PRODUCTS
    {
      name: 'Essential Oversized Heavyweight Tee',
      slug: 'men-essential-oversized-heavyweight-tee',
      gender: 'men',
      categorySlug: 'men-t-shirts',
      price: 39.99,
      salePrice: 29.99,
      sku: 'GRB-M-TSH-001',
      description: 'Crafted from 240 GSM organic combed cotton, this boxy oversized t-shirt offers structure and breathability. Features reinforced collar ribbing and drop shoulders.',
      rating: 4.8,
      reviewCount: 42,
      isNew: 1,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Black', hex: '#111111' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Slate Gray', hex: '#708090' }],
      sizes: ['S', 'M', 'L', 'XL', 'XXL']
    },
    {
      name: 'Minimalist Relaxed Cuban Collar Shirt',
      slug: 'men-minimalist-relaxed-cuban-collar-shirt',
      gender: 'men',
      categorySlug: 'men-shirts',
      price: 59.99,
      salePrice: 49.99,
      sku: 'GRB-M-SHR-002',
      description: 'Airy cotton-blend woven shirt with a retro camp collar. Designed for warm weekend breezes and laid-back sophistication.',
      rating: 4.6,
      reviewCount: 28,
      isNew: 1,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Beige', hex: '#F5F5DC' }, { name: 'Olive', hex: '#556B2F' }, { name: 'Navy', hex: '#000080' }],
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      name: 'Japanese Selvedge Tapered Fit Jeans',
      slug: 'men-japanese-selvedge-tapered-fit-jeans',
      gender: 'men',
      categorySlug: 'men-jeans',
      price: 89.99,
      salePrice: 74.99,
      sku: 'GRB-M-JNS-003',
      description: '13.5 oz indigo raw denim cut in a modern relaxed-taper silhouette. Clean contrast stitching and silver hardware finish.',
      rating: 4.9,
      reviewCount: 64,
      isNew: 0,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1542272604-780c36856842?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Dark Indigo', hex: '#1C2833' }, { name: 'Washed Blue', hex: '#3498DB' }],
      sizes: ['M', 'L', 'XL']
    },
    {
      name: 'Tailored Pleated Straight Trousers',
      slug: 'men-tailored-pleated-straight-trousers',
      gender: 'men',
      categorySlug: 'men-pants',
      price: 69.99,
      salePrice: null,
      sku: 'GRB-M-PNT-004',
      description: 'Versatile smart-casual trousers featuring twin front pleats, hidden elastic waistband, and clean cropped hem.',
      rating: 4.7,
      reviewCount: 19,
      isNew: 1,
      isTrending: 0,
      isFeatured: 0,
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Charcoal', hex: '#36454F' }, { name: 'Black', hex: '#111111' }, { name: 'Khaki', hex: '#C3B091' }],
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      name: 'Structured Fleece Heavyweight Joggers',
      slug: 'men-structured-fleece-heavyweight-joggers',
      gender: 'men',
      categorySlug: 'men-joggers',
      price: 49.99,
      salePrice: 39.99,
      sku: 'GRB-M-JOG-005',
      description: 'Plush brushed fleece interior with sleek tailored outer stitching. Features deep zipped pockets and ribbed ankle cuffs.',
      rating: 4.8,
      reviewCount: 37,
      isNew: 0,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Heather Gray', hex: '#D3D3D3' }, { name: 'Black', hex: '#111111' }],
      sizes: ['S', 'M', 'L', 'XL', 'XXL']
    },
    {
      name: 'Pure French Linen Resort Shirt',
      slug: 'men-pure-french-linen-resort-shirt',
      gender: 'men',
      categorySlug: 'men-linen',
      price: 64.99,
      salePrice: 54.99,
      sku: 'GRB-M-LIN-006',
      description: '100% natural flax French linen shirt. Lightweight, moisture-wicking, and garment-washed for ultra-soft hand feel.',
      rating: 4.9,
      reviewCount: 15,
      isNew: 1,
      isTrending: 0,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Off-White', hex: '#F8F9FA' }, { name: 'Sky Blue', hex: '#87CEEB' }],
      sizes: ['M', 'L', 'XL']
    },
    {
      name: 'Utility Padded Canvas Bomber Jacket',
      slug: 'men-utility-padded-canvas-bomber-jacket',
      gender: 'men',
      categorySlug: 'men-outerwear',
      price: 119.99,
      salePrice: 99.99,
      sku: 'GRB-M-OUT-007',
      description: 'Rugged cotton canvas shell insulated with lightweight thermal padding. Heavy-duty dual metal zip and storm flap.',
      rating: 4.9,
      reviewCount: 53,
      isNew: 0,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Matte Black', hex: '#1C1C1C' }, { name: 'Army Green', hex: '#4B5320' }],
      sizes: ['S', 'M', 'L', 'XL']
    },

    // WOMEN PRODUCTS
    {
      name: 'Organic Slub Cotton Crewneck Tee',
      slug: 'women-organic-slub-cotton-crewneck-tee',
      gender: 'women',
      categorySlug: 'women-t-shirts',
      price: 34.99,
      salePrice: 24.99,
      sku: 'GRB-W-TSH-008',
      description: 'Super-soft lightweight organic cotton jersey with subtle slub texture. Relaxed fit ideal for effortless layering.',
      rating: 4.8,
      reviewCount: 31,
      isNew: 1,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Black', hex: '#111111' }, { name: 'Blush Pink', hex: '#FFB6C1' }],
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      name: 'Oversized Poplin Button-Down Shirt',
      slug: 'women-oversized-poplin-button-down-shirt',
      gender: 'women',
      categorySlug: 'women-shirts',
      price: 54.99,
      salePrice: 44.99,
      sku: 'GRB-W-SHR-009',
      description: 'Crisp 100% cotton poplin cut with a relaxed boyfriend silhouette, curved hemline, and shell-look buttons.',
      rating: 4.7,
      reviewCount: 22,
      isNew: 1,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Pure White', hex: '#FFFFFF' }, { name: 'Sky Blue', hex: '#87CEEB' }],
      sizes: ['S', 'M', 'L']
    },
    {
      name: 'High-Waisted Straight Wide-Leg Jeans',
      slug: 'women-high-waisted-straight-wide-leg-jeans',
      gender: 'women',
      categorySlug: 'women-jeans',
      price: 79.99,
      salePrice: 64.99,
      sku: 'GRB-W-JNS-010',
      description: 'Vintage-inspired high-rise denim hugging the waist and easing into an elegant wide leg contour.',
      rating: 4.9,
      reviewCount: 58,
      isNew: 0,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1582418702059-97ebdfb35d09?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Vintage Wash', hex: '#5DADE2' }, { name: 'Classic Black', hex: '#111111' }],
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      name: 'Pleated High-Rise Wide Tailored Pants',
      slug: 'women-pleated-high-rise-wide-tailored-pants',
      gender: 'women',
      categorySlug: 'women-pants',
      price: 69.99,
      salePrice: null,
      sku: 'GRB-W-PNT-011',
      description: 'Fluid drape trousers featuring twin front darts, discreet side slant pockets, and back welt accents.',
      rating: 4.6,
      reviewCount: 14,
      isNew: 1,
      isTrending: 0,
      isFeatured: 0,
      images: [
        'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Camel', hex: '#C19A6B' }, { name: 'Black', hex: '#111111' }],
      sizes: ['S', 'M', 'L']
    },
    {
      name: 'Minimal Soft Knit Lounge Joggers',
      slug: 'women-minimal-soft-knit-lounge-joggers',
      gender: 'women',
      categorySlug: 'women-joggers',
      price: 44.99,
      salePrice: 34.99,
      sku: 'GRB-W-JOG-012',
      description: 'Ultra-plush modal blend lounge pants with high drawstring waist and tapered elastic cuffs.',
      rating: 4.8,
      reviewCount: 40,
      isNew: 0,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Oatmeal', hex: '#E6D7C3' }, { name: 'Charcoal', hex: '#36454F' }],
      sizes: ['S', 'M', 'L', 'XL']
    },
    {
      name: 'Ribbed Seamless Square Neck Tank Top',
      slug: 'women-ribbed-seamless-square-neck-tank-top',
      gender: 'women',
      categorySlug: 'women-tops',
      price: 29.99,
      salePrice: 19.99,
      sku: 'GRB-W-TOP-013',
      description: 'Contouring 4-way stretch ribbed knit top with structured square neckline and clean edge finish.',
      rating: 4.9,
      reviewCount: 76,
      isNew: 1,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Black', hex: '#111111' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Terracotta', hex: '#E2725B' }],
      sizes: ['S', 'M', 'L']
    },
    {
      name: 'High-Rise Tailored Linen Blend Shorts',
      slug: 'women-high-rise-tailored-linen-blend-shorts',
      gender: 'women',
      categorySlug: 'women-shorts',
      price: 39.99,
      salePrice: 29.99,
      sku: 'GRB-W-SRT-014',
      description: 'Chic high-waisted linen shorts featuring front pleats, matching fabric belt, and turn-up hems.',
      rating: 4.7,
      reviewCount: 25,
      isNew: 1,
      isTrending: 0,
      isFeatured: 0,
      images: [
        'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Sand', hex: '#F4A460' }, { name: 'Sage Green', hex: '#8A9A86' }],
      sizes: ['S', 'M', 'L']
    },
    {
      name: 'Cropped Raw-Hem Denim Trucker Jacket',
      slug: 'women-cropped-raw-hem-denim-trucker-jacket',
      gender: 'women',
      categorySlug: 'women-denims',
      price: 84.99,
      salePrice: 69.99,
      sku: 'GRB-W-DEN-015',
      description: 'Boxy crop denim jacket with subtle distressing and unfinished frayed raw hemline.',
      rating: 4.9,
      reviewCount: 45,
      isNew: 0,
      isTrending: 1,
      isFeatured: 1,
      images: [
        'https://images.unsplash.com/photo-1582418702059-97ebdfb35d09?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80'
      ],
      colors: [{ name: 'Light Wash Denim', hex: '#A9CCE3' }, { name: 'Off-White', hex: '#FAF0E6' }],
      sizes: ['S', 'M', 'L', 'XL']
    }
  ];

  rawProducts.forEach((prod, pIdx) => {
    const categoryId = categoryMap[prod.categorySlug];
    if (!categoryId) return;

    const res = insertProduct.run(
      prod.name,
      prod.slug,
      prod.description,
      prod.gender,
      categoryId,
      prod.price,
      prod.salePrice,
      prod.sku,
      prod.rating,
      prod.reviewCount,
      prod.isNew,
      prod.isTrending,
      prod.isFeatured,
      pIdx + 1
    );

    const productId = res.lastInsertRowid;

    // Add Images
    prod.images.forEach((imgUrl, imgIdx) => {
      insertImage.run(productId, imgUrl, imgIdx === 0 ? 1 : 0, imgIdx + 1);
    });

    // Add Variants (sizes x colors)
    prod.colors.forEach((col) => {
      prod.sizes.forEach((sz) => {
        const stockQty = Math.floor(Math.random() * 25) + 5; // 5 to 30 stock
        insertVariant.run(productId, sz, col.name, col.hex, stockQty);
      });
    });

    // Add Sample Reviews
    if (prod.reviewCount > 0) {
      db.prepare(`
        INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        productId,
        customerResult.lastInsertRowid,
        'Alex Morgan',
        5,
        `Absolute top quality! The fabric feel of the ${prod.name} is unbelievable for the price.`
      );
    }
  });

  // 5. Coupons
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expiry_date, usage_limit, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertCoupon.run('GRABB10', 'percentage', 10, 0, '2027-12-31', 500);
  insertCoupon.run('WELCOME20', 'fixed', 20, 60, '2027-12-31', 100);
  insertCoupon.run('FASHION15', 'percentage', 15, 40, '2027-12-31', 200);

  console.log('Database seeded successfully!');
  console.log('Admin Login: admin@grabb-it.com / Admin@123456');
  console.log('Customer Login: customer@grabb-it.com / Customer@123');
}

seedDatabase();
