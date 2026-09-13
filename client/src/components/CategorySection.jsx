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

const defaultWomenCategories = [
  {
    id: 'women-t-shirts',
    name: "T-Shirts",
    slug: 'women-t-shirts',
    gender: 'women',
    image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'women-shirts',
    name: "Shirts",
    slug: 'women-shirts',
    gender: 'women',
    image_url: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'women-jeans',
    name: "Jeans",
    slug: 'women-jeans',
    gender: 'women',
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'women-pants',
    name: "Pants",
    slug: 'women-pants',
    gender: 'women',
    image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'women-joggers',
    name: "Joggers",
    slug: 'women-joggers',
    gender: 'women',
    image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'women-tops',
    name: "Tops",
    slug: 'women-tops',
    gender: 'women',
    image_url: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'women-shorts',
    name: "Shorts",
    slug: 'women-shorts',
    gender: 'women',
    image_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 'women-denims',
    name: "Denims",
    slug: 'women-denims',
    gender: 'women',
    image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80'
  }
];

const CategorySection = ({ gender: propGender }) => {
  const { gender: contextGender } = useGender();
  const activeGender = propGender || contextGender || 'men';
  const defaults = activeGender === 'women' ? defaultWomenCategories : defaultMenCategories;
  const [categories, setCategories] = useState(defaults);

  useEffect(() => {
    fetch(getApiUrl(`/api/categories?gender=${activeGender}`))
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
  }, [activeGender]);

  return (
    <section className="category-section-container">
      <div className="category-section-header">
        <h2 className="category-section-title">
          SHOP BY CATEGORY ({activeGender.toUpperCase()})
        </h2>
        <div className="category-section-divider"></div>
      </div>

      <div className="category-circle-grid">
        {(categories || []).map((cat) => {
          const catGender = cat.gender || activeGender;
          const targetUrl = `/products?gender=${catGender}&category=${cat.slug}`;
          return (
            <Link key={cat.id || cat.slug} to={targetUrl} className="category-circle-card">
              <div className="category-circle-img-wrap">
                <img
                  src={formatImageUrl(cat.image_url || cat.img)}
                  alt={cat.name}
                  className="category-circle-img"
                  onError={(e) => {
                    e.target.src = activeGender === 'women'
                      ? 'https://images.unsplash.com/photo-1534126511673-b6899657816a?w=800'
                      : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800';
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
