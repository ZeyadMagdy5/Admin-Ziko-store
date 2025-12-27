import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminService from '../../../api/admin';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    arName: '',
    enName: '',
    arDescription: '',
    enDescription: '',
    price: 0
  });

  // Track initial price to detect changes
  const [initialPrice, setInitialPrice] = useState(0);

  const [isActive, setIsActive] = useState(false);
  const [images, setImages] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
    }
    return () => {
      pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [id]);

  // Helper to convert URL to File object
  const urlToFile = async (url, filename, mimeType) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: mimeType });
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.getProduct(id);
      const product = response.data?.data || response.data;

      setFormData({
        arName: product.arName || '',
        enName: product.enName || '',
        arDescription: product.arDescription || '',
        enDescription: product.enDescription || '',
        price: product.price || 0,
      });
      setInitialPrice(product.price || 0);

      if (product.images) setImages(product.images);
      if (product.isActive !== undefined) setIsActive(product.isActive);
    } catch (err) {
      console.error('Failed to fetch product details', err);
      const status = err.response?.status;
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : null);

      if (status === 400 && backendMessage) {
        setError(`فشل تحميل المنتج (400): ${backendMessage}`);
      } else if (status === 404) {
        setError('المنتج غير موجود (404).');
      } else if (status === 500) {
        setError('خطأ في الخادم (500).');
      } else {
        setError(backendMessage || 'فشل في جلب تفاصيل المنتج.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanPrice = formData.price ? Number(formData.price.toString().replace(/[^0-9.]/g, '')) : 0;



    try {
      let productId = id;
      if (isEditMode) {
        const cleanPrice = formData.price ? Number(formData.price.toString().replace(/[^0-9.]/g, '')) : 0;
        await AdminService.updateProduct(id, {
          ...formData,
          price: cleanPrice,
          Price: cleanPrice,
          id: parseInt(id)
        });
      } else {
        const cleanPrice = formData.price ? Number(formData.price.toString().replace(/[^0-9.]/g, '')) : 0;
        const response = await AdminService.createProduct({
          ...formData,
          price: cleanPrice,
          Price: cleanPrice
        });
        const newId = response.data?.data || response.data?.id || response.data;

        if (newId && (typeof newId === 'number' || typeof newId === 'string')) {
          productId = newId;
        } else {
          navigate('/admin/products');
          return;
        }
      }

      if (pendingImages.length > 0) {
        const data = new FormData();
        pendingImages.forEach(p => {
          data.append('images', p.file);
        });
        await AdminService.addProductImages(productId, data);
      }

      setPendingImages([]);
      alert(`تم ${isEditMode ? 'تحديث' : 'إنشاء'} المنتج بنجاح!`);

      if (!isEditMode) {
        navigate(`/admin/products/edit/${productId}`);
      } else {
        // Force refresh data from server to show updated state
        await fetchProduct();
      }

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || 'فشل حفظ المنتج';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };



  const handleFileSelect = (e) => {
    if (!e.target.files.length) return;
    const files = Array.from(e.target.files);

    const newPending = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setPendingImages(prev => [...prev, ...newPending]);
    e.target.value = '';
  };

  const handleRemovePendingImage = (index) => {
    setPendingImages(prev => {
      const newArr = [...prev];
      URL.revokeObjectURL(newArr[index].preview);
      newArr.splice(index, 1);
      return newArr;
    });
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('حذف هذه الصورة؟')) return;
    try {
      await AdminService.deleteProductImage(id, imageId);
      fetchProduct();
    } catch (e) {
      alert('فشل في حذف الصورة');
    }
  };

  const handleToggleActive = async () => {
    try {
      setLoading(true);
      if (isActive) {
        await AdminService.deactivateProduct(id);
      } else {
        await AdminService.activateProduct(id);
      }
      setIsActive(!isActive);
      alert(`تم ${!isActive ? 'تنشيط' : 'إلغاء تنشيط'} المنتج بنجاح!`);
    } catch (err) {
      alert('فشل في تحديث الحالة');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.enName) {
    return <div className="p-4">جاري التحميل...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{isEditMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h1>
          {isEditMode && (
            <div style={{ marginTop: '0.5rem' }}>
              <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: isActive ? '#d4edda' : '#f8d7da', color: isActive ? '#155724' : '#721c24' }}>
                {isActive ? 'نشط' : 'غير نشط'}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {isEditMode && (
            <>

              <button
                type="button"
                className={`btn ${isActive ? 'btn-warning' : 'btn-success'}`}
                onClick={handleToggleActive}
                disabled={loading}
                style={{ background: isActive ? '#f59e0b' : '#28a745', color: 'white', borderColor: 'transparent' }}
              >
                {isActive ? 'إلغاء التنشيط' : 'تنشيط'}
              </button>
            </>
          )}
          <button className="btn" onClick={() => navigate('/admin/products')}>رجوع</button>
        </div>
      </div>

      {error && <div className="card" style={{ color: 'var(--danger)', border: '1px solid currentColor' }}>{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">الاسم (إنجليزي)</label>
            <input
              name="enName"
              className="form-input"
              value={formData.enName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">الاسم (عربي)</label>
            <input
              name="arName"
              className="form-input"
              value={formData.arName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">السعر</label>
            <input
              name="price"
              type="text"
              className="form-input"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">الوصف (إنجليزي)</label>
            <textarea
              name="enDescription"
              className="form-textarea"
              rows="4"
              value={formData.enDescription}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">الوصف (عربي)</label>
            <textarea
              name="arDescription"
              className="form-textarea"
              rows="4"
              value={formData.arDescription}
              onChange={handleChange}
            />
          </div>

          <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>صور المنتج</h2>

            <div className="form-group">
              <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                اختيار صور
                <input type="file" multiple accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
              <span style={{ marginRight: '1rem', color: '#666', fontSize: '0.9rem' }}>
                {pendingImages.length > 0 ? `تم اختيار ${pendingImages.length} صورة جديدة` : 'اختر صورًا للرفع عند الحفظ.'}
              </span>
            </div>

            {pendingImages.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#6366f1' }}>صور قيد الرفع (غير محفوظة)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                  {pendingImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: '0 0 0 2px #6366f1' }}>
                      <img src={img.preview} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', opacity: 0.8 }} />
                      <button
                        type="button"
                        onClick={() => handleRemovePendingImage(idx)}
                        style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {images.length > 0 && (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>الصور الحالية</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                  {images.map((img, idx) => (
                    <div key={img.id || idx} style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                      <img src={typeof img === 'string' ? img : img.imageUrl} alt="Product" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="حذف فوري"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn" onClick={() => navigate('/admin/products')}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'جاري الحفظ...' : (isEditMode ? 'تحديث المنتج' : 'إنشاء وحفظ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
