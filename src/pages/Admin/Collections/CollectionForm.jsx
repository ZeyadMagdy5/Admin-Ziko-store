
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminService from '../../../api/admin';

const CollectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    arName: '',
    enName: '',
    arDescription: '',
    enDescription: ''
  });

  const [isActive, setIsActive] = useState(false);

  // Server images
  const [images, setImages] = useState([]);

  // Pending images (File objects + preview URLs)
  const [pendingImages, setPendingImages] = useState([]);

  // Products
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [initialProductIds, setInitialProductIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchCollection();
    }
    fetchProducts();
    return () => {
      pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.getCollection(id);
      const data = response.data?.data || response.data;
      setFormData({
        arName: data.arName || '',
        enName: data.enName || '',
        arDescription: data.arDescription || '',
        enDescription: data.enDescription || ''
      });
      if (data.images) setImages(data.images);
      if (data.isActive !== undefined) setIsActive(data.isActive);

      // If backend returns products for this collection, pre-select them
      if (Array.isArray(data.products)) {
        const ids = data.products
          .map(p => p.id)
          .filter((pid) => pid !== undefined && pid !== null);
        setSelectedProductIds(ids);
        setInitialProductIds(ids);
      }
    } catch (err) {
      console.error('Failed to fetch collection details', err);

      const status = err.response?.status;
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : null);

      if (status === 400 && backendMessage) {
        setError(`فشل تحميل التشكيلة (400): ${backendMessage}`);
      } else if (status === 404) {
        setError('التشكيلة غير موجودة (404).');
      } else if (status === 500) {
        setError('خطأ في الخادم (500).');
      } else {
        setError(backendMessage || 'فشل في جلب تفاصيل التشكيلة');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Load ALL products so we can show and link active + inactive,
      // and display their status next to each checkbox.
      const response = await AdminService.getProducts({ PageSize: 1000 });
      const envelopeData = response.data?.data || response.data;
      const items = envelopeData?.items || envelopeData || [];
      setAllProducts(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Failed to fetch products", err);
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

    try {
      let collectionId = id;
      if (isEditMode) {
        await AdminService.updateCollection(id, { ...formData, id: parseInt(id) });
      } else {
        const response = await AdminService.createCollection(formData);
        // Assuming same Create response ID structure as Product
        const newId = response.data?.data || response.data?.id || response.data;
        if (newId && (typeof newId === 'number' || typeof newId === 'string')) {
          collectionId = newId;
        } else {
          navigate('/admin/collections');
          return;
        }
      }

      // Handle Pending Images Upload
      if (pendingImages.length > 0) {
        const data = new FormData();
        pendingImages.forEach(p => {
          data.append('images', p.file);
        });
        await AdminService.addCollectionImages(collectionId, data);
      }

      // Handle Product Linking via collection endpoints
      // Calculate which products to add to this collection and which to remove
      const toAdd = selectedProductIds.filter(
        (pid) => !initialProductIds.includes(pid)
      );
      const toRemove = isEditMode
        ? initialProductIds.filter((pid) => !selectedProductIds.includes(pid))
        : [];

      try {
        if (toAdd.length > 0) {
          await AdminService.addProductsToCollection(collectionId, toAdd);
        }
        if (toRemove.length > 0) {
          await AdminService.removeProductsFromCollection(collectionId, toRemove);
        }
      } catch (linkErr) {
        console.error('Failed to update collection products', linkErr);
        // Don't block the main success message, but surface a warning
        alert('تم حفظ التشكيلة، ولكن حدثت بعض المشاكل في تحديث المنتجات المرتبطة. راجع وحدة التحكم.');
      }

      alert(`تم ${isEditMode ? 'تحديث' : 'إنشاء'} التشكيلة بنجاح!`);

      if (!isEditMode) {
        navigate(`/admin/collections/edit/${collectionId}`);
      } else {
        setPendingImages([]);
        setSelectedProductIds([]); // Clear selection after add
        fetchCollection();
        fetchProducts(); // Refresh to see changes if any
      }

    } catch (err) {
      console.error(err);
      let msg = 'فشل في حفظ التشكيلة';
      const status = err.response?.status;
      if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === 'string') {
          msg = data;
        } else if (data.errors) {
          msg = Object.values(data.errors).flat().join(', ');
        } else if (data.message) {
          msg = data.message;
        } else if (data.title) {
          msg = data.title;
        }
      }

      if (status === 400) {
        setError(`فشل الحفظ (400): ${msg}`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };



  const handleProductSelect = (e) => {
    const prodId = parseInt(e.target.value);
    if (e.target.checked) {
      setSelectedProductIds(prev => [...prev, prodId]);
    } else {
      setSelectedProductIds(prev => prev.filter(id => id !== prodId));
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
      await AdminService.deleteCollectionImage(id, imageId);
      fetchCollection();
    } catch {
      alert('فشل في حذف الصورة');
    }
  };

  const handleToggleActive = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isActive) {
        await AdminService.deactivateCollection(id);
      } else {
        await AdminService.activateCollection(id);
      }
      setIsActive(!isActive);
    } catch (err) {
      console.error('Failed to update collection status', err);

      const status = err.response?.status;
      const data = err.response?.data;
      let msg = 'فشل في تحديث الحالة';

      if (typeof data === 'string') {
        msg = data;
      } else if (data?.message) {
        msg = data.message;
      } else if (data?.title) {
        msg = data.title;
      }

      if (status === 400) {
        setError(`فشل التحديث (400): ${msg}`);
      } else {
        setError(msg);
      }
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
          <h1 className="page-title">{isEditMode ? 'تعديل التشكيلة' : 'إضافة تشكيلة جديدة'}</h1>
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
            <button
              className={`btn ${isActive ? 'btn-danger' : 'btn-success'}`}
              onClick={handleToggleActive}
              disabled={loading}
              style={{ background: isActive ? '#dc3545' : '#28a745', color: 'white', borderColor: 'transparent' }}
            >
              {isActive ? 'إلغاء التنشيط' : 'تنشيط'}
            </button>
          )}
          <button className="btn" onClick={() => navigate('/admin/collections')}>رجوع</button>
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>صور التشكيلة</h2>

            <div className="form-group">
              <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                اختيار صور
                <input type="file" multiple accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
              <span style={{ marginRight: '1rem', color: '#666', fontSize: '0.9rem' }}>
                {pendingImages.length > 0 ? `تم اختيار ${pendingImages.length} صورة` : 'اختر صورًا للرفع عند الحفظ.'}
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
                      <img src={typeof img === 'string' ? img : img.imageUrl} alt="Collection" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>إضافة منتجات</h2>
            <div className="card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <div className="form-group">
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>اختر منتجات لإضافتها لهذه التشكيلة:</p>
                {allProducts.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {allProducts.map(prod => (
                      <label key={prod.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.25rem', border: '1px solid #eee', borderRadius: '4px' }}>
                        <input
                          type="checkbox"
                          value={prod.id}
                          checked={selectedProductIds.includes(prod.id)}
                          onChange={handleProductSelect}
                        />
                        {prod.images && prod.images.length > 0 && (prod.images[0].imageUrl || prod.images[0]) && (
                          <img src={prod.images[0].imageUrl || prod.images[0]} alt="" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                        <span style={{ fontSize: '0.9rem' }}>{prod.enName}</span>
                        <span style={{ marginRight: 'auto', fontSize: '0.75rem' }}>
                          {prod.isActive || prod.IsActive ? (
                            <span className="badge badge-success">نشط</span>
                          ) : (
                            <span className="badge badge-warning">غير نشط</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p>لا توجد منتجات نشطة.</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn" onClick={() => navigate('/admin/collections')}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'جاري الحفظ...' : (isEditMode ? 'تحديث التشكيلة' : 'إنشاء وحفظ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionForm;
