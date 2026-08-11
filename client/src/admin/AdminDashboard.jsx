import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, FolderTree, Image, PackageCheck,
  AlertTriangle, Users, Ticket, Move, Plus, Edit, Trash2, Check, X, Shield, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Editing state
  const [editingProduct, setEditingProduct] = useState(null);

  // New Product Form State
  const [productForm, setProductForm] = useState({
    name: '', description: '', gender: 'men', category_id: '', price: '', sale_price: '', sku: '',
    is_new: false, is_trending: false, is_featured: false, is_active: true,
    variants: [
      { size: 'S', color: 'Black', stock: 15 },
      { size: 'M', color: 'Black', stock: 20 },
      { size: 'L', color: 'Black', stock: 15 }
    ],
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
  });

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({ name: '', gender: 'men', image_url: '' });

  // Banner Form State
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', button_text: 'SHOP NOW', button_link: '/men', image_url: '' });

  // Coupon Form State
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: 15, min_order_amount: 50 });

  useEffect(() => {
    if (!token || !isAdmin) {
      navigate('/admin/login');
      return;
    }

    fetchAdminData();
  }, [token, isAdmin]);

  const fetchAdminData = () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/admin/stats', { headers }).then(r => r.json()),
      fetch('/api/admin/products', { headers }).then(r => r.json()),
      fetch('/api/admin/categories', { headers }).then(r => r.json()),
      fetch('/api/admin/banners', { headers }).then(r => r.json()),
      fetch('/api/admin/orders', { headers }).then(r => r.json()),
      fetch('/api/admin/inventory', { headers }).then(r => r.json()),
      fetch('/api/admin/customers', { headers }).then(r => r.json()),
      fetch('/api/admin/coupons', { headers }).then(r => r.json())
    ])
      .then(([st, prd, cat, bnr, ord, inv, cst, cpn]) => {
        setStats(st);
        setProducts(prd);
        setCategories(cat);
        setBanners(bnr);
        setOrders(ord);
        setInventory(inv);
        setCustomers(cst);
        setCoupons(cpn);
        if (cat.length && !productForm.category_id) {
          setProductForm(prev => ({ ...prev, category_id: cat[0].id }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch Admin Data Error:', err);
        setLoading(false);
      });
  };

  // Product CRUD
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';

    const payload = {
      ...productForm,
      images: [productForm.image_url]
    };

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowProductModal(false);
        setEditingProduct(null);
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save product');
      }
    } catch (err) {
      alert('Error saving product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchAdminData();
  };

  // Category CRUD
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify(categoryForm)
      });
      if (res.ok) {
        setShowCategoryModal(false);
        setCategoryForm({ name: '', gender: 'men', image_url: '' });
        fetchAdminData();
      }
    } catch (err) {
      alert('Error adding category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category?')) return;
    await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchAdminData();
  };

  // Banner CRUD
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers,
        body: JSON.stringify(bannerForm)
      });
      if (res.ok) {
        setShowBannerModal(false);
        setBannerForm({ title: '', subtitle: '', button_text: 'SHOP NOW', button_link: '/men', image_url: '' });
        fetchAdminData();
      }
    } catch (err) {
      alert('Error adding banner');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Delete banner?')) return;
    await fetch(`/api/admin/banners/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchAdminData();
  };

  // Order Status Update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ order_status: newStatus })
    });
    fetchAdminData();
  };

  // Inline Stock Update
  const handleUpdateStock = async (variantId, newStock) => {
    await fetch(`/api/admin/inventory/${variantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stock: newStock })
    });
    fetchAdminData();
  };

  // Save Coupon
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(couponForm)
    });
    setShowCouponModal(false);
    fetchAdminData();
  };

  const handleDeleteCoupon = async (id) => {
    await fetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchAdminData();
  };

  if (loading) {
    return <div className="container section-space" style={{ textAlign: 'center' }}>Loading Admin Panel...</div>;
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Top Admin Header */}
      <div style={{ backgroundColor: '#111111', color: '#ffffff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={24} color="#f5a623" />
          <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '1px' }}>GRABB-IT ADMIN DASHBOARD</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>Logged in as: <strong>{user?.name}</strong></span>
          <button className="btn-secondary" onClick={() => navigate('/')} style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', backgroundColor: '#fff', color: '#111' }}>
            VIEW CUSTOMER STORE
          </button>
          <button onClick={logout} style={{ color: '#ff6b6b', fontSize: '0.85rem', fontWeight: 700 }}>
            LOGOUT
          </button>
        </div>
      </div>

      <div className="container" style={{ marginTop: '2rem' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #111', paddingBottom: '0.75rem' }}>
          <button
            className={`btn-secondary ${activeTab === 'overview' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{ fontSize: '0.8rem', padding: '0.6rem 1rem' }}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          <button
            className={`btn-secondary ${activeTab === 'products' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('products')}
            style={{ fontSize: '0.8rem', padding: '0.6rem 1rem' }}
          >
            <ShoppingBag size={16} /> Products ({products.length})
          </button>
          <button
            className={`btn-secondary ${activeTab === 'categories' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('categories')}
            style={{ fontSize: '0.8rem', padding: '0.6rem 1rem' }}
          >
            <FolderTree size={16} /> Categories ({categories.length})
          </button>
          <button
            className={`btn-secondary ${activeTab === 'banners' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('banners')}
            style={{ fontSize: '0.8rem', padding: '0.6rem 1rem' }}
          >
            <Image size={16} /> Banners ({banners.length})
          </button>
          <button
            className={`btn-secondary ${activeTab === 'orders' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('orders')}
            style={{ fontSize: '0.8rem', padding: '0.6rem 1rem' }}
          >
            <PackageCheck size={16} /> Orders ({orders.length})
          </button>
          <button
            className={`btn-secondary ${activeTab === 'inventory' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('inventory')}
            style={{ fontSize: '0.8rem', padding: '0.6rem 1rem' }}
          >
            <AlertTriangle size={16} /> Inventory ({inventory.length})
          </button>
          <button
            className={`btn-secondary ${activeTab === 'customers' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('customers')}
            style={{ fontSize: '0.8rem', padding: '0.6rem 1rem' }}
          >
            <Users size={16} /> Customers ({customers.length})
          </button>
          <button
            className={`btn-secondary ${activeTab === 'coupons' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('coupons')}
            style={{ fontSize: '0.8rem', padding: '0.6rem 1rem' }}
          >
            <Ticket size={16} /> Coupons ({coupons.length})
          </button>
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #ddd' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>TOTAL SALES</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.2rem' }}>${stats.totalSales.toFixed(2)}</div>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #ddd' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>TOTAL ORDERS</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.2rem' }}>{stats.totalOrders}</div>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #ddd' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666', textTransform: 'uppercase' }}>TOTAL PRODUCTS</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.2rem' }}>{stats.totalProducts}</div>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid #ddd' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e53935', textTransform: 'uppercase' }}>LOW STOCK ALERTS</span>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#e53935', marginTop: '0.2rem' }}>{stats.lowStockCount}</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>RECENT ORDERS</h3>
            <div className="table-responsive" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(ord => (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 800 }}>{ord.order_number}</td>
                      <td>{ord.customer_name}</td>
                      <td style={{ fontWeight: 800 }}>${ord.total_amount.toFixed(2)}</td>
                      <td>
                        <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                          {ord.order_status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(ord.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>PRODUCT MANAGEMENT</h2>
              <button className="btn-primary" onClick={() => { setEditingProduct(null); setShowProductModal(true); }}>
                <Plus size={16} /> ADD NEW PRODUCT
              </button>
            </div>

            <div className="table-responsive" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>SKU</th>
                    <th>Total Stock</th>
                    <th>Flags</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <img src={p.primary_image} alt="" style={{ width: '45px', height: '55px', objectFit: 'cover' }} />
                      </td>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700 }}>{p.gender}</td>
                      <td>{p.category_name}</td>
                      <td style={{ fontWeight: 800 }}>${(p.sale_price !== null ? p.sale_price : p.price).toFixed(2)}</td>
                      <td style={{ fontSize: '0.8rem', color: '#666' }}>{p.sku}</td>
                      <td style={{ fontWeight: 800, color: (p.total_stock || 0) <= 5 ? '#e53935' : '#111' }}>{p.total_stock || 0}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          {p.is_trending === 1 && <span className="badge-trending">TRENDING</span>}
                          {p.is_new === 1 && <span className="badge-new">NEW</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProductForm({
                                name: p.name,
                                description: p.description,
                                gender: p.gender,
                                category_id: p.category_id,
                                price: p.price,
                                sale_price: p.sale_price || '',
                                sku: p.sku,
                                is_new: p.is_new === 1,
                                is_trending: p.is_trending === 1,
                                is_featured: p.is_featured === 1,
                                is_active: p.is_active === 1,
                                image_url: p.primary_image
                              });
                              setShowProductModal(true);
                            }}
                            title="Edit"
                          >
                            <Edit size={16} color="#111" />
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} title="Delete">
                            <Trash2 size={16} color="#e53935" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>CATEGORY MANAGEMENT</h2>
              <button className="btn-primary" onClick={() => setShowCategoryModal(true)}>
                <Plus size={16} /> ADD CATEGORY
              </button>
            </div>

            <div className="table-responsive" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Category Name</th>
                    <th>Gender Target</th>
                    <th>Slug</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id}>
                      <td><img src={c.image_url} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover' }} /></td>
                      <td style={{ fontWeight: 800 }}>{c.name}</td>
                      <td>
                        <span style={{ backgroundColor: c.gender === 'men' ? '#e3f2fd' : '#fce4ec', color: c.gender === 'men' ? '#1565c0' : '#c2185b', padding: '0.2rem 0.5rem', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          {c.gender}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#666' }}>{c.slug}</td>
                      <td>
                        <button onClick={() => handleDeleteCategory(c.id)}>
                          <Trash2 size={16} color="#e53935" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. BANNERS TAB */}
        {activeTab === 'banners' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>HOMEPAGE BANNER MANAGEMENT</h2>
              <button className="btn-primary" onClick={() => setShowBannerModal(true)}>
                <Plus size={16} /> ADD NEW BANNER
              </button>
            </div>

            <div className="table-responsive" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Subtitle</th>
                    <th>Button Label</th>
                    <th>Link Target</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map(b => (
                    <tr key={b.id}>
                      <td><img src={b.image_url} alt="" style={{ width: '80px', height: '45px', objectFit: 'cover' }} /></td>
                      <td style={{ fontWeight: 800 }}>{b.title}</td>
                      <td style={{ fontSize: '0.8rem', color: '#666' }}>{b.subtitle}</td>
                      <td><span className="btn-outline-gray" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}>{b.button_text}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{b.button_link}</td>
                      <td>
                        <span style={{ color: b.is_active === 1 ? '#2e7d32' : '#999', fontWeight: 800, fontSize: '0.75rem' }}>
                          {b.is_active === 1 ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleDeleteBanner(b.id)}><Trash2 size={16} color="#e53935" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' }}>CUSTOMER ORDERS MANAGEMENT</h2>
            <div className="table-responsive" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer Name</th>
                    <th>Shipping Address</th>
                    <th>Total Amount</th>
                    <th>Order Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(ord => (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 800 }}>{ord.order_number}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{ord.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{ord.email} • {ord.phone}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#555', maxWidth: '200px' }}>{ord.shipping_address}</td>
                      <td style={{ fontWeight: 900 }}>${ord.total_amount.toFixed(2)}</td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: '0.3rem', fontSize: '0.8rem', fontWeight: 700 }}
                          value={ord.order_status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Returned">Returned</option>
                        </select>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#888' }}>
                        Tracking: {ord.tracking_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' }}>PRODUCT INVENTORY CONTROL</h2>
            <div className="table-responsive" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Gender</th>
                    <th>SKU</th>
                    <th>Variant Size</th>
                    <th>Color</th>
                    <th>Stock Qty</th>
                    <th>Update Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.variant_id}>
                      <td style={{ fontWeight: 700 }}>{item.product_name}</td>
                      <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{item.gender}</td>
                      <td style={{ fontSize: '0.8rem', color: '#666' }}>{item.sku}</td>
                      <td style={{ fontWeight: 800 }}>{item.size}</td>
                      <td>{item.color}</td>
                      <td style={{ fontWeight: 900, color: item.stock <= 5 ? '#e53935' : '#111' }}>
                        {item.stock} {item.stock <= 5 && '(LOW)'}
                      </td>
                      <td>
                        <input
                          type="number"
                          defaultValue={item.stock}
                          style={{ width: '70px', padding: '0.3rem' }}
                          onBlur={(e) => handleUpdateStock(item.variant_id, parseInt(e.target.value))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem' }}>REGISTERED CUSTOMERS</h2>
            <div className="table-responsive" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Total Orders</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 800 }}>{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.phone || 'N/A'}</td>
                      <td style={{ fontWeight: 700 }}>{c.order_count}</td>
                      <td style={{ fontWeight: 900 }}>${c.total_spent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. COUPONS TAB */}
        {activeTab === 'coupons' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase' }}>PROMO COUPONS</h2>
              <button className="btn-primary" onClick={() => setShowCouponModal(true)}>
                <Plus size={16} /> ADD COUPON CODE
              </button>
            </div>

            <div className="table-responsive" style={{ backgroundColor: '#fff', border: '1px solid #ddd' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min Order</th>
                    <th>Times Used</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(cp => (
                    <tr key={cp.id}>
                      <td style={{ fontWeight: 900 }}>{cp.code}</td>
                      <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{cp.discount_type}</td>
                      <td style={{ fontWeight: 800 }}>{cp.discount_type === 'percentage' ? `${cp.discount_value}%` : `$${cp.discount_value}`}</td>
                      <td>${cp.min_order_amount}</td>
                      <td>{cp.times_used} / {cp.usage_limit}</td>
                      <td>
                        <button onClick={() => handleDeleteCoupon(cp.id)}><Trash2 size={16} color="#e53935" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <button className="modal-close-btn" onClick={() => setShowProductModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              {editingProduct ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
            </h3>

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input type="text" className="form-input" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Gender</label>
                  <select className="form-select" value={productForm.gender} onChange={e => setProductForm({ ...productForm, gender: e.target.value })}>
                    <option value="men">MEN</option>
                    <option value="women">WOMEN</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={productForm.category_id} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })} required>
                    {categories.filter(c => c.gender === productForm.gender).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input type="number" step="0.01" className="form-input" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Sale Price ($)</label>
                  <input type="number" step="0.01" className="form-input" value={productForm.sale_price} onChange={e => setProductForm({ ...productForm, sale_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input type="text" className="form-input" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Image URL</label>
                <input type="url" className="form-input" value={productForm.image_url} onChange={e => setProductForm({ ...productForm, image_url: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows="3" className="form-textarea" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={productForm.is_new} onChange={e => setProductForm({ ...productForm, is_new: e.target.checked })} /> Mark New Arrival
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={productForm.is_trending} onChange={e => setProductForm({ ...productForm, is_trending: e.target.checked })} /> Mark Trending
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={productForm.is_featured} onChange={e => setProductForm({ ...productForm, is_featured: e.target.checked })} /> Mark Featured
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>SAVE PRODUCT</button>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button className="modal-close-btn" onClick={() => setShowCategoryModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>ADD CATEGORY</h3>
            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input type="text" className="form-input" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Target Gender</label>
                <select className="form-select" value={categoryForm.gender} onChange={e => setCategoryForm({ ...categoryForm, gender: e.target.value })}>
                  <option value="men">MEN</option>
                  <option value="women">WOMEN</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input type="url" className="form-input" value={categoryForm.image_url} onChange={e => setCategoryForm({ ...categoryForm, image_url: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>SAVE CATEGORY</button>
            </form>
          </div>
        </div>
      )}

      {/* ADD BANNER MODAL */}
      {showBannerModal && (
        <div className="modal-overlay" onClick={() => setShowBannerModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close-btn" onClick={() => setShowBannerModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>ADD BANNER</h3>
            <form onSubmit={handleSaveBanner}>
              <div className="form-group">
                <label className="form-label">Banner Title</label>
                <input type="text" className="form-input" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle</label>
                <input type="text" className="form-input" value={bannerForm.subtitle} onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input type="url" className="form-input" value={bannerForm.image_url} onChange={e => setBannerForm({ ...bannerForm, image_url: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>SAVE BANNER</button>
            </form>
          </div>
        </div>
      )}

      {/* ADD COUPON MODAL */}
      {showCouponModal && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button className="modal-close-btn" onClick={() => setShowCouponModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem' }}>CREATE COUPON</h3>
            <form onSubmit={handleSaveCoupon}>
              <div className="form-group">
                <label className="form-label">Coupon Code</label>
                <input type="text" className="form-input" style={{ textTransform: 'uppercase' }} value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Type</label>
                <select className="form-select" value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Discount Value</label>
                <input type="number" className="form-input" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>CREATE COUPON</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
