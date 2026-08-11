import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGender } from '../context/GenderContext';
import { ArrowRight } from 'lucide-react';

const CategorySection = () => {
  const { gender } = useGender();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/categories?gender=${gender}`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch Categories Error:', err);
        setLoading(false);
      });
  }, [gender]);

  return (
    <section className="section-space container">
      <div className="section-header">
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', color: '#666', textTransform: 'uppercase' }}>
            {gender.toUpperCase()} CATEGORIES
          </span>
          <h2 className="section-title">EXPLORE BY CATEGORY</h2>
        </div>

        <Link to={`/${gender}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
          VIEW ALL {gender.toUpperCase()} CATEGORIES <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#888' }}>Loading categories...</div>
      ) : (
        <div className="category-grid">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/${gender}?category=${cat.slug}`} className="category-card">
              <img src={cat.image_url} alt={cat.name} className="category-card-img" />
              <div className="category-card-content">
                <h3 className="category-card-title">{cat.name}</h3>
                <span style={{ fontSize: '0.75rem', color: '#e0e0e0', fontWeight: 700 }}>
                  {cat.product_count || 0} Items
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default CategorySection;
