const bcrypt = require('bcryptjs');
const db = require('./db');

async function seedDatabase() {
  console.log('Seeding GRABB-IT Database...');

  try {
    if (!db.isPg) {
      db.sqliteDb.exec('PRAGMA foreign_keys = OFF');
    }

    // Clear existing tables
    await db.run('DELETE FROM reviews');
    await db.run('DELETE FROM order_items');
    await db.run('DELETE FROM orders');
    await db.run('DELETE FROM coupons');
    await db.run('DELETE FROM wishlists');
    await db.run('DELETE FROM cart_items');
    await db.run('DELETE FROM carts');
    await db.run('DELETE FROM collection_products');
    await db.run('DELETE FROM collections');
    await db.run('DELETE FROM look_products');
    await db.run('DELETE FROM looks');
    await db.run('DELETE FROM product_images');
    await db.run('DELETE FROM product_variants');
    await db.run('DELETE FROM products');
    await db.run('DELETE FROM categories');
    await db.run('DELETE FROM banners');
    await db.run('DELETE FROM addresses');
    await db.run('DELETE FROM users');

    if (!db.isPg) {
      db.sqliteDb.exec('PRAGMA foreign_keys = ON');
    }

    // 1. Users
    const adminPasswordHash = bcrypt.hashSync('Admin@123456', 10);
    const customerPasswordHash = bcrypt.hashSync('Customer@123', 10);

    const adminResult = await db.insert(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ('Grabb-It Admin', 'admin@grabb-it.com', ?, 'admin', '+18005550199')
    `, [adminPasswordHash]);

    const customerResult = await db.insert(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ('Alex Morgan', 'customer@grabb-it.com', ?, 'customer', '+18005550123')
    `, [customerPasswordHash]);

    // Customer address
    await db.insert(`
      INSERT INTO addresses (user_id, full_name, phone, address_line, city, state, pincode, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [customerResult.id, 'Alex Morgan', '+18005550123', '742 Evergreen Terrace', 'Springfield', 'OR', '97477']);

    // 2. Categories
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

    for (let index = 0; index < menCategoriesData.length; index++) {
      const cat = menCategoriesData[index];
      const res = await db.insert(`
        INSERT INTO categories (name, slug, gender, image_url, display_order, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `, [cat.name, cat.slug, 'men', cat.img, index + 1]);
      categoryMap[cat.slug] = res.id;
    }

    for (let index = 0; index < womenCategoriesData.length; index++) {
      const cat = womenCategoriesData[index];
      const res = await db.insert(`
        INSERT INTO categories (name, slug, gender, image_url, display_order, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `, [cat.name, cat.slug, 'women', cat.img, index + 1]);
      categoryMap[cat.slug] = res.id;
    }

    // 3. Banners
    await db.insert(`
      INSERT INTO banners (title, subtitle, button_text, button_link, image_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [
      'NEW ARRIVALS 2026',
      'Fresh minimal styles designed for everyday confidence.',
      'SHOP MEN',
      '/men',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
      1
    ]);

    await db.insert(`
      INSERT INTO banners (title, subtitle, button_text, button_link, image_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [
      'WOMEN\'S ESSENTIALS',
      'Clean silhouettes, premium fabrics, effortless elegance.',
      'SHOP WOMEN',
      '/women',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&auto=format&fit=crop&q=80',
      2
    ]);

    await db.insert(`
      INSERT INTO banners (title, subtitle, button_text, button_link, image_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [
      'SEASONAL SALE - UP TO 40% OFF',
      'Upgrade your wardrobe with tailored outerwear & raw denim.',
      'EXPLORE OFFERS',
      '/offers',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
      3
    ]);

    // 4. Products & Variants & Images
    const rawProducts = [
      {
        name: 'Essential Oversized Heavyweight Tee',
        slug: 'men-essential-oversized-heavyweight-tee',
        gender: 'men',
        categorySlug: 'men-t-shirts',
        price: 1299.00,
        salePrice: 999.00,
        sku: 'GRB-M-TSH-001',
        description: 'Crafted from 240 GSM organic combed cotton, this boxy oversized t-shirt offers structure and breathability.',
        rating: 4.8,
        reviewCount: 42,
        isNew: 1,
        isTrending: 1,
        isFeatured: 1,
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'],
        colors: [{ name: 'Black', hex: '#111111' }, { name: 'White', hex: '#FFFFFF' }],
        sizes: ['S', 'M', 'L', 'XL']
      },
      {
        name: 'Minimalist Relaxed Cuban Collar Shirt',
        slug: 'men-minimalist-relaxed-cuban-collar-shirt',
        gender: 'men',
        categorySlug: 'men-shirts',
        price: 1999.00,
        salePrice: 1499.00,
        sku: 'GRB-M-SHR-002',
        description: 'Airy cotton-blend woven shirt with a retro camp collar.',
        rating: 4.6,
        reviewCount: 28,
        isNew: 1,
        isTrending: 1,
        isFeatured: 1,
        images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800'],
        colors: [{ name: 'Beige', hex: '#F5F5DC' }, { name: 'Olive', hex: '#556B2F' }],
        sizes: ['S', 'M', 'L', 'XL']
      },
      {
        name: 'Japanese Selvedge Tapered Fit Jeans',
        slug: 'men-japanese-selvedge-tapered-fit-jeans',
        gender: 'men',
        categorySlug: 'men-jeans',
        price: 2999.00,
        salePrice: 2499.00,
        sku: 'GRB-M-JNS-003',
        description: '13.5 oz indigo raw denim cut in a modern relaxed-taper silhouette.',
        rating: 4.9,
        reviewCount: 64,
        isNew: 0,
        isTrending: 1,
        isFeatured: 1,
        images: ['https://images.unsplash.com/photo-1542272604-780c36856842?w=800', 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800'],
        colors: [{ name: 'Dark Indigo', hex: '#1C2833' }],
        sizes: ['M', 'L', 'XL']
      },
      {
        name: 'Organic Slub Cotton Crewneck Tee',
        slug: 'women-organic-slub-cotton-crewneck-tee',
        gender: 'women',
        categorySlug: 'women-t-shirts',
        price: 999.00,
        salePrice: 799.00,
        sku: 'GRB-W-TSH-008',
        description: 'Super-soft lightweight organic cotton jersey with subtle slub texture.',
        rating: 4.8,
        reviewCount: 31,
        isNew: 1,
        isTrending: 1,
        isFeatured: 1,
        images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'],
        colors: [{ name: 'White', hex: '#FFFFFF' }, { name: 'Black', hex: '#111111' }],
        sizes: ['S', 'M', 'L']
      },
      {
        name: 'Oversized Poplin Button-Down Shirt',
        slug: 'women-oversized-poplin-button-down-shirt',
        gender: 'women',
        categorySlug: 'women-shirts',
        price: 1799.00,
        salePrice: 1299.00,
        sku: 'GRB-W-SHR-009',
        description: 'Crisp 100% cotton poplin cut with a relaxed boyfriend silhouette.',
        rating: 4.7,
        reviewCount: 22,
        isNew: 1,
        isTrending: 1,
        isFeatured: 1,
        images: ['https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800', 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800'],
        colors: [{ name: 'Pure White', hex: '#FFFFFF' }],
        sizes: ['S', 'M', 'L']
      },
      {
        name: 'High-Waisted Straight Wide-Leg Jeans',
        slug: 'women-high-waisted-straight-wide-leg-jeans',
        gender: 'women',
        categorySlug: 'women-jeans',
        price: 2499.00,
        salePrice: 1999.00,
        sku: 'GRB-W-JNS-010',
        description: 'Vintage-inspired high-rise denim hugging the waist and easing into a wide leg.',
        rating: 4.9,
        reviewCount: 58,
        isNew: 0,
        isTrending: 1,
        isFeatured: 1,
        images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800', 'https://images.unsplash.com/photo-1582418702059-97ebdfb35d09?w=800'],
        colors: [{ name: 'Vintage Wash', hex: '#5DADE2' }],
        sizes: ['S', 'M', 'L']
      }
    ];

    // 5. Collections
    const coll1 = await db.insert(`
      INSERT INTO collections (name, slug, description, cover_image, banner_image, gender, is_active)
      VALUES ('The Everyday Edit', 'everyday-edit', 'Curated premium basics.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1600', 'men', 1)
    `);
    const coll2 = await db.insert(`
      INSERT INTO collections (name, slug, description, cover_image, banner_image, gender, is_active)
      VALUES ('Summer Edit 2026', 'summer-edit-2026', 'Lightweight linens & breezy styles.', 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800', 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=1600', 'women', 1)
    `);

    // 6. Looks
    const look1 = await db.insert(`
      INSERT INTO looks (name, description, image_url, gender)
      VALUES ('Look 01: Street Vibe', 'Heavyweight Tee + Selvedge Jeans', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800', 'men')
    `);

    for (let pIdx = 0; pIdx < rawProducts.length; pIdx++) {
      const prod = rawProducts[pIdx];
      const categoryId = categoryMap[prod.categorySlug];
      if (!categoryId) continue;

      const res = await db.insert(`
        INSERT INTO products (name, slug, description, gender, category_id, price, sale_price, sku, rating, review_count, is_new, is_trending, is_featured, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        prod.name, prod.slug, prod.description, prod.gender, categoryId,
        prod.price, prod.salePrice, prod.sku, prod.rating, prod.reviewCount,
        prod.isNew, prod.isTrending, prod.isFeatured, pIdx + 1
      ]);

      const productId = res.id;

      for (let imgIdx = 0; imgIdx < prod.images.length; imgIdx++) {
        await db.insert('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)', [
          productId, prod.images[imgIdx], imgIdx === 0 ? 1 : 0, imgIdx + 1
        ]);
      }

      for (const col of prod.colors) {
        for (const sz of prod.sizes) {
          await db.insert('INSERT INTO product_variants (product_id, size, color, color_hex, stock) VALUES (?, ?, ?, ?, ?)', [
            productId, sz, col.name, col.hex, 20
          ]);
        }
      }

      if (prod.gender === 'men') {
        await db.insert('INSERT INTO collection_products (collection_id, product_id) VALUES (?, ?)', [coll1.id, productId]);
        await db.insert('INSERT INTO look_products (look_id, product_id) VALUES (?, ?)', [look1.id, productId]);
      } else {
        await db.insert('INSERT INTO collection_products (collection_id, product_id) VALUES (?, ?)', [coll2.id, productId]);
      }

      if (prod.reviewCount > 0) {
        await db.insert(`
          INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
          VALUES (?, ?, 'Alex Morgan', 5, ?)
        `, [productId, customerResult.id, `Absolute top quality! The fabric feel of the ${prod.name} is unbelievable for the price.`]);
      }
    }

    // 7. Coupons
    await db.insert('INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expiry_date, usage_limit, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)', ['GRABB10', 'percentage', 10, 0, '2027-12-31', 500]);
    await db.insert('INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, expiry_date, usage_limit, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)', ['WELCOME500', 'fixed', 500, 2499, '2027-12-31', 100]);

    console.log('Database seeded successfully in INR!');
    console.log('Admin Login: admin@grabb-it.com / Admin@123456');
    console.log('Customer Login: customer@grabb-it.com / Customer@123');
    process.exit(0);
  } catch (err) {
    console.error('Database Seed Error:', err);
    process.exit(1);
  }
}

seedDatabase();
