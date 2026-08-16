import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const defaultCategories = [
  {
    id: 'men-shirts',
    name: "Men's Shirts",
    slug: 'men-shirts',
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80&sat=-100'
  },
  {
    id: 'men-t-shirts',
    name: "Men's T-Shirts",
    slug: 'men-t-shirts',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80&sat=-100'
  },
  {
    id: 'men-pants',
    name: "Men's Pants",
    slug: 'men-pants',
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80&sat=-100'
  },
  {
    id: 'men-jeans',
    name: "Men's Jeans",
    slug: 'men-jeans',
    image_url: 'https://images.unsplash.com/photo-1542272604-780c36856842?w=600&auto=format&fit=crop&q=80&sat=-100'
  },
  {
    id: 'hoodies',
    name: "Hoodies",
    slug: 'men-outerwear',
    image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80&sat=-100'
  },
  {
    id: 'designer-shirts',
    name: "Designer Shirts",
    slug: 'men-linen',
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80&sat=-100'
  }
];

const CategorySection = () => {
  const [categories, setCategories] = useState(defaultCategories);

  useEffect(() => {
    fetch('/api/categories?gender=men')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(err => console.error('Fetch categories error:', err));
  }, []);

  return (
    <section className="category-section-container">
      <div className="category-section-header">
        <h2 className="category-section-title">SHOP BY CATEGORY</h2>
        <div className="category-section-divider"></div>
      </div>

      <div className="category-circle-grid">
        {(categories || []).map((cat) => (
          <Link key={cat.id || cat.slug} to={`/men?category=${cat.slug}`} className="category-circle-card">
            <div className="category-circle-img-wrap">
              <img src={cat.image_url || cat.img} alt={cat.name} className="category-circle-img" />
            </div>
            <span className="category-circle-name">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategorySection;
