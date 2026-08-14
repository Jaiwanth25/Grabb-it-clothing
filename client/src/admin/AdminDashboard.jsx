import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, FolderTree, Image, PackageCheck,
  Users, Ticket, Plus, Edit, Trash2, X, Shield, RefreshCw,
  Settings, Layers, MessageSquare, CreditCard, Menu, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

const AdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Real Database States
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [collections, setCollections] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  // Direct File Image Upload States
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState({
    id: null, name: '', description: '', gender: 'men', category_id: '',
    price: '', sale_price: '', sku: '',
    is_new: false, is_trending: false, is_featured: false, is_active: true,
    existingImages: [],
    variants: [
      { size: 'S', color: 'Black', stock: 10 },
      { size: 'M', color: 'Black', stock: 15 },
      { size: 'L', color: 'Black', stock: 15 },
      { size: 'XL', color: 'Black', stock: 10 }
    ]
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', gender: 'men', image_url: '' });

  const [bannerForm, setBannerForm] = useState({
    title: '', subtitle: '', button_text: 'SHOP NOW', button_link: '/men',
    image_url: '', mobile_image_url: '', gender: '', display_order: 0, is_active: true
  });

  const [couponForm, setCouponForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '',
    min_order_amount: 0, usage_limit: 100
  });

  const [collectionForm, setCollectionForm] = useState({
    id: null, name: '', description: '', cover_image: '', banner_image: '',
    gender: 'men', is_active: true, selectedProducts: []
  });

  const [settings, setSettings] = useState({
    whatsappNumber: '+91 99999 88888',
    freeShippingThreshold: 999,
    codEnabled: true,
    returnPolicyDays: 7
  });

  // Verify Admin Access
  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
    }
  }, [token, navigate]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, prodRes, catRes, banRes, ordRes, invRes, custRes, coupRes, colRes, revRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/products', { headers }),
        fetch('/api/admin/categories', { headers }),
        fetch('/api/admin/banners', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/inventory', { headers }),
        fetch('/api/admin/customers', { headers }),
        fetch('/api/admin/coupons', { headers }),
        fetch('/api/admin/collections', { headers }),
        fetch('/api/admin/reviews', { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
        if (catData.length && !productForm.category_id) {
          setProductForm(prev => ({ ...prev, category_id: catData[0].id }));
        }
      }
      if (banRes.ok) setBanners(await banRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      if (invRes.ok) setInventory(await invRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (coupRes.ok) setCoupons(await coupRes.json());
      if (colRes.ok) setCollections(await colRes.json());
      if (revRes.ok) setReviews(await revRes.json());
    } catch (err) {
      console.error('Fetch Admin Data Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Image Upload File Handler
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSelectedFiles(prev => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload Selected Files to Backend Direct Upload Endpoint
  const uploadSelectedFiles = async () => {
    if (!selectedFiles.length) return [];
    setUploadingImages(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload images');
      return data.urls || [];
    } catch (err) {
      alert(`Image Upload Failed: ${err.message}`);
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  // Product Actions
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      let uploadedUrls = [];
      if (selectedFiles.length > 0) {
        uploadedUrls = await uploadSelectedFiles();
        if (!uploadedUrls.length && selectedFiles.length > 0) return;
      }

      const allImageUrls = [...productForm.existingImages, ...uploadedUrls];
      if (!allImageUrls.length) {
        allImageUrls.push('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80');
      }

      const payload = {
        name: productForm.name,
        description: productForm.description,
        gender: productForm.gender,
        category_id: productForm.category_id || (categories[0]?.id || 1),
        price: parseFloat(productForm.price),
        sale_price: productForm.sale_price ? parseFloat(productForm.sale_price) : null,
        sku: productForm.sku,
        is_new: productForm.is_new ? 1 : 0,
        is_trending: productForm.is_trending ? 1 : 0,
        is_featured: productForm.is_featured ? 1 : 0,
        is_active: productForm.is_active ? 1 : 0,
        variants: productForm.variants,
        images: allImageUrls
      };

      const url = productForm.id ? `/api/admin/products/${productForm.id}` : '/api/admin/products';
      const method = productForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save product');
      }

      setShowProductModal(false);
      setSelectedFiles([]);
      setImagePreviews([]);
      fetchData();
      alert(productForm.id ? 'Product updated successfully!' : 'Product created successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete/archive this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message || 'Product deleted.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Order Status Updates
  const handleUpdateOrderStatus = async (orderId, updateFields) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updateFields)
      });
      if (!res.ok) throw new Error('Failed to update order status');

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, ...updateFields }));
      }

      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Inventory Stock Update
  const handleUpdateStock = async (variantId, newStock) => {
    try {
      const res = await fetch(`/api/admin/inventory/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stock: newStock })
      });
      if (!res.ok) throw new Error('Failed to update stock');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Category Save
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(categoryForm)
      });
      if (!res.ok) throw new Error('Failed to save category');
      setShowCategoryModal(false);
      setCategoryForm({ name: '', gender: 'men', image_url: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Banner Save
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bannerForm)
      });
      if (!res.ok) throw new Error('Failed to save banner');
      setShowBannerModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Coupon Save
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(couponForm)
      });
      if (!res.ok) throw new Error('Failed to save coupon');
      setShowCouponModal(false);
      setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: 0, usage_limit: 100 });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Collection Save
  const handleSaveCollection = async (e) => {
    e.preventDefault();
    try {
      const url = collectionForm.id ? `/api/admin/collections/${collectionForm.id}` : '/api/admin/collections';
      const method = collectionForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(collectionForm)
      });
      if (!res.ok) throw new Error('Failed to save collection');
      setShowCollectionModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: orders.filter(o => o.order_status === 'Pending').length },
    { id: 'products', label: 'Products', icon: PackageCheck },
    { id: 'inventory', label: 'Inventory Stock', icon: Layers },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'collections', label: 'Collections', icon: Image },
    { id: 'coupons', label: 'Offers & Coupons', icon: Ticket },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reviews', label: 'Reviews Moderation', icon: MessageSquare },
    { id: 'banners', label: 'Hero Banners', icon: Image },
    { id: 'payments', label: 'Payments & Refunds', icon: CreditCard },
    { id: 'settings', label: 'Global Settings', icon: Settings }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-dark)' }}>
      {/* 1. PERMANENT DESKTOP SIDEBAR / MOBILE DRAWER */}
      <aside 
        className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          backgroundColor: '#ffffff',
          borderRight: '2px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 1100,
          boxShadow: 'var(--shadow-subtle)',
          transition: 'transform 0.3s ease'
        }}
      >
        <div style={{ padding: '1.5rem', borderBottom: '2px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={24} color="var(--text-dark)" />
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-dark)', letterSpacing: '0.5px' }}>
              GRABB-IT ADMIN
            </span>
          </div>
          <button 
            className="mobile-only"
            onClick={() => setMobileSidebarOpen(false)}
            style={{ color: 'var(--text-dark)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map(item => {
            const IconComp = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  color: 'var(--text-dark)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.88rem',
                  textAlign: 'left',
                  transition: 'all 200ms ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <IconComp size={18} color="var(--text-dark)" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--text-dark)', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '1rem', borderTop: '2px solid var(--border-light)' }}>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="btn-secondary"
            style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem' }}
          >
            LOGOUT ADMIN
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar Drawer */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(43, 43, 43, 0.4)', zIndex: 1099 }}
        />
      )}

      {/* 2. MAIN ADMIN CONTENT CONTAINER */}
      <div style={{ flex: 1, marginLeft: '260px', minWidth: 0 }} className="admin-main-wrapper">
        {/* TOP BAR */}
        <header style={{ height: '70px', borderBottom: '2px solid var(--border-light)', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', position: 'sticky', top: 0, zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="mobile-only icon-btn"
              style={{ display: 'none' }}
            >
              <Menu size={22} color="var(--text-dark)" />
            </button>
            <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {navItems.find(i => i.id === activeTab)?.label || 'Admin Control'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={fetchData} className="btn-outline-gray" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={14} /> Refresh Data
            </button>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              Admin: <span style={{ color: 'var(--text-dark)' }}>{user?.email || 'admin@grabb-it.com'}</span>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main style={{ padding: '2rem' }}>
          {loading && !stats ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', fontWeight: 700, color: 'var(--text-muted)' }}>
              Loading Store Data...
            </div>
          ) : (
            <div>
              {/* TAB 1: OVERVIEW DASHBOARD */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* REAL METRICS GRID */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                    <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.35rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Revenue</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.3rem', fontFamily: 'var(--font-title)' }}>
                        {formatINR(stats?.totalSales || 0)}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.35rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Orders</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.3rem', fontFamily: 'var(--font-title)' }}>
                        {stats?.totalOrders || 0}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.35rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Orders</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.3rem', fontFamily: 'var(--font-title)' }}>
                        {stats?.pendingOrders || 0}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.35rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Customers</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.3rem', fontFamily: 'var(--font-title)' }}>
                        {stats?.totalCustomers || 0}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.35rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Products</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.3rem', fontFamily: 'var(--font-title)' }}>
                        {stats?.totalProducts || 0}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.35rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Low Stock Items</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.3rem', fontFamily: 'var(--font-title)' }}>
                        {stats?.lowStockCount || 0}
                      </div>
                    </div>
                  </div>

                  {/* RECENT ORDERS SUMMARY */}
                  <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>Recent Customer Orders</h2>
                      <button className="btn-secondary" onClick={() => setActiveTab('orders')} style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}>
                        View All Orders
                      </button>
                    </div>

                    {!stats?.recentOrders || stats.recentOrders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        No orders recorded in database yet.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Order #</th>
                              <th>Customer</th>
                              <th>Amount</th>
                              <th>Status</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recentOrders.map(o => (
                              <tr key={o.id}>
                                <td><strong>#{o.order_number}</strong></td>
                                <td>{o.customer_name}</td>
                                <td><strong>{formatINR(o.total_amount)}</strong></td>
                                <td><span className="badge-new">{o.order_status}</span></td>
                                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: ORDERS MANAGEMENT & REAL CUSTOMER DETAILS */}
              {activeTab === 'orders' && (
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
                    Customer Orders Registry
                  </h2>

                  {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No customer orders recorded yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Order #</th>
                            <th>Customer Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Date</th>
                            <th>Total Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(order => (
                            <tr key={order.id}>
                              <td><strong>#{order.order_number}</strong></td>
                              <td>{order.customer_name}</td>
                              <td>{order.email}</td>
                              <td>{order.phone || '-'}</td>
                              <td>{new Date(order.created_at).toLocaleDateString()}</td>
                              <td><strong>{formatINR(order.total_amount)}</strong></td>
                              <td><span className="badge-trending">{order.payment_method}</span></td>
                              <td>
                                <select
                                  className="form-select"
                                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', width: 'auto' }}
                                  value={order.order_status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, { order_status: e.target.value })}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Packed">Packed</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Out for Delivery">Out for Delivery</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                  <option value="Refunded">Refunded</option>
                                </select>
                              </td>
                              <td>
                                <button
                                  className="btn-primary"
                                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <Eye size={14} /> View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PRODUCTS MANAGEMENT & DIRECT FILE IMAGE UPLOAD */}
              {activeTab === 'products' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                      Products Directory ({products.length})
                    </h2>
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        setProductForm({
                          id: null, name: '', description: '', gender: 'men', category_id: categories[0]?.id || '',
                          price: '', sale_price: '', sku: '', is_new: true, is_trending: false, is_featured: false, is_active: true,
                          existingImages: [],
                          variants: [
                            { size: 'S', color: 'Black', stock: 10 },
                            { size: 'M', color: 'Black', stock: 15 },
                            { size: 'L', color: 'Black', stock: 15 },
                            { size: 'XL', color: 'Black', stock: 10 }
                          ]
                        });
                        setSelectedFiles([]);
                        setImagePreviews([]);
                        setShowProductModal(true);
                      }}
                    >
                      <Plus size={16} /> ADD NEW PRODUCT
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No products added yet. Click "Add New Product" to list your first apparel drop!
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Gender</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Sale Price</th>
                            <th>Total Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(p => (
                            <tr key={p.id}>
                              <td><img src={p.primary_image} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} /></td>
                              <td><code>{p.sku}</code></td>
                              <td><strong>{p.name}</strong></td>
                              <td style={{ textTransform: 'uppercase' }}>{p.gender}</td>
                              <td>{p.category_name || '-'}</td>
                              <td><strong>{formatINR(p.price)}</strong></td>
                              <td>{p.sale_price ? formatINR(p.sale_price) : '-'}</td>
                              <td><strong>{p.total_stock || 0}</strong></td>
                              <td><span className="badge-new">{p.is_active === 1 ? 'Active' : 'Inactive'}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => {
                                      setProductForm({
                                        id: p.id,
                                        name: p.name,
                                        description: p.description || '',
                                        gender: p.gender,
                                        category_id: p.category_id,
                                        price: p.price,
                                        sale_price: p.sale_price || '',
                                        sku: p.sku,
                                        is_new: p.is_new === 1,
                                        is_trending: p.is_trending === 1,
                                        is_featured: p.is_featured === 1,
                                        is_active: p.is_active === 1,
                                        existingImages: p.images?.map(i => i.image_url) || [p.primary_image],
                                        variants: p.variants || []
                                      });
                                      setSelectedFiles([]);
                                      setImagePreviews([]);
                                      setShowProductModal(true);
                                    }}
                                    className="btn-outline-gray"
                                    style={{ padding: '0.35rem 0.6rem' }}
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="btn-outline-gray"
                                    style={{ padding: '0.35rem 0.6rem', color: '#c62828', borderColor: '#c62828' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: INVENTORY MANAGEMENT */}
              {activeTab === 'inventory' && (
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
                    SKU Variant Inventory Stock Matrix
                  </h2>

                  {inventory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No inventory records found.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Color</th>
                            <th>Size</th>
                            <th>Stock Qty</th>
                            <th>Stock Status</th>
                            <th>Quick Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.map((inv, idx) => {
                            const isLowStock = inv.stock <= 5;
                            const isOutOfStock = inv.stock === 0;
                            return (
                              <tr key={idx}>
                                <td><code>{inv.sku}</code></td>
                                <td><strong>{inv.product_name}</strong></td>
                                <td>{inv.category_name}</td>
                                <td>{inv.color}</td>
                                <td><strong>{inv.size}</strong></td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '75px', padding: '0.35rem', textAlign: 'center', fontWeight: 800 }}
                                    value={inv.stock}
                                    onChange={(e) => handleUpdateStock(inv.variant_id, parseInt(e.target.value) || 0)}
                                  />
                                </td>
                                <td>
                                  {isOutOfStock ? (
                                    <span className="badge-discount">OUT</span>
                                  ) : isLowStock ? (
                                    <span className="badge-trending">LOW</span>
                                  ) : (
                                    <span className="badge-new">HEALTHY</span>
                                  )}
                                </td>
                                <td>
                                  <button
                                    className="btn-secondary"
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                    onClick={() => handleUpdateStock(inv.variant_id, inv.stock + 10)}
                                  >
                                    Restock +10
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CATEGORIES */}
              {activeTab === 'categories' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                      Apparel Categories
                    </h2>
                    <button className="btn-primary" onClick={() => setShowCategoryModal(true)}>
                      <Plus size={16} /> ADD CATEGORY
                    </button>
                  </div>

                  {categories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No categories created yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Slug</th>
                            <th>Gender Target</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map(c => (
                            <tr key={c.id}>
                              <td><img src={c.image_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /></td>
                              <td><code>CAT-{c.id}</code></td>
                              <td><strong>{c.name}</strong></td>
                              <td>{c.slug}</td>
                              <td style={{ textTransform: 'uppercase' }}>{c.gender}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: COLLECTIONS */}
              {activeTab === 'collections' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                      Curated Campaigns / Drop Collections
                    </h2>
                    <button className="btn-primary" onClick={() => setShowCollectionModal(true)}>
                      <Plus size={16} /> CREATE COLLECTION
                    </button>
                  </div>

                  {collections.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No collections listed yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Cover</th>
                            <th>Title</th>
                            <th>Slug</th>
                            <th>Gender Target</th>
                            <th>Associated Products</th>
                          </tr>
                        </thead>
                        <tbody>
                          {collections.map(col => (
                            <tr key={col.id}>
                              <td><img src={col.cover_image} alt="" style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '8px' }} /></td>
                              <td><strong>{col.name}</strong></td>
                              <td>{col.slug}</td>
                              <td style={{ textTransform: 'uppercase' }}>{col.gender}</td>
                              <td><strong>{col.products?.length || 0} Products</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: OFFERS & COUPONS */}
              {activeTab === 'coupons' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                      Offers &amp; Coupon Codes
                    </h2>
                    <button className="btn-primary" onClick={() => setShowCouponModal(true)}>
                      <Plus size={16} /> CREATE PROMO CODE
                    </button>
                  </div>

                  {coupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No active offers or promo codes.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Discount Type</th>
                            <th>Discount Value</th>
                            <th>Min Order Amount</th>
                            <th>Usage Count</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map(c => (
                            <tr key={c.id}>
                              <td><code>{c.code}</code></td>
                              <td style={{ textTransform: 'capitalize' }}>{c.discount_type}</td>
                              <td><strong>{c.discount_type === 'percentage' ? `${c.discount_value}%` : formatINR(c.discount_value)}</strong></td>
                              <td>{formatINR(c.min_order_amount || 0)}</td>
                              <td>{c.times_used || 0} times</td>
                              <td><span className="badge-new">{c.is_active === 1 ? 'Active' : 'Disabled'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: CUSTOMERS */}
              {activeTab === 'customers' && (
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
                    Registered Customers Base
                  </h2>

                  {customers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No customer accounts registered yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>User ID</th>
                            <th>Customer Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Total Orders</th>
                            <th>Total Spent</th>
                            <th>Registration Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customers.map(c => (
                            <tr key={c.id}>
                              <td><code>USR-{c.id}</code></td>
                              <td><strong>{c.name}</strong></td>
                              <td>{c.email}</td>
                              <td>{c.phone || '-'}</td>
                              <td><strong>{c.order_count || 0} Orders</strong></td>
                              <td><strong>{formatINR(c.total_spent || 0)}</strong></td>
                              <td>{new Date(c.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 9: REVIEWS MODERATION */}
              {activeTab === 'reviews' && (
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
                    Customer Reviews Moderation
                  </h2>

                  {reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No product reviews submitted yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Rating</th>
                            <th>Customer</th>
                            <th>Comment</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reviews.map(r => (
                            <tr key={r.id}>
                              <td><strong>{r.product_name}</strong></td>
                              <td><strong>{r.rating}★</strong></td>
                              <td>{r.user_name}</td>
                              <td>{r.comment}</td>
                              <td>{new Date(r.created_at).toLocaleDateString()}</td>
                              <td><span className="badge-new">{r.is_moderated === 1 ? 'Approved' : 'Pending'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 10: HERO BANNERS */}
              {activeTab === 'banners' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                      Hero Campaign Banners
                    </h2>
                    <button className="btn-primary" onClick={() => setShowBannerModal(true)}>
                      <Plus size={16} /> ADD BANNER
                    </button>
                  </div>

                  {banners.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No active hero banners.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Preview</th>
                            <th>Title</th>
                            <th>Subtitle</th>
                            <th>Destination</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {banners.map(b => (
                            <tr key={b.id}>
                              <td><img src={b.image_url} alt="" style={{ width: '120px', height: '45px', objectFit: 'cover', borderRadius: '8px' }} /></td>
                              <td><strong>{b.title}</strong></td>
                              <td>{b.subtitle}</td>
                              <td><code>{b.button_link}</code></td>
                              <td><span className="badge-new">{b.is_active === 1 ? 'Active' : 'Disabled'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 11: PAYMENTS & REFUNDS */}
              {activeTab === 'payments' && (
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
                    Payments &amp; Refunds Log
                  </h2>

                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Order #</th>
                          <th>Customer</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Payment Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o.id}>
                            <td><strong>#{o.order_number}</strong></td>
                            <td>{o.customer_name}</td>
                            <td><strong>{formatINR(o.total_amount)}</strong></td>
                            <td><span className="badge-trending">{o.payment_method}</span></td>
                            <td><span className="badge-new">{o.payment_status || 'PAYMENT_VERIFIED'}</span></td>
                            <td>{new Date(o.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 12: SETTINGS */}
              {activeTab === 'settings' && (
                <div style={{ maxWidth: '600px', backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '16px', border: '2px solid var(--border-light)' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
                    GLOBAL STORE CONFIGURATION
                  </h2>
                  <form onSubmit={(e) => { e.preventDefault(); alert('Global settings updated!'); }}>
                    <div className="form-group">
                      <label className="form-label">Support WhatsApp Hotline</label>
                      <input type="text" className="form-input" value={settings.whatsappNumber} onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Free Express Shipping Threshold (INR)</label>
                      <input type="number" className="form-input" value={settings.freeShippingThreshold} onChange={e => setSettings({ ...settings, freeShippingThreshold: parseInt(e.target.value) || 0 })} />
                    </div>

                    <div style={{ margin: '1rem 0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>
                        <input type="checkbox" checked={settings.codEnabled} onChange={e => setSettings({ ...settings, codEnabled: e.target.checked })} />
                        Enable Cash on Delivery (COD) Globally
                      </label>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                      SAVE CONFIGURATION
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
              ORDER DETAILS #{selectedOrder.order_number}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Customer & Shipping Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer Contact</h4>
                  <p style={{ fontWeight: 700, marginTop: '0.25rem' }}>{selectedOrder.customer_name}</p>
                  <p style={{ fontSize: '0.85rem' }}>{selectedOrder.email}</p>
                  <p style={{ fontSize: '0.85rem' }}>{selectedOrder.phone || 'No phone provided'}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Shipping Destination</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{selectedOrder.shipping_address}</p>
                </div>
              </div>

              {/* Order Items List */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Order Line Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                      <div>
                        <strong>{item.product_name}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Size: {item.size} | Color: {item.color} | Qty: {item.quantity}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800 }}>
                        {formatINR((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Status & Tracking Update Form */}
              <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.25rem', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem' }}>Update Status &amp; Tracking Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Order Status</label>
                    <select
                      className="form-select"
                      value={selectedOrder.order_status}
                      onChange={(e) => handleUpdateOrderStatus(selectedOrder.id, { order_status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Courier Partner</label>
                    <input
                      type="text"
                      className="form-input"
                      defaultValue={selectedOrder.courier || ''}
                      placeholder="e.g. BlueDart / Delhivery"
                      onBlur={(e) => handleUpdateOrderStatus(selectedOrder.id, { courier: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Tracking Number</label>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue={selectedOrder.tracking_number || ''}
                    placeholder="e.g. AWB987654321"
                    onBlur={(e) => handleUpdateOrderStatus(selectedOrder.id, { tracking_number: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL WITH DIRECT FILE IMAGE UPLOAD */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <button className="modal-close-btn" onClick={() => setShowProductModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
              {productForm.id ? 'Edit Apparel Product' : 'Add New Apparel Product'}
            </h3>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input type="text" className="form-input" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Gender Target</label>
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
                  <label className="form-label">Price (INR ₹)</label>
                  <input type="number" className="form-input" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Sale Price (INR ₹)</label>
                  <input type="number" className="form-input" value={productForm.sale_price} onChange={e => setProductForm({ ...productForm, sale_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU Code</label>
                  <input type="text" className="form-input" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} required />
                </div>
              </div>

              {/* DIRECT MULTI-FILE IMAGE UPLOAD PICKER */}
              <div className="form-group">
                <label className="form-label">Upload Product Images (File Picker)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="form-input"
                  style={{ padding: '0.5rem' }}
                />

                {/* IMAGE PREVIEWS */}
                {imagePreviews.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    {imagePreviews.map((src, i) => (
                      <div key={i} style={{ position: 'relative', width: '70px', height: '85px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--color-primary)' }}>
                        <img src={src} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveSelectedFile(i)}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Product Description</label>
                <textarea rows="3" className="form-textarea" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', margin: '0.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={productForm.is_new} onChange={e => setProductForm({ ...productForm, is_new: e.target.checked })} /> New Drop
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={productForm.is_trending} onChange={e => setProductForm({ ...productForm, is_trending: e.target.checked })} /> Trending
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={productForm.is_featured} onChange={e => setProductForm({ ...productForm, is_featured: e.target.checked })} /> Featured
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={uploadingImages}>
                {uploadingImages ? 'UPLOADING IMAGES...' : 'SAVE PRODUCT IN STORE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button className="modal-close-btn" onClick={() => setShowCategoryModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>ADD CATEGORY</h3>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>SAVE CATEGORY</button>
            </form>
          </div>
        </div>
      )}

      {/* ADD BANNER MODAL */}
      {showBannerModal && (
        <div className="modal-overlay" onClick={() => setShowBannerModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close-btn" onClick={() => setShowBannerModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>ADD CAMPAIGN BANNER</h3>
            <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Banner Title</label>
                <input type="text" className="form-input" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle Info</label>
                <input type="text" className="form-input" value={bannerForm.subtitle} onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Banner Image URL</label>
                <input type="url" className="form-input" value={bannerForm.image_url} onChange={e => setBannerForm({ ...bannerForm, image_url: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>SAVE BANNER</button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showCouponModal && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button className="modal-close-btn" onClick={() => setShowCouponModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>CREATE COUPON</h3>
            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Coupon Code</label>
                <input type="text" className="form-input" style={{ textTransform: 'uppercase' }} value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select className="form-select" value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed INR (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Value</label>
                  <input type="number" className="form-input" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Min Purchase Order Amount (₹)</label>
                <input type="number" className="form-input" value={couponForm.min_order_amount} onChange={e => setCouponForm({ ...couponForm, min_order_amount: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>CREATE COUPON</button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COLLECTION MODAL */}
      {showCollectionModal && (
        <div className="modal-overlay" onClick={() => setShowCollectionModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <button className="modal-close-btn" onClick={() => setShowCollectionModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
              CREATE COLLECTION DROP
            </h3>
            <form onSubmit={handleSaveCollection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Collection Title</label>
                <input type="text" className="form-input" value={collectionForm.name} onChange={e => setCollectionForm({ ...collectionForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows="2" className="form-textarea" value={collectionForm.description} onChange={e => setCollectionForm({ ...collectionForm, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender Target</label>
                <select className="form-select" value={collectionForm.gender} onChange={e => setCollectionForm({ ...collectionForm, gender: e.target.value })}>
                  <option value="men">MEN</option>
                  <option value="women">WOMEN</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>PUBLISH COLLECTION</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
