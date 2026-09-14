import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGender } from '../context/GenderContext';
import { getApiUrl, formatImageUrl } from '../services/api';

const defaultMenCategories = [
  {
    id: 'men-t-shirts',
    name: "T-Shirts",
    slug: 'men-t-shirts',
    gender: 'men',
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'men-shirts',
    name: "Shirts",
    slug: 'men-shirts',
    gender: 'men',
    image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'men-jeans',
    name: "Jeans",
    slug: 'men-jeans',
    gender: 'men',
    image_url: 'https://images.unsplash.com/photo-1542272604-780c36856842?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'men-pants',
    name: "Pants",
    slug: 'men-pants',
    gender: 'men',
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'men-joggers',
    name: "Joggers",
    slug: 'men-joggers',
    gender: 'men',
    image_url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'men-linen',
    name: "Linen",
    slug: 'men-linen',
    gender: 'men',
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'men-outerwear',
    name: "Outerwear",
    slug: 'men-outerwear',
    gender: 'men',
    image_url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80'
  }
];

const CategorySection = () => {
  const defaults = defaultMenCategories;
  const [categories, setCategories] = useState(defaults);

  useEffect(() => {
    fetch(getApiUrl('/api/categories?gender=men'))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(defaults);
        }
      })
      .catch(err => {
        console.error('Fetch categories error:', err);
        setCategories(defaults);
      });
  }, []);

  return (
    <section className="category-section-container">
      <div className="category-section-header">
        <h2 className="category-section-title">
          SHOP BY CATEGORY
        </h2>
        <div className="category-section-divider"></div>
      </div>

      <div className="category-circle-grid">
        {(categories || []).map((cat) => {
          const targetUrl = `/products?category=${cat.slug}`;
          return (
            <Link key={cat.id || cat.slug} to={targetUrl} className="category-circle-card">
              <div className="category-circle-img-wrap">
                <img
                  src={formatImageUrl(cat.image_url || cat.img)}
                  alt={cat.name}
                  className="category-circle-img"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
                  }}
                />
              </div>
              <span className="category-circle-name">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategorySection;
