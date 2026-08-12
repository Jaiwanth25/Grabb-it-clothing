import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, FolderTree, Image, PackageCheck,
  AlertTriangle, Users, Ticket, Move, Plus, Edit, Trash2, Check, X, Shield, ArrowLeft, RefreshCw,
  Settings, Layers, MessageSquare, Upload, Download
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
  const [collections, setCollections] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings mock state
  const [settings, setSettings] = useState({
    whatsappNumber: '+91 99999 88888',
    freeShippingThreshold: 999,
    codEnabled: true,
    returnPolicyDays: 7
  });

  // Bulk CSV State
  const [csvText, setCsvText] = useState('');
  const [csvImportResult, setCsvImportResult] = useState('');
  const [csvImportError, setCsvImportError] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState({
    id: null, name: '', description: '', gender: 'men', category_id: '',
    price: '', sale_price: '', sku: '', image_url: '',
    is_new: false, is_trending: false, is_featured: false, is_active: true
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', gender: 'men', image_url: '' });
  
  const [bannerForm, setBannerForm] = useState({
    title: '', subtitle: '', button_text: 'SHOP NOW', button_link: '/men',
    image_url: '', mobile_image_url: '', gender: '', start_date: '', end_date: '',
    display_order: 0, is_active: true
  });

  const [couponForm, setCouponForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '',
    min_order_amount: 0, expiry_date: '', usage_limit: 100
  });

  const [collectionForm, setCollectionForm] = useState({
    id: null, name: '', description: '', cover_image: '', banner_image: '',
    gender: 'men', is_active: true, selectedProducts: []
  });

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Stats
      const statsRes = await fetch('/api/admin/stats', { headers });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Products
      const prodRes = await fetch('/api/admin/products', { headers });
      const prodData = await prodRes.json();
      setProducts(prodData);

      // Categories
      const catRes = await fetch('/api/admin/categories', { headers });
      const catData = await catRes.json();
      setCategories(catData);

      // Banners
      const banRes = await fetch('/api/admin/banners', { headers });
      const banData = await banRes.json();
      setBanners(banData);

      // Orders
      const ordRes = await fetch('/api/admin/orders', { headers });
      const ordData = await ordRes.json();
      setOrders(ordData);

      // Inventory
      const invRes = await fetch('/api/admin/inventory', { headers });
      const invData = await invRes.json();
      setInventory(invData);

      // Customers
      const custRes = await fetch('/api/admin/customers', { headers });
      const custData = await custRes.json();
      setCustomers(custData);

      // Coupons
      const coupRes = await fetch('/api/admin/coupons', { headers });
      const coupData = await coupRes.json();
      setCoupons(coupData);

      // Collections
      const collRes = await fetch('/api/admin/collections', { headers });
      const collData = await collRes.json();
      setCollections(collData);

      // Reviews
      const revRes = await fetch('/api/admin/reviews', { headers });
      const revData = await revRes.json();
      setReviews(revData);

    } catch (err) {
      console.error('Fetch Admin Data Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchData();

    // Load mock settings from localStorage if they exist
    const savedSettings = localStorage.getItem('grabb_it_admin_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, [token]);

  if (!isAdmin) {
    return (
      <div className="container section-space" style={{ textAlign: 'center' }}>
        <Shield size={64} color="var(--accent-badge)" style={{ marginBottom: '1rem' }} />
        <h2>UNAUTHORIZED ACCESS</h2>
        <p>You do not have administrative privileges to access this area.</p>
        <Link to="/" className="btn-primary" style={{ marginTop: '1rem' }}>RETURN HOME</Link>
      </div>
    );
  }

  // --- ACTIONS LOGIC ---

  // Order status
  const handleUpdateOrderStatus = async (orderId, updates) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Inventory update stock
  const handleUpdateStock = async (variantId, newStock) => {
    try {
      const res = await fetch(`/api/admin/inventory/${variantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: newStock })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const isEdit = productForm.id !== null;
      const url = isEdit ? `/api/admin/products/${productForm.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          sale_price: productForm.sale_price ? parseFloat(productForm.sale_price) : null,
          category_id: parseInt(productForm.category_id),
          variants: isEdit ? undefined : [], // default variants created on backend
          images: isEdit ? undefined : [productForm.image_url] // primary image
        })
      });

      if (res.ok) {
        setShowProductModal(false);
        setProductForm({
          id: null, name: '', description: '', gender: 'men', category_id: '',
          price: '', sale_price: '', sku: '', image_url: '',
          is_new: false, is_trending: false, is_featured: false, is_active: true
        });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });
      if (res.ok) {
        setShowCategoryModal(false);
        setCategoryForm({ name: '', gender: 'men', image_url: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Banner
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bannerForm)
      });
      if (res.ok) {
        setShowBannerModal(false);
        setBannerForm({
          title: '', subtitle: '', button_text: 'SHOP NOW', button_link: '/men',
          image_url: '', mobile_image_url: '', gender: '', start_date: '', end_date: '',
          display_order: 0, is_active: true
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Delete banner?')) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Coupon
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(couponForm)
      });
      if (res.ok) {
        setShowCouponModal(false);
        setCouponForm({
          code: '', discount_type: 'percentage', discount_value: '',
          min_order_amount: 0, expiry_date: '', usage_limit: 100
        });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete coupon?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Collection
  const handleSaveCollection = async (e) => {
    e.preventDefault();
    try {
      const isEdit = collectionForm.id !== null;
      const url = isEdit ? `/api/admin/collections/${collectionForm.id}` : '/api/admin/collections';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: collectionForm.name,
          description: collectionForm.description,
          cover_image: collectionForm.cover_image,
          banner_image: collectionForm.banner_image,
          gender: collectionForm.gender,
          is_active: collectionForm.is_active ? 1 : 0,
          products: collectionForm.selectedProducts
        })
      });

      if (res.ok) {
        setShowCollectionModal(false);
        setCollectionForm({
          id: null, name: '', description: '', cover_image: '', banner_image: '',
          gender: 'men', is_active: true, selectedProducts: []
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Collection
  const handleDeleteCollection = async (id) => {
    if (!window.confirm('Delete this collection drop permanently?')) return;
    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Review Moderate
  const handleModerateReview = async (id, isModerated) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_moderated: isModerated })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Review Delete
  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('grabb_it_admin_settings', JSON.stringify(settings));
    alert('Global settings updated successfully!');
  };

  // CSV Catalog Export
  const handleExportCSV = () => {
    let csvContent = 'SKU,name,description,gender,category_id,price,sale_price,stock\n';
    products.forEach(p => {
      const totalStock = p.total_stock || 0;
      // Escaping commas
      const nameEscaped = `"${p.name.replace(/"/g, '""')}"`;
      const descEscaped = `"${(p.description || '').replace(/"/g, '""')}"`;
      csvContent += `${p.sku},${nameEscaped},${descEscaped},${p.gender},${p.category_id},${p.price},${p.sale_price || ''},${totalStock}\n`;
    });

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'grabb-it-products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Bulk Import Submit
  const handleImportCSV = async (e) => {
    e.preventDefault();
    setCsvImportError('');
    setCsvImportResult('');

    if (!csvText.trim()) return;

    // Basic CSV parser
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const parsedProducts = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle values with commas inside quotes
      const values = [];
      let inQuotes = false;
      let currentValue = '';
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      if (values.length < 5) continue;

      const prodObj = {};
      headers.forEach((hdr, idx) => {
        let val = values[idx] || '';
        val = val.replace(/^"|"$/g, ''); // remove wrapping quotes
        prodObj[hdr] = val;
      });

      parsedProducts.push(prodObj);
    }

    try {
      const res = await fetch('/api/admin/products/bulk-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ products: parsedProducts })
      });
      const data = await res.json();
      if (res.ok) {
        setCsvImportResult(data.message);
        if (data.warnings && data.warnings.length > 0) {
          setCsvImportResult(prev => `${prev}\nWarnings: ${data.warnings.join(', ')}`);
        }
        setCsvText('');
        fetchData();
      } else {
        setCsvImportError(data.error || 'Failed to bulk import products.');
        if (data.details) {
          setCsvImportError(prev => `${prev}\nErrors: ${data.details.join(', ')}`);
        }
      }
    } catch (err) {
      setCsvImportError('Network error uploading CSV data.');
    }
  };

  return (
    <main style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '3rem' }}>
      {/* Top Admin Branding Bar */}
      <div style={{ backgroundColor: 'var(--bg-dark)', color: '#fff', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={24} color="var(--accent-gold)" />
          <span style={{ fontWeight: 900, letterSpacing: '2px', fontSize: '1.2rem', fontFamily: 'var(--font-title)' }}>GRABB-IT COMMAND CONTROL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#ccc' }}>Active Operator: <strong>{user.name}</strong></span>
          <button 
            onClick={logout} 
            className="btn-secondary" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', borderColor: '#ffffff', color: '#ffffff', backgroundColor: 'transparent' }}
          >
            LOGOUT
          </button>
        </div>
      </div>

      <div className="container" style={{ marginTop: '2.5rem' }}>
        
        {/* Navigation Admin Controls Menu tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--text-main)', paddingBottom: '1rem' }}>
          <button className={`btn-secondary ${activeTab === 'overview' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('overview')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <LayoutDashboard size={14} /> Overview
          </button>
          <button className={`btn-secondary ${activeTab === 'products' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('products')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <ShoppingBag size={14} /> Products ({products.length})
          </button>
          <button className={`btn-secondary ${activeTab === 'categories' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('categories')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <FolderTree size={14} /> Categories ({categories.length})
          </button>
          <button className={`btn-secondary ${activeTab === 'collections' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('collections')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <Layers size={14} /> Collections ({collections.length})
          </button>
          <button className={`btn-secondary ${activeTab === 'banners' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('banners')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <Image size={14} /> Banners ({banners.length})
          </button>
          <button className={`btn-secondary ${activeTab === 'orders' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('orders')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <PackageCheck size={14} /> Orders ({orders.length})
          </button>
          <button className={`btn-secondary ${activeTab === 'inventory' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('inventory')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <AlertTriangle size={14} /> Inventory
          </button>
          <button className={`btn-secondary ${activeTab === 'reviews' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('reviews')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <MessageSquare size={14} /> Reviews ({reviews.length})
          </button>
          <button className={`btn-secondary ${activeTab === 'coupons' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('coupons')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <Ticket size={14} /> Coupons ({coupons.length})
          </button>
          <button className={`btn-secondary ${activeTab === 'customers' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('customers')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <Users size={14} /> Customers
          </button>
          <button className={`btn-secondary ${activeTab === 'settings' ? 'btn-primary' : ''}`} onClick={() => setActiveTab('settings')} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
            <Settings size={14} /> Settings
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-light)' }}>
            <RefreshCw size={28} className="spin" style={{ animation: 'spin 1.5s linear infinite' }} />
            <p style={{ marginTop: '1rem', fontWeight: 600 }}>SYNCHRONIZING CONTROL DATA...</p>
          </div>
        ) : (
          <div>
            
            {/* 1. OVERVIEW STATS TAB */}
            {activeTab === 'overview' && stats && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                  <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid var(--border-dark)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)' }}>REVENUE (PAID ORDERS)</span>
                    <h4 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.5rem', fontFamily: 'var(--font-title)' }}>₹{Math.round(stats.totalSales)}</h4>
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid var(--border-dark)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)' }}>TOTAL ORDERS PLACED</span>
                    <h4 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.5rem', fontFamily: 'var(--font-title)' }}>{stats.totalOrders}</h4>
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid var(--border-dark)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-light)' }}>TOTAL CATALOG PRODUCTS</span>
                    <h4 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.5rem', fontFamily: 'var(--font-title)' }}>{stats.totalProducts}</h4>
                  </div>
                  <div style={{ backgroundColor: '#fff', padding: '1.5rem', border: '1px solid var(--border-dark)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-badge)' }}>LOW STOCK ALERTS</span>
                    <h4 style={{ fontSize: '2rem', fontWeight: 900, marginTop: '0.5rem', color: 'var(--accent-badge)', fontFamily: 'var(--font-title)' }}>{stats.lowStockCount}</h4>
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>RECENT CUSTOMER TRANSACTIONS</h3>
                <table className="size-guide-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total Amt</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders?.map(o => (
                      <tr key={o.id}>
                        <td><strong>#{o.order_number}</strong></td>
                        <td>{o.customer_name}</td>
                        <td style={{ fontWeight: 800 }}>₹{Math.round(o.total_amount)}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: o.order_status === 'Pending' ? 'var(--accent-gold)' : 'var(--accent-olive)' }}>
                            {o.order_status.toUpperCase()}
                          </span>
                        </td>
                        <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. PRODUCTS CATALOG TAB */}
            {activeTab === 'products' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>Grabb-it Fits Directory</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn-secondary" 
                      onClick={() => setShowCsvModal(true)}
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem' }}
                    >
                      <Upload size={14} /> Bulk CSV Import
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={handleExportCSV}
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem' }}
                    >
                      <Download size={14} /> Export Directory
                    </button>
                    <button 
                      className="btn-primary" 
                      onClick={() => {
                        setProductForm({
                          id: null, name: '', description: '', gender: 'men', category_id: categories[0]?.id || '',
                          price: '', sale_price: '', sku: '', image_url: '',
                          is_new: true, is_trending: false, is_featured: false, is_active: true
                        });
                        setShowProductModal(true);
                      }}
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem' }}
                    >
                      <Plus size={14} /> Add Product
                    </button>
                  </div>
                </div>

                <table className="size-guide-table" style={{ width: '100%' }}>
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
                      <th>State</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td><img src={p.primary_image} alt="" style={{ width: '40px', height: '50px', objectFit: 'cover' }} /></td>
                        <td><code>{p.sku}</code></td>
                        <td><strong>{p.name}</strong></td>
                        <td style={{ textTransform: 'uppercase' }}>{p.gender}</td>
                        <td>{p.category_name}</td>
                        <td style={{ fontWeight: 700 }}>₹{Math.round(p.price)}</td>
                        <td style={{ fontWeight: 700 }}>{p.sale_price ? `₹${Math.round(p.sale_price)}` : '-'}</td>
                        <td style={{ fontWeight: 800, color: (p.total_stock || 0) === 0 ? 'var(--accent-badge)' : 'var(--text-main)' }}>
                          {p.total_stock || 0}
                        </td>
                        <td>{p.is_active === 1 ? 'Active' : 'Inactive'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button 
                              onClick={() => {
                                setProductForm({
                                  id: p.id, name: p.name, description: p.description, gender: p.gender,
                                  category_id: p.category_id, price: p.price, sale_price: p.sale_price || '',
                                  sku: p.sku, image_url: p.primary_image,
                                  is_new: p.is_new === 1, is_trending: p.is_trending === 1, is_featured: p.is_featured === 1,
                                  is_active: p.is_active === 1
                                });
                                setShowProductModal(true);
                              }}
                              style={{ color: 'var(--text-main)' }}
                            >
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)} style={{ color: 'var(--accent-badge)' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. CATEGORIES MANAGEMENT TAB */}
            {activeTab === 'categories' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>Apparel Categories</h2>
                  <button className="btn-primary" onClick={() => setShowCategoryModal(true)} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                    <Plus size={14} /> Add Category
                  </button>
                </div>
                <table className="size-guide-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Category ID</th>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Gender Target</th>
                      <th>Action</th>
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
                        <td>
                          <button onClick={() => handleDeleteCategory(c.id)} style={{ color: 'var(--accent-badge)' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. COLLECTIONS DROPS TAB */}
            {activeTab === 'collections' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>Curated Campaigns / Drop Collections</h2>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      setCollectionForm({
                        id: null, name: '', description: '', cover_image: '', banner_image: '',
                        gender: 'men', is_active: true, selectedProducts: []
                      });
                      setShowCollectionModal(true);
                    }} 
                    style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                  >
                    <Plus size={14} /> Create Collection Drop
                  </button>
                </div>
                <table className="size-guide-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Cover</th>
                      <th>Collection Title</th>
                      <th>Slug</th>
                      <th>Gender Scope</th>
                      <th>Total Products</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map(col => (
                      <tr key={col.id}>
                        <td><img src={col.cover_image} alt="" style={{ width: '60px', height: '45px', objectFit: 'cover' }} /></td>
                        <td><strong>{col.name}</strong></td>
                        <td>{col.slug}</td>
                        <td style={{ textTransform: 'uppercase' }}>{col.gender}</td>
                        <td style={{ fontWeight: 800 }}>{col.products?.length || 0} Products</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button 
                              onClick={() => {
                                setCollectionForm({
                                  id: col.id,
                                  name: col.name,
                                  description: col.description || '',
                                  cover_image: col.cover_image || '',
                                  banner_image: col.banner_image || '',
                                  gender: col.gender,
                                  is_active: col.is_active === 1,
                                  selectedProducts: col.products?.map(p => p.id) || []
                                });
                                setShowCollectionModal(true);
                              }}
                              style={{ color: 'var(--text-main)' }}
                            >
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteCollection(col.id)} style={{ color: 'var(--accent-badge)' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. BANNERS TAB */}
            {activeTab === 'banners' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>Hero Campaign Banners</h2>
                  <button className="btn-primary" onClick={() => setShowBannerModal(true)} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                    <Plus size={14} /> Add Campaign Banner
                  </button>
                </div>
                <table className="size-guide-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Visual Preview</th>
                      <th>Title</th>
                      <th>Subtitle</th>
                      <th>CTA Destination</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map(b => (
                      <tr key={b.id}>
                        <td><img src={b.image_url} alt="" style={{ width: '120px', height: '50px', objectFit: 'cover' }} /></td>
                        <td><strong>{b.title}</strong></td>
                        <td>{b.subtitle}</td>
                        <td><code>{b.button_link}</code></td>
                        <td>
                          <button onClick={() => handleDeleteBanner(b.id)} style={{ color: 'var(--accent-badge)' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. ORDERS MANAGEMENT TAB */}
            {activeTab === 'orders' && (
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Customer Orders Registry</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {orders.map(order => (
                    <div key={order.id} style={{ border: '1px solid var(--border-dark)', padding: '1.5rem', backgroundColor: '#ffffff' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                          <strong>Order #{order.order_number}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.15rem' }}>
                            Placed by {order.customer_name} ({order.email}) on {new Date(order.created_at).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Destination: {order.shipping_address} | Phone: {order.phone}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-light)' }}>
                              METHOD: {order.payment_method}
                            </span>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>₹{Math.round(order.total_amount)}</div>
                          </div>
                          
                          {/* Order Status Select Switch */}
                          <select 
                            className="form-select"
                            style={{ padding: '0.35rem', fontSize: '0.8rem', borderRadius: '0px', border: '1px solid var(--border-dark)' }}
                            value={order.order_status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, { order_status: e.target.value })}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span><strong>{item.product_name}</strong> ({item.size} / {item.color.toUpperCase()}) x {item.quantity}</span>
                            <span>₹{Math.round(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tracking details form inside admin dashboard card */}
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-light)', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', backgroundColor: 'var(--bg-subtle)', padding: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>SHIPMENT TRACKING:</span>
                        <input 
                          type="text" 
                          placeholder="Courier Partner"
                          className="form-select"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '130px', border: '1px solid var(--border-dark)', borderRadius: '0px', backgroundColor: '#ffffff' }}
                          defaultValue={order.courier || ''}
                          onBlur={(e) => handleUpdateOrderStatus(order.id, { courier: e.target.value })}
                        />
                        <input 
                          type="text" 
                          placeholder="Tracking ID"
                          className="form-select"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '140px', border: '1px solid var(--border-dark)', borderRadius: '0px', backgroundColor: '#ffffff' }}
                          defaultValue={order.tracking_number || ''}
                          onBlur={(e) => handleUpdateOrderStatus(order.id, { tracking_number: e.target.value })}
                        />
                        <input 
                          type="text" 
                          placeholder="Tracking Link URL"
                          className="form-select"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', flex: 1, minWidth: '180px', border: '1px solid var(--border-dark)', borderRadius: '0px', backgroundColor: '#ffffff' }}
                          defaultValue={order.tracking_url || ''}
                          onBlur={(e) => handleUpdateOrderStatus(order.id, { tracking_url: e.target.value })}
                        />
                        <button 
                          className="btn-primary" 
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem' }}
                          onClick={() => alert('Tracking details successfully updated!')}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. INVENTORY CONTROL TAB */}
            {activeTab === 'inventory' && (
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>SKU Variant Inventory Stock levels</h2>
                <table className="size-guide-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Color</th>
                      <th>Size</th>
                      <th>Stock Qty</th>
                      <th>Stock Status</th>
                      <th>Action</th>
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
                          <td style={{ fontWeight: 800 }}>{inv.size}</td>
                          <td>
                            <input 
                              type="number"
                              className="form-select"
                              style={{ width: '70px', padding: '0.25rem', borderRadius: '0px', textAlign: 'center', fontWeight: 700 }}
                              value={inv.stock}
                              onChange={(e) => handleUpdateStock(inv.variant_id, parseInt(e.target.value) || 0)}
                            />
                          </td>
                          <td>
                            {isOutOfStock ? (
                              <span style={{ color: 'var(--accent-badge)', fontWeight: 800, fontSize: '0.75rem' }}>OUT OF STOCK</span>
                            ) : isLowStock ? (
                              <span style={{ color: 'var(--accent-gold)', fontWeight: 800, fontSize: '0.75rem' }}>LOW STOCK</span>
                            ) : (
                              <span style={{ color: 'var(--accent-olive)', fontWeight: 800, fontSize: '0.75rem' }}>HEALTHY</span>
                            )}
                          </td>
                          <td>
                            <button 
                              onClick={() => handleUpdateStock(inv.variant_id, inv.stock + 10)}
                              className="btn-secondary"
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
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

            {/* 8. REVIEWS MODERATION TAB */}
            {activeTab === 'reviews' && (
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Verified Customer Feedbacks moderation</h2>
                <table className="size-guide-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Product Info</th>
                      <th>Rating</th>
                      <th>Customer Name</th>
                      <th>Review Text</th>
                      <th>Timestamp</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(rev => (
                      <tr key={rev.id}>
                        <td>
                          <span style={{ display: 'block', fontWeight: 700 }}>{rev.product_name}</span>
                          <code style={{ fontSize: '0.75rem' }}>{rev.product_sku}</code>
                        </td>
                        <td style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>{rev.rating}★</td>
                        <td><strong>{rev.user_name}</strong></td>
                        <td style={{ textAlign: 'left', fontSize: '0.85rem', maxWidth: '300px' }}>{rev.comment}</td>
                        <td>{new Date(rev.created_at).toLocaleDateString()}</td>
                        <td>
                          <span style={{ fontWeight: 800, fontSize: '0.75rem', color: rev.is_moderated === 1 ? 'var(--accent-olive)' : 'var(--accent-badge)' }}>
                            {rev.is_moderated === 1 ? 'APPROVED' : 'BLOCKED'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleModerateReview(rev.id, rev.is_moderated === 1 ? 0 : 1)}
                              className="btn-secondary"
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                            >
                              {rev.is_moderated === 1 ? 'Block' : 'Approve'}
                            </button>
                            <button onClick={() => handleDeleteReview(rev.id)} style={{ color: 'var(--accent-badge)' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 9. COUPONS TAB */}
            {activeTab === 'coupons' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>Coupon Codes Directory</h2>
                  <button className="btn-primary" onClick={() => setShowCouponModal(true)} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                    <Plus size={14} /> Create Promo Code
                  </button>
                </div>
                <table className="size-guide-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Coupon Code</th>
                      <th>Discount Type</th>
                      <th>Value</th>
                      <th>Min Order</th>
                      <th>Times Used</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(c => (
                      <tr key={c.id}>
                        <td><code>{c.code}</code></td>
                        <td style={{ textTransform: 'capitalize' }}>{c.discount_type}</td>
                        <td style={{ fontWeight: 800 }}>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${Math.round(c.discount_value)}`}</td>
                        <td>₹{Math.round(c.min_order_amount || 0)}</td>
                        <td>{c.times_used} times</td>
                        <td>
                          <span style={{ fontWeight: 800, fontSize: '0.75rem', color: c.is_active === 1 ? 'var(--accent-olive)' : 'var(--accent-badge)' }}>
                            {c.is_active === 1 ? 'ACTIVE' : 'EXPIRED'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleDeleteCoupon(c.id)} style={{ color: 'var(--accent-badge)' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 10. CUSTOMERS TAB */}
            {activeTab === 'customers' && (
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Registered Customer base</h2>
                <table className="size-guide-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Operator ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Total Orders</th>
                      <th>Total Spent</th>
                      <th>Joined Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.id}>
                        <td><code>USR-{c.id}</code></td>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.email}</td>
                        <td>{c.phone || '-'}</td>
                        <td style={{ fontWeight: 800 }}>{c.order_count} Orders</td>
                        <td style={{ fontWeight: 800 }}>₹{Math.round(c.total_spent)}</td>
                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 11. SETTINGS CONFIG TAB */}
            {activeTab === 'settings' && (
              <div style={{ maxWidth: '600px', backgroundColor: '#ffffff', padding: '2.5rem', border: '1px solid var(--border-dark)' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  GLOBAL STORE SETTINGS
                </h2>
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>WhatsApp Help Hotline number</label>
                    <input 
                      type="text" 
                      className="form-select" 
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }}
                      value={settings.whatsappNumber}
                      onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>Free Express Shipping Threshold (INR)</label>
                    <input 
                      type="number" 
                      className="form-select" 
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }}
                      value={settings.freeShippingThreshold}
                      onChange={(e) => setSettings({ ...settings, freeShippingThreshold: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 800 }}>Return / Cancellation Eligibility (Days)</label>
                    <input 
                      type="number" 
                      className="form-select" 
                      style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }}
                      value={settings.returnPolicyDays}
                      onChange={(e) => setSettings({ ...settings, returnPolicyDays: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div style={{ margin: '0.5rem 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800 }}>
                      <input 
                        type="checkbox"
                        checked={settings.codEnabled}
                        onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--text-main)' }}
                      />
                      Enable Cash on Delivery (COD) Checkbox Globally
                    </label>
                  </div>

                  <button type="submit" className="btn-primary" style={{ padding: '0.75rem 2rem', alignSelf: 'flex-start' }}>
                    SAVE CONFIGURATION
                  </button>
                </form>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ==================== MODALS ==================== */}

      {/* 1. ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--text-main)' }}>
            <button className="modal-close-btn" onClick={() => setShowProductModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
              {productForm.id ? 'Edit Fit Product' : 'Add New Fit Product'}
            </h3>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Fit Name</label>
                <input type="text" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Gender isolation</label>
                  <select className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', backgroundColor: '#ffffff' }} value={productForm.gender} onChange={e => setProductForm({ ...productForm, gender: e.target.value })}>
                    <option value="men">MEN</option>
                    <option value="women">WOMEN</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category Group</label>
                  <select className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', backgroundColor: '#ffffff' }} value={productForm.category_id} onChange={e => setProductForm({ ...productForm, category_id: e.target.value })} required>
                    {categories.filter(c => c.gender === productForm.gender).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">MRP Price (₹)</label>
                  <input type="number" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Sale Price (₹)</label>
                  <input type="number" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={productForm.sale_price} onChange={e => setProductForm({ ...productForm, sale_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU Code</label>
                  <input type="text" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Image URL</label>
                <input type="url" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={productForm.image_url} onChange={e => setProductForm({ ...productForm, image_url: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description specs</label>
                <textarea rows="3" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', outline: 'none' }} value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', margin: '0.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800 }}>
                  <input type="checkbox" checked={productForm.is_new} onChange={e => setProductForm({ ...productForm, is_new: e.target.checked })} /> Mark New Arrival
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800 }}>
                  <input type="checkbox" checked={productForm.is_trending} onChange={e => setProductForm({ ...productForm, is_trending: e.target.checked })} /> Mark Trending
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800 }}>
                  <input type="checkbox" checked={productForm.is_featured} onChange={e => setProductForm({ ...productForm, is_featured: e.target.checked })} /> Mark Featured
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 800 }}>
                  <input type="checkbox" checked={productForm.is_active} onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })} /> Active Status
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem' }}>SAVE PRODUCT IN STORE</button>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', border: '1px solid var(--text-main)' }}>
            <button className="modal-close-btn" onClick={() => setShowCategoryModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>ADD CATEGORY</h3>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input type="text" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Target Gender</label>
                <select className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', backgroundColor: '#ffffff' }} value={categoryForm.gender} onChange={e => setCategoryForm({ ...categoryForm, gender: e.target.value })}>
                  <option value="men">MEN</option>
                  <option value="women">WOMEN</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category cover Image URL</label>
                <input type="url" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={categoryForm.image_url} onChange={e => setCategoryForm({ ...categoryForm, image_url: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>SAVE CATEGORY</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD BANNER MODAL */}
      {showBannerModal && (
        <div className="modal-overlay" onClick={() => setShowBannerModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', border: '1px solid var(--text-main)' }}>
            <button className="modal-close-btn" onClick={() => setShowBannerModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>ADD CAMPAIGN BANNER</h3>
            <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Banner Title</label>
                <input type="text" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle drop info</label>
                <input type="text" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={bannerForm.subtitle} onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Desktop Image URL</label>
                <input type="url" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={bannerForm.image_url} onChange={e => setBannerForm({ ...bannerForm, image_url: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Image URL</label>
                <input type="url" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={bannerForm.mobile_image_url} onChange={e => setBannerForm({ ...bannerForm, mobile_image_url: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Button Link URL</label>
                  <input type="text" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={bannerForm.button_link} onChange={e => setBannerForm({ ...bannerForm, button_link: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender Switch</label>
                  <select className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', backgroundColor: '#ffffff' }} value={bannerForm.gender} onChange={e => setBannerForm({ ...bannerForm, gender: e.target.value })}>
                    <option value="">BOTH MEN & WOMEN</option>
                    <option value="men">MEN</option>
                    <option value="women">WOMEN</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>SAVE BANNER</button>
            </form>
          </div>
        </div>
      )}

      {/* 4. CREATE / EDIT COLLECTION MODAL */}
      {showCollectionModal && (
        <div className="modal-overlay" onClick={() => setShowCollectionModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--text-main)' }}>
            <button className="modal-close-btn" onClick={() => setShowCollectionModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
              {collectionForm.id ? 'Edit Collection drop' : 'Create Collection drop'}
            </h3>
            <form onSubmit={handleSaveCollection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Collection drop Name</label>
                <input type="text" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={collectionForm.name} onChange={e => setCollectionForm({ ...collectionForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description text</label>
                <textarea rows="2" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', outline: 'none' }} value={collectionForm.description} onChange={e => setCollectionForm({ ...collectionForm, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Cover Image URL</label>
                  <input type="url" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={collectionForm.cover_image} onChange={e => setCollectionForm({ ...collectionForm, cover_image: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Campaign Banner URL</label>
                  <input type="url" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={collectionForm.banner_image} onChange={e => setCollectionForm({ ...collectionForm, banner_image: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Gender Scope target</label>
                <select className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', backgroundColor: '#ffffff' }} value={collectionForm.gender} onChange={e => setCollectionForm({ ...collectionForm, gender: e.target.value })}>
                  <option value="men">MEN</option>
                  <option value="women">WOMEN</option>
                  <option value="unisex">UNISEX</option>
                </select>
              </div>

              {/* Product Multi-select check list */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 800 }}>Associate Products (Multi-select)</label>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-light)', padding: '0.75rem', backgroundColor: '#ffffff' }}>
                  {products.map(p => {
                    const isChecked = collectionForm.selectedProducts.includes(p.id);
                    return (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          style={{ accentColor: 'var(--text-main)' }}
                          onChange={() => {
                            let nextSelected = [...collectionForm.selectedProducts];
                            if (isChecked) {
                              nextSelected = nextSelected.filter(id => id !== p.id);
                            } else {
                              nextSelected.push(p.id);
                            }
                            setCollectionForm({ ...collectionForm, selectedProducts: nextSelected });
                          }}
                        />
                        {p.name} (SKU: {p.sku})
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>PUBLISH COLLECTION</button>
            </form>
          </div>
        </div>
      )}

      {/* 5. CREATE COUPON MODAL */}
      {showCouponModal && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', border: '1px solid var(--text-main)' }}>
            <button className="modal-close-btn" onClick={() => setShowCouponModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>CREATE COUPON</h3>
            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Coupon Code</label>
                <input type="text" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', textTransform: 'uppercase' }} value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', backgroundColor: '#ffffff' }} value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed INR (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Value</label>
                  <input type="number" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Min Purchase Order Amount (₹)</label>
                <input type="number" className="form-select" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px' }} value={couponForm.min_order_amount} onChange={e => setCouponForm({ ...couponForm, min_order_amount: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}>CREATE COUPON</button>
            </form>
          </div>
        </div>
      )}

      {/* 6. BULK CSV IMPORT MODAL */}
      {showCsvModal && (
        <div className="modal-overlay" onClick={() => setShowCsvModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', border: '1px solid var(--text-main)' }}>
            <button className="modal-close-btn" onClick={() => setShowCsvModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem', fontFamily: 'var(--font-title)' }}>BULK IMPORT PRODUCTS (CSV)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
              Paste comma-separated values (CSV format). Make sure the headers match exactly:<br />
              <code>SKU,name,description,gender,category_id,price,sale_price,size,color,stock,image_url</code>
            </p>
            <form onSubmit={handleImportCSV} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea
                rows="8"
                className="form-select"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-dark)', borderRadius: '0px', fontFamily: 'monospace', fontSize: '0.75rem', outline: 'none' }}
                placeholder="SKU,name,description,gender,category_id,price,sale_price,size,color,stock,image_url&#10;GRB-M-TSH-99,Mock Tee,A lightweight tee,men,1,799,,M,Black,35,https://images.unsplash.com..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                required
              />

              {csvImportResult && (
                <div style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--accent-olive)', padding: '0.75rem', fontSize: '0.8rem', borderLeft: '3px solid var(--accent-olive)', whiteSpace: 'pre-wrap' }}>
                  {csvImportResult}
                </div>
              )}
              {csvImportError && (
                <div style={{ backgroundColor: 'var(--accent-badge-bg)', color: 'var(--accent-badge)', padding: '0.75rem', fontSize: '0.8rem', borderLeft: '3px solid var(--accent-badge)', whiteSpace: 'pre-wrap' }}>
                  {csvImportError}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem' }}>IMPORT PRODUCT RECORDS</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminDashboard;
