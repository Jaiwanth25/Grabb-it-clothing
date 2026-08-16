import React from 'react';
import { Link } from 'react-router-dom';

const SpecialOffersSection = () => {
  return (
    <section className="section-space container">
      <div className="special-offers-grid">
        {/* Deal 1 */}
        <div className="special-offer-card light">
          <span className="special-offer-badge red">
            LIMITED TIME OFFER
          </span>
          <h3 className="special-offer-title">
            FLAT 20% OFF ON ORDERS OVER ₹2,999
          </h3>
          <p className="special-offer-desc">
            Use promo code <strong>WELCOME20</strong> at checkout to unlock instant discounts across all jackets, denims, and knitwear.
          </p>
          <div>
            <Link to="/offers" className="btn-primary">
              SHOP SPECIAL OFFERS
            </Link>
          </div>
        </div>

        {/* Deal 2 */}
        <div className="special-offer-card dark">
          <span className="special-offer-badge saffron">
            FREE SHIPPING WORLDWIDE
          </span>
          <h3 className="special-offer-title">
            EXPRESS 2-DAY DELIVERY
          </h3>
          <p className="special-offer-desc">
            Order today and receive priority doorstep delivery with hassle-free 30-day money-back returns.
          </p>
          <div>
            <Link to="/men" className="btn-secondary" style={{ backgroundColor: '#ffffff', color: '#111111' }}>
              EXPLORE CATALOG
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialOffersSection;
