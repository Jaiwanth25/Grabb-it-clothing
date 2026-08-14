import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, FolderTree, Image, PackageCheck,
  Users, Ticket, Plus, Edit, Trash2, X, Shield, RefreshCw,
  Settings, Layers, MessageSquare, CreditCard, Menu, Eye, Camera, AlertCircle
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
  const [looks, setLooks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showLookModal, setShowLookModal] = useState(false);

  // Direct File Image Upload States
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form states
  const [productForm, setProductForm] = useState({
    id: null, name: '', description: '', gender: 'men', category_id: '',
    price: '', sale_price: '', sku: '',
    is_new: false, is_trending: false, is_featured: false, is_hot: false, is_bestseller: false, is_sale: false, is_limited: false,
    custom_badge_text: '', custom_badge_color: '#FFB3C1',
    is_active: true,
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
    title: 'THE FESTIVE CARNIVAL DROP', subtitle: 'Vibrant Colors. Contemporary Fits.', button_text: 'SHOP COLLECTION NOW', button_link: '/men',
    image_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80', mobile_image_url: '', gender: 'all', display_order: 0, is_active: true
  });

  const [couponForm, setCouponForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '',
    min_order_amount: 0, target_scope: 'all', usage_limit: 100
  });

  const [collectionForm, setCollectionForm] = useState({
    id: null, name: '', description: '', cover_image: '', banner_image: '',
    gender: 'men', is_active: true, selectedProducts: []
  });

  const [lookForm, setLookForm] = useState({
    name: '', description: '', image_url: '', gender: 'men', product_ids: [], is_active: true
  });

  const [settingsForm, setSettingsForm] = useState({
    storeName: 'GRABB-IT CLOTHING',
    storeEmail: 'support@grabb-it.com',
    phone: '+91 98765 43210',
    whatsappNumber: '+91 99999 88888',
    freeShippingThreshold: '999',
    freeShippingMessage: 'FESTIVE CARNIVAL DROP: FREE EXPRESS SHIPPING ABOVE ₹999 • USE CODE: GRABB10 FOR 10% OFF',
    instagramUrl: 'https://instagram.com/grabb_it_clothing',
    returnPolicy: 'Easy 7-day hassle-free returns and exchanges.',
    shippingPolicy: 'Express shipping across India in 3-5 business days.',
    privacyPolicy: 'Your personal data is encrypted and handled strictly according to Indian privacy laws.',
    termsConditions: 'All orders subject to stock availability and verification.'
  });

  const [paymentSettingsForm, setPaymentSettingsForm] = useState({
    upi_enabled: 'true',
    upi_id: 'grabb-it@upi',
    upi_display_name: 'GRABB-IT CLOTHING PVT LTD',
    upi_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=grabb-it@upi&pn=GrabbItClothing',
    bank_enabled: 'true',
    bank_name: 'HDFC Bank Ltd',
    bank_account_holder: 'GRABB-IT CLOTHING PVT LTD',
    bank_account_number: '50200012345678',
    bank_ifsc: 'HDFC0001234',
    bank_branch: 'Indiranagar 100ft Road, Bengaluru',
    payment_instructions: 'After making payment, please note down your UTR / Transaction Reference Number and enter it during checkout.'
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

      const [statsRes, prodRes, catRes, banRes, ordRes, invRes, custRes, coupRes, colRes, revRes, looksRes, setRes, paySetRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/products', { headers }),
        fetch('/api/admin/categories', { headers }),
        fetch('/api/admin/banners', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/inventory', { headers }),
        fetch('/api/admin/customers', { headers }),
        fetch('/api/admin/coupons', { headers }),
        fetch('/api/admin/collections', { headers }),
        fetch('/api/admin/reviews', { headers }),
        fetch('/api/admin/looks', { headers }),
        fetch('/api/admin/settings', { headers }),
        fetch('/api/admin/payment-settings', { headers })
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
      if (looksRes.ok) setLooks(await looksRes.json());
      if (setRes.ok) {
        const setMap = await setRes.json();
        if (setMap && Object.keys(setMap).length) {
          setSettingsForm(prev => ({ ...prev, ...setMap }));
        }
      }
      if (paySetRes.ok) {
        const payMap = await paySetRes.json();
        if (payMap && Object.keys(payMap).length) {
          setPaymentSettingsForm(prev => ({ ...prev, ...payMap }));
        }
      }
    } catch (err) {
      console.error('Fetch Admin Data Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Direct File Image Upload Handler
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
        is_hot: productForm.is_hot ? 1 : 0,
        is_bestseller: productForm.is_bestseller ? 1 : 0,
        is_sale: productForm.is_sale ? 1 : 0,
        is_limited: productForm.is_limited ? 1 : 0,
        custom_badge_text: productForm.custom_badge_text || null,
        custom_badge_color: productForm.custom_badge_color || '#FFB3C1',
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
      alert(productForm.id ? '✓ Product updated successfully!' : '✓ Product created successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    try {
      let endpoint = `/api/admin/${type}/${id}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete record');
      alert(`✓ ${data.message || 'Item deleted successfully.'}`);
      setDeleteConfirm(null);
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
      alert('✓ Category added successfully!');
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
      alert('✓ Hero Banner published successfully!');
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
      setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: 0, target_scope: 'all', usage_limit: 100 });
      fetchData();
      alert('✓ Special offer created successfully!');
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
      alert('✓ Collection drop published successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  // Shop The Look Save
  const handleSaveLook = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(lookForm)
      });
      if (!res.ok) throw new Error('Failed to save look');
      setShowLookModal(false);
      setLookForm({ name: '', description: '', image_url: '', gender: 'men', product_ids: [], is_active: true });
      fetchData();
      alert('✓ Outfit look published successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  // Global Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settingsForm)
      });
      if (!res.ok) throw new Error('Failed to save store settings');
      fetchData();
      alert('✓ Global Store Settings saved! Changes are now live on the customer website.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Payment & Bank Details Save
  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    try {
      let uploadedQrUrl = paymentSettingsForm.upi_qr_url;
      if (selectedFiles.length > 0) {
        const urls = await uploadSelectedFiles();
        if (urls && urls.length > 0) {
          uploadedQrUrl = urls[0];
        }
      }

      const payload = {
        ...paymentSettingsForm,
        upi_qr_url: uploadedQrUrl
      };

      const res = await fetch('/api/admin/payment-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save payment settings');
      setSelectedFiles([]);
      setImagePreviews([]);
      fetchData();
      alert('✓ Payment & Bank Details updated successfully! Changes are live on customer checkout.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteQrCode = async () => {
    try {
      const res = await fetch('/api/admin/payment-settings/qr', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete QR code');
      setPaymentSettingsForm(prev => ({ ...prev, upi_qr_url: '' }));
      alert('✓ UPI QR Code image deleted.');
    } catch (err) {
      alert(err.message);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard Home', icon: LayoutDashboard },
    { id: 'orders', label: 'View Customer Orders', icon: ShoppingBag, badge: orders.filter(o => o.order_status === 'Pending').length },
    { id: 'products', label: 'Manage Products', icon: PackageCheck },
    { id: 'inventory', label: 'Stock Inventory', icon: Layers },
    { id: 'coupons', label: 'Special Offers & Coupons', icon: Ticket },
    { id: 'collections', label: 'Campaign Collections', icon: Image },
    { id: 'banners', label: 'Homepage Banners', icon: Image },
    { id: 'looks', label: 'Shop The Look', icon: Camera },
    { id: 'categories', label: 'Apparel Categories', icon: FolderTree },
    { id: 'customers', label: 'Registered Customers', icon: Users },
    { id: 'reviews', label: 'Customer Reviews', icon: MessageSquare },
    { id: 'payments', label: 'Payments & Refunds Log', icon: CreditCard },
    { id: 'payment-settings', label: 'Payment & Bank Details', icon: CreditCard },
    { id: 'settings', label: 'Store Settings & Policies', icon: Settings }
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
              {navItems.find(i => i.id === activeTab)?.label || 'Shop Manager Control'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={fetchData} className="btn-outline-gray" style={{ padding: '0.45rem 0.85rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={14} /> Refresh Data
            </button>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              Shop Owner: <span style={{ color: 'var(--text-dark)' }}>{user?.email || 'admin@grabb-it.com'}</span>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main style={{ padding: '2rem' }}>
          {loading && !stats ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', fontWeight: 700, color: 'var(--text-muted)' }}>
              Loading Store Control Panel...
            </div>
          ) : (
            <div>
              {/* TAB 1: NON-TECHNICAL DASHBOARD HOME CARDS */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* NON-TECHNICAL ACTION CARDS GRID */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div 
                      onClick={() => setActiveTab('products')}
                      style={{ cursor: 'pointer', backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)', transition: 'transform 200ms ease' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PackageCheck size={24} color="var(--text-dark)" />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'var(--color-highlight)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                          {products.length} Products
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '1rem', fontFamily: 'var(--font-title)' }}>👕 Add &amp; Edit Products</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Upload clothing pictures, set prices in ₹, manage sizes, colors, and badges.
                      </p>
                    </div>

                    <div 
                      onClick={() => setActiveTab('orders')}
                      style={{ cursor: 'pointer', backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)', transition: 'transform 200ms ease' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingBag size={24} color="var(--text-dark)" />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'var(--color-primary)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                          {orders.filter(o => o.order_status === 'Pending').length} Pending
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '1rem', fontFamily: 'var(--font-title)' }}>📦 View Customer Orders</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        See who ordered, view items &amp; addresses, and update shipping tracking status.
                      </p>
                    </div>

                    <div 
                      onClick={() => setActiveTab('coupons')}
                      style={{ cursor: 'pointer', backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)', transition: 'transform 200ms ease' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Ticket size={24} color="var(--text-dark)" />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'var(--color-support)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                          {coupons.length} Active Offers
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '1rem', fontFamily: 'var(--font-title)' }}>🎁 Create Offers &amp; Discounts</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Create festive promo codes, percentage discounts, and free shipping deals.
                      </p>
                    </div>

                    <div 
                      onClick={() => setActiveTab('banners')}
                      style={{ cursor: 'pointer', backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)', transition: 'transform 200ms ease' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-support)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Image size={24} color="var(--text-dark)" />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'var(--color-highlight)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                          {banners.length} Banners
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '1rem', fontFamily: 'var(--font-title)' }}>🖼 Change Homepage Banners</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Upload hero pictures, set main headlines, button links, and preview live.
                      </p>
                    </div>

                    <div 
                      onClick={() => setActiveTab('looks')}
                      style={{ cursor: 'pointer', backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)', transition: 'transform 200ms ease' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Camera size={24} color="var(--text-dark)" />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: 'var(--color-primary)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                          {looks.length} Looks
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '1rem', fontFamily: 'var(--font-title)' }}>📸 Shop The Look Outfits</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Upload complete model outfit photos and tag the products worn.
                      </p>
                    </div>

                    <div 
                      onClick={() => setActiveTab('settings')}
                      style={{ cursor: 'pointer', backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)', transition: 'transform 200ms ease' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Settings size={24} color="var(--text-dark)" />
                        </div>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '1rem', fontFamily: 'var(--font-title)' }}>⚙ Store Settings &amp; Info</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Set WhatsApp helpline, free shipping threshold (₹), return policies, and phone numbers.
                      </p>
                    </div>
                  </div>

                  {/* REAL REVENUE & METRICS SUMMARY */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                    <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.25rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Revenue</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.3rem', fontFamily: 'var(--font-title)' }}>
                        {formatINR(stats?.totalSales || 0)}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.25rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Orders</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.3rem', fontFamily: 'var(--font-title)' }}>
                        {stats?.totalOrders || 0}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#ffffff', border: '2px solid var(--border-light)', padding: '1.25rem', borderRadius: '16px', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Registered Customers</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.3rem', fontFamily: 'var(--font-title)' }}>
                        {stats?.totalCustomers || 0}
                      </div>
                    </div>
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
                      No customer orders recorded yet. When customers place orders, they will appear here automatically!
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

              {/* TAB 3: PRODUCTS MANAGEMENT & DYNAMIC BADGE TOGGLES */}
              {activeTab === 'products' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                      Store Apparel Products ({products.length})
                    </h2>
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        setProductForm({
                          id: null, name: '', description: '', gender: 'men', category_id: categories[0]?.id || '',
                          price: '', sale_price: '', sku: '',
                          is_new: true, is_trending: false, is_featured: false, is_hot: false, is_bestseller: false, is_sale: false, is_limited: false,
                          custom_badge_text: '', custom_badge_color: '#FFB3C1',
                          is_active: true,
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
                      No products in store yet. Click "Add New Product" to list your first clothing item!
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>SKU</th>
                            <th>Product Title</th>
                            <th>Gender</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Sale Price</th>
                            <th>Badges</th>
                            <th>Stock</th>
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
                              <td>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {p.is_new === 1 && <span className="badge-new" style={{ fontSize: '0.65rem' }}>NEW</span>}
                                  {p.is_hot === 1 && <span className="badge-discount" style={{ fontSize: '0.65rem' }}>HOT 🔥</span>}
                                  {p.is_trending === 1 && <span className="badge-trending" style={{ fontSize: '0.65rem' }}>TRENDING</span>}
                                  {p.custom_badge_text && (
                                    <span style={{ backgroundColor: p.custom_badge_color || '#FFB3C1', color: '#2B2B2B', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                      {p.custom_badge_text}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td><strong>{p.total_stock || 0}</strong></td>
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
                                        is_hot: p.is_hot === 1,
                                        is_bestseller: p.is_bestseller === 1,
                                        is_sale: p.is_sale === 1,
                                        is_limited: p.is_limited === 1,
                                        custom_badge_text: p.custom_badge_text || '',
                                        custom_badge_color: p.custom_badge_color || '#FFB3C1',
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
                                    onClick={() => setDeleteConfirm({ type: 'products', id: p.id, title: p.name })}
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

              {/* TAB 4: OFFERS & COUPONS MANAGER */}
              {activeTab === 'coupons' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                      Special Offers &amp; Promo Codes
                    </h2>
                    <button className="btn-primary" onClick={() => setShowCouponModal(true)}>
                      <Plus size={16} /> CREATE NEW OFFER
                    </button>
                  </div>

                  {coupons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No active promo codes. Click "Create New Offer" to add your first discount!
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Coupon Code</th>
                            <th>Discount Type</th>
                            <th>Discount Value</th>
                            <th>Min Purchase (₹)</th>
                            <th>Target Scope</th>
                            <th>Times Used</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map(c => (
                            <tr key={c.id}>
                              <td><code>{c.code}</code></td>
                              <td style={{ textTransform: 'capitalize' }}>{c.discount_type}</td>
                              <td><strong>{c.discount_type === 'percentage' ? `${c.discount_value}%` : formatINR(c.discount_value)}</strong></td>
                              <td>{formatINR(c.min_order_amount || 0)}</td>
                              <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{c.target_scope || 'Entire Store'}</td>
                              <td>{c.times_used || 0} times</td>
                              <td><span className="badge-new">{c.is_active === 1 ? 'Active' : 'Disabled'}</span></td>
                              <td>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'coupons', id: c.id, title: c.code })}
                                  className="btn-outline-gray"
                                  style={{ padding: '0.35rem 0.6rem', color: '#c62828', borderColor: '#c62828' }}
                                >
                                  <Trash2 size={14} />
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

              {/* TAB 5: HOMEPAGE BANNERS & VISUAL LIVE PREVIEW */}
              {activeTab === 'banners' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                      Homepage Hero Campaign Banners
                    </h2>
                    <button className="btn-primary" onClick={() => setShowBannerModal(true)}>
                      <Plus size={16} /> ADD HERO BANNER
                    </button>
                  </div>

                  {banners.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No hero banners active on homepage. Click "Add Hero Banner" to publish your first banner!
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Image Preview</th>
                            <th>Headline Title</th>
                            <th>Subtitle Info</th>
                            <th>CTA Button Link</th>
                            <th>Status</th>
                            <th>Actions</th>
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
                              <td>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'banners', id: b.id, title: b.title })}
                                  className="btn-outline-gray"
                                  style={{ padding: '0.35rem 0.6rem', color: '#c62828', borderColor: '#c62828' }}
                                >
                                  <Trash2 size={14} />
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

              {/* TAB 6: SHOP THE LOOK */}
              {activeTab === 'looks' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                      Shop The Look Outfit Campaigns
                    </h2>
                    <button className="btn-primary" onClick={() => setShowLookModal(true)}>
                      <Plus size={16} /> ADD OUTFIT LOOK
                    </button>
                  </div>

                  {looks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No outfit looks created yet. Click "Add Outfit Look" to tag model outfits!
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Outfit Photo</th>
                            <th>Look Name</th>
                            <th>Description</th>
                            <th>Tagged Products</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {looks.map(l => (
                            <tr key={l.id}>
                              <td><img src={l.image_url} alt="" style={{ width: '60px', height: '75px', objectFit: 'cover', borderRadius: '8px' }} /></td>
                              <td><strong>{l.name}</strong></td>
                              <td>{l.description}</td>
                              <td><strong>{l.products?.length || 0} Products Tagged</strong></td>
                              <td><span className="badge-new">{l.is_active === 1 ? 'Active' : 'Disabled'}</span></td>
                              <td>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'looks', id: l.id, title: l.name })}
                                  className="btn-outline-gray"
                                  style={{ padding: '0.35rem 0.6rem', color: '#c62828', borderColor: '#c62828' }}
                                >
                                  <Trash2 size={14} />
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

              {/* TAB 7: COLLECTIONS */}
              {activeTab === 'collections' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
                      Curated Campaign Collections
                    </h2>
                    <button className="btn-primary" onClick={() => setShowCollectionModal(true)}>
                      <Plus size={16} /> CREATE COLLECTION
                    </button>
                  </div>

                  {collections.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No campaign collections listed yet.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Cover</th>
                            <th>Title</th>
                            <th>Slug</th>
                            <th>Target Gender</th>
                            <th>Products Included</th>
                            <th>Actions</th>
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
                              <td>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'collections', id: col.id, title: col.name })}
                                  className="btn-outline-gray"
                                  style={{ padding: '0.35rem 0.6rem', color: '#c62828', borderColor: '#c62828' }}
                                >
                                  <Trash2 size={14} />
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

              {/* TAB 8: CATEGORIES */}
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

              {/* TAB 9: INVENTORY STOCK */}
              {activeTab === 'inventory' && (
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
                    Variant Inventory Stock Matrix
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
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.map((inv, idx) => (
                            <tr key={idx}>
                              <td><code>{inv.sku}</code></td>
                              <td><strong>{inv.product_name}</strong></td>
                              <td>{inv.category_name}</td>
                              <td>{inv.color}</td>
                              <td><strong>{inv.size}</strong></td>
                              <td><strong>{inv.stock}</strong></td>
                              <td>
                                {inv.stock === 0 ? (
                                  <span className="badge-discount">OUT</span>
                                ) : inv.stock <= 5 ? (
                                  <span className="badge-trending">LOW</span>
                                ) : (
                                  <span className="badge-new">HEALTHY</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 10: CUSTOMERS */}
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

              {/* TAB 11: REVIEWS MODERATION */}
              {activeTab === 'reviews' && (
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
                    Customer Reviews Moderation
                  </h2>

                  {reviews.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
                      No customer reviews submitted yet.
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

              {/* TAB 12: PAYMENTS LOG */}
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
                            <td><span className="badge-new">{o.payment_status || 'Paid'}</span></td>
                            <td>{new Date(o.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 13: GLOBAL STORE SETTINGS & POLICIES */}
              {activeTab === 'settings' && (
                <div style={{ maxWidth: '750px', backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '16px', border: '2px solid var(--border-light)' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
                    GLOBAL STORE CONFIGURATION &amp; POLICIES
                  </h2>
                  <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Store Brand Name</label>
                        <input type="text" className="form-input" value={settingsForm.storeName} onChange={e => setSettingsForm({ ...settingsForm, storeName: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Support Email</label>
                        <input type="email" className="form-input" value={settingsForm.storeEmail} onChange={e => setSettingsForm({ ...settingsForm, storeEmail: e.target.value })} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Support Phone</label>
                        <input type="text" className="form-input" value={settingsForm.phone} onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">WhatsApp Helpline Hotline</label>
                        <input type="text" className="form-input" value={settingsForm.whatsappNumber} onChange={e => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })} required />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Free Express Shipping Threshold (₹)</label>
                        <input type="number" className="form-input" value={settingsForm.freeShippingThreshold} onChange={e => setSettingsForm({ ...settingsForm, freeShippingThreshold: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Instagram Profile URL</label>
                        <input type="url" className="form-input" value={settingsForm.instagramUrl} onChange={e => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Announcement Top Ticker Banner Message</label>
                      <input type="text" className="form-input" value={settingsForm.freeShippingMessage} onChange={e => setSettingsForm({ ...settingsForm, freeShippingMessage: e.target.value })} required />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Return Policy Summary</label>
                      <textarea rows="2" className="form-textarea" value={settingsForm.returnPolicy} onChange={e => setSettingsForm({ ...settingsForm, returnPolicy: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Shipping Policy Summary</label>
                      <textarea rows="2" className="form-textarea" value={settingsForm.shippingPolicy} onChange={e => setSettingsForm({ ...settingsForm, shippingPolicy: e.target.value })} />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.85rem' }}>
                      SAVE ALL STORE CONFIGURATIONS
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 14: ADMIN PAYMENT & BANK DETAILS MANAGEMENT */}
              {activeTab === 'payment-settings' && (
                <div style={{ maxWidth: '800px', backgroundColor: '#ffffff', padding: '2.5rem', borderRadius: '16px', border: '2px solid var(--border-light)' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
                    💳 PAYMENT METHODS &amp; BANK DETAILS CONTROL
                  </h2>

                  <form onSubmit={handleSavePaymentSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* SECTION 1: UPI PAYMENT CONFIGURATION */}
                    <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', fontFamily: 'var(--font-title)' }}>
                          📱 Direct UPI &amp; QR Code Settings
                        </h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={paymentSettingsForm.upi_enabled === 'true'}
                            onChange={e => setPaymentSettingsForm({ ...paymentSettingsForm, upi_enabled: e.target.checked ? 'true' : 'false' })}
                          /> Enable UPI Payment
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Shop Owner UPI VPA / ID</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. grabb-it@upi"
                            value={paymentSettingsForm.upi_id}
                            onChange={e => setPaymentSettingsForm({ ...paymentSettingsForm, upi_id: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">UPI Display Name</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. GRABB-IT CLOTHING"
                            value={paymentSettingsForm.upi_display_name}
                            onChange={e => setPaymentSettingsForm({ ...paymentSettingsForm, upi_display_name: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      {/* QR CODE IMAGE PICKER UPLOAD & DELETE */}
                      <div className="form-group">
                        <label className="form-label">Upload / Replace UPI QR Code Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="form-input"
                          style={{ padding: '0.5rem' }}
                        />

                        {paymentSettingsForm.upi_qr_url && (
                          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#ffffff', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                            <img src={paymentSettingsForm.upi_qr_url} alt="UPI QR" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                            <div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Current QR Image Active</span>
                              <button
                                type="button"
                                onClick={handleDeleteQrCode}
                                className="btn-outline-gray"
                                style={{ marginTop: '0.4rem', color: '#c62828', borderColor: '#c62828', padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'block' }}
                              >
                                Delete QR Image
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 2: DIRECT BANK TRANSFER DETAILS */}
                    <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', fontFamily: 'var(--font-title)' }}>
                          🏦 Bank Account Transfer Details
                        </h3>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={paymentSettingsForm.bank_enabled === 'true'}
                            onChange={e => setPaymentSettingsForm({ ...paymentSettingsForm, bank_enabled: e.target.checked ? 'true' : 'false' })}
                          /> Enable Bank Transfer
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Bank Name</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. HDFC Bank Ltd"
                            value={paymentSettingsForm.bank_name}
                            onChange={e => setPaymentSettingsForm({ ...paymentSettingsForm, bank_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Account Holder Name</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. GRABB-IT CLOTHING PVT LTD"
                            value={paymentSettingsForm.bank_account_holder}
                            onChange={e => setPaymentSettingsForm({ ...paymentSettingsForm, bank_account_holder: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">Account Number</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 50200012345678"
                            value={paymentSettingsForm.bank_account_number}
                            onChange={e => setPaymentSettingsForm({ ...paymentSettingsForm, bank_account_number: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">IFSC Code</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. HDFC0001234"
                            value={paymentSettingsForm.bank_ifsc}
                            onChange={e => setPaymentSettingsForm({ ...paymentSettingsForm, bank_ifsc: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Branch Name &amp; Address</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Indiranagar 100ft Road Branch, Bengaluru"
                          value={paymentSettingsForm.bank_branch}
                          onChange={e => setPaymentSettingsForm({ ...paymentSettingsForm, bank_branch: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* SECTION 3: PAYMENT INSTRUCTIONS FOR CUSTOMERS */}
                    <div className="form-group">
                      <label className="form-label">Customer Payment Instructions</label>
                      <textarea
                        rows="3"
                        className="form-textarea"
                        placeholder="Instructions displayed to customer during checkout..."
                        value={paymentSettingsForm.payment_instructions}
                        onChange={e => setPaymentSettingsForm({ ...paymentSettingsForm, payment_instructions: e.target.value })}
                      />
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: '0.85rem' }} disabled={uploadingImages}>
                      {uploadingImages ? 'UPLOADING QR IMAGE...' : 'SAVE PAYMENT & BANK DETAILS'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ==================== MODALS & PREVIEWS ==================== */}

      {/* DELETE CONFIRMATION SAFETY MODAL */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <AlertCircle size={48} color="#c62828" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>CONFIRM DELETION</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.75rem 0 1.5rem 0' }}>
              Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>CANCEL</button>
              <button className="btn-primary" style={{ backgroundColor: '#c62828', borderColor: '#c62828' }} onClick={handleConfirmDelete}>DELETE</button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
              ORDER DETAILS #{selectedOrder.order_number}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                  <label className="form-label">Tracking AWB Number</label>
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

      {/* ADD / EDIT PRODUCT MODAL WITH DYNAMIC BADGE TOGGLES & FILE PICKER */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <button className="modal-close-btn" onClick={() => setShowProductModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
              {productForm.id ? 'Edit Apparel Product' : 'Add New Apparel Product'}
            </h3>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Product Title</label>
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
                  <label className="form-label">Item Price (₹)</label>
                  <input type="number" className="form-input" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Original Price (₹)</label>
                  <input type="number" className="form-input" value={productForm.sale_price} onChange={e => setProductForm({ ...productForm, sale_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU Code</label>
                  <input type="text" className="form-input" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} required />
                </div>
              </div>

              {/* DIRECT FILE UPLOAD PICKER */}
              <div className="form-group">
                <label className="form-label">Upload Clothing Pictures (Click to select from Computer)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="form-input"
                  style={{ padding: '0.5rem' }}
                />

                {/* PREVIEW GRID */}
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

              {/* DYNAMIC BADGES CONTROL SECTION */}
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>PRODUCT CARD BADGES &amp; TAGS</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700 }}>
                    <input type="checkbox" checked={productForm.is_new} onChange={e => setProductForm({ ...productForm, is_new: e.target.checked })} /> Show NEW Badge
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700 }}>
                    <input type="checkbox" checked={productForm.is_hot} onChange={e => setProductForm({ ...productForm, is_hot: e.target.checked })} /> Show HOT 🔥
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700 }}>
                    <input type="checkbox" checked={productForm.is_trending} onChange={e => setProductForm({ ...productForm, is_trending: e.target.checked })} /> Show TRENDING
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700 }}>
                    <input type="checkbox" checked={productForm.is_bestseller} onChange={e => setProductForm({ ...productForm, is_bestseller: e.target.checked })} /> BEST SELLER
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Custom Badge Text (e.g. FESTIVE PICK)"
                    value={productForm.custom_badge_text}
                    onChange={e => setProductForm({ ...productForm, custom_badge_text: e.target.value })}
                  />
                  <input
                    type="color"
                    className="form-input"
                    style={{ height: '40px', padding: '0.2rem' }}
                    value={productForm.custom_badge_color}
                    onChange={e => setProductForm({ ...productForm, custom_badge_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Description</label>
                <textarea rows="3" className="form-textarea" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled={uploadingImages}>
                {uploadingImages ? 'UPLOADING IMAGES...' : 'SAVE PRODUCT IN STORE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD BANNER MODAL WITH VISUAL LIVE PREVIEW */}
      {showBannerModal && (
        <div className="modal-overlay" onClick={() => setShowBannerModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <button className="modal-close-btn" onClick={() => setShowBannerModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', fontFamily: 'var(--font-title)' }}>ADD HOMEPAGE HERO BANNER</h3>
            
            {/* VISUAL LIVE PREVIEW BOX */}
            <div style={{ marginBottom: '1.5rem', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--color-primary)', position: 'relative', height: '180px', backgroundColor: '#111' }}>
              <img src={bannerForm.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1.5rem', color: '#fff', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-primary)' }}>LIVE PREVIEW</span>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-title)', margin: '0.25rem 0' }}>{bannerForm.title || 'HERO BANNER TITLE'}</h4>
                <p style={{ fontSize: '0.85rem', color: '#eee', marginBottom: '0.75rem' }}>{bannerForm.subtitle || 'Subtitle information'}</p>
                <button type="button" className="btn-primary" style={{ width: 'fit-content', padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                  {bannerForm.button_text || 'SHOP NOW'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Banner Headline Title</label>
                <input type="text" className="form-input" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle Info</label>
                <input type="text" className="form-input" value={bannerForm.subtitle} onChange={e => setBannerForm({ ...bannerForm, subtitle: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Desktop Image URL</label>
                  <input type="url" className="form-input" value={bannerForm.image_url} onChange={e => setBannerForm({ ...bannerForm, image_url: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Button Destination Link</label>
                  <input type="text" className="form-input" value={bannerForm.button_link} onChange={e => setBannerForm({ ...bannerForm, button_link: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}>PUBLISH HERO BANNER</button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {showCouponModal && (
        <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <button className="modal-close-btn" onClick={() => setShowCouponModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>CREATE SPECIAL OFFER</h3>
            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Promo Code (e.g. FESTIVE20)</label>
                <input type="text" className="form-input" style={{ textTransform: 'uppercase' }} value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select className="form-select" value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Discount Value</label>
                  <input type="number" className="form-input" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Purchase Order Amount (₹)</label>
                <input type="number" className="form-input" value={couponForm.min_order_amount} onChange={e => setCouponForm({ ...couponForm, min_order_amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Target Scope Target</label>
                <select className="form-select" value={couponForm.target_scope} onChange={e => setCouponForm({ ...couponForm, target_scope: e.target.value })}>
                  <option value="all">Entire Store</option>
                  <option value="men">Men's Apparel Only</option>
                  <option value="women">Women's Apparel Only</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}>CREATE OFFER</button>
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
                <label className="form-label">Target Gender</label>
                <select className="form-select" value={collectionForm.gender} onChange={e => setCollectionForm({ ...collectionForm, gender: e.target.value })}>
                  <option value="men">MEN</option>
                  <option value="women">WOMEN</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}>PUBLISH COLLECTION DROP</button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SHOP THE LOOK MODAL */}
      {showLookModal && (
        <div className="modal-overlay" onClick={() => setShowLookModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <button className="modal-close-btn" onClick={() => setShowLookModal(false)}><X size={20} /></button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', fontFamily: 'var(--font-title)' }}>
              ADD SHOP THE LOOK OUTFIT
            </h3>
            <form onSubmit={handleSaveLook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Outfit Title (e.g. Weekend Carnival)</label>
                <input type="text" className="form-input" value={lookForm.name} onChange={e => setLookForm({ ...lookForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Outfit Photo Image URL</label>
                <input type="url" className="form-input" value={lookForm.image_url} onChange={e => setLookForm({ ...lookForm, image_url: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Target Gender</label>
                <select className="form-select" value={lookForm.gender} onChange={e => setLookForm({ ...lookForm, gender: e.target.value })}>
                  <option value="men">MEN</option>
                  <option value="women">WOMEN</option>
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}>PUBLISH OUTFIT LOOK</button>
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
    </div>
  );
};

export default AdminDashboard;
