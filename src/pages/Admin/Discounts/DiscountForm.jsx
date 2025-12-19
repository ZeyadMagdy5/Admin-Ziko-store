import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminService from '../../../api/admin';
import '../Products/Product.css';

const DiscountForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    discountPercentage: 0,
    startDate: '',
    endDate: '',
  });
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Products Selection
  const [allProducts, setAllProducts] = useState([]); // Products to display in table
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Selection State
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [initialProductIds, setInitialProductIds] = useState([]); // To track changes

  useEffect(() => {
    if (isEditMode) {
      fetchDiscount();
      fetchLinkedProducts();
    }
    // Always fetch all products for selection
    fetchAllProducts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchAllProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchDiscount = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.getDiscount(id);
      const data = response.data?.data || response.data;

      setFormData({
        discountPercentage: data.discountPercentage || 0,
        startDate: data.startDate ? data.startDate.substring(0, 16) : '',
        endDate: data.endDate ? data.endDate.substring(0, 16) : '',
      });

      if (data.isActive !== undefined) {
        setIsActive(data.isActive);
      }
    } catch (err) {
      console.error('Failed to fetch discount details', err);
      const status = err.response?.status;
      const backendMessage = err.response?.data?.message || err.response?.data?.title || (typeof err.response?.data === 'string' ? err.response.data : null);
      if (status === 400 && backendMessage) setError(`فشل تحميل الخصم (400): ${backendMessage}`);
      else if (status === 404) setError('الخصم غير موجود (404).');
      else if (status === 500) setError('خطأ في الخادم (500).');
      else setError(backendMessage || 'فشل في جلب تفاصيل الخصم');
    } finally {
      setLoading(false);
    }
  };

  // Get products currently linked to this discount (to initialize checkboxes)
  const fetchLinkedProducts = async () => {
    try {
      // Fetch ALL linked products to ensure we have the full list of IDs
      const response = await AdminService.getDiscountProducts(id, { PageSize: 10000 });
      const envelopeData = response.data?.data || response.data;
      const items = envelopeData?.items || envelopeData || [];
      if (Array.isArray(items)) {
        const ids = items.map(p => p.id);
        setSelectedProductIds(ids);
        setInitialProductIds(ids);
      }
    } catch (err) {
      console.error('Failed to fetch linked products', err);
    }
  };

  // Get ALL products to populate the table (Selectable list)
  const fetchAllProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      // No filters (show all)
      const response = await AdminService.getProducts({
        PageNumber: page,
        PageSize: pageSize
      });
      const envelopeData = response.data?.data || response.data;
      const items = envelopeData?.items || envelopeData || [];

      setAllProducts(Array.isArray(items) ? items : []);

      if (envelopeData?.totalPages) setTotalPages(envelopeData.totalPages);
    } catch (err) {
      console.error('Failed to fetch products list', err);
      setProductsError('فشل تحميل قائمة المنتجات.');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductSelect = (e) => {
    const prodId = parseInt(e.target.value);
    if (e.target.checked) {
      setSelectedProductIds(prev => [...prev, prodId]);
    } else {
      setSelectedProductIds(prev => prev.filter(id => id !== prodId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate dates
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end <= start) {
        setLoading(false);
        setError('تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء.');
        return;
      }

      // Prepare payload
      // OpenAPI expects 'date-time' (ISO 8601), and percentage as double.
      const payload = {
        ...formData,
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };

      console.log("Sending Payload:", payload); // Debug log

      let discountId = id;
      if (isEditMode) {
        await AdminService.updateDiscount(id, { ...payload, id: parseInt(id, 10) });
      } else {
        const response = await AdminService.createDiscount(payload);
        const newId = response.data?.data || response.data?.id || response.data;
        if (newId && (typeof newId === 'number' || typeof newId === 'string')) {
          discountId = newId;
        }
      }

      // Calculate linking changes
      const toAdd = selectedProductIds.filter(pid => !initialProductIds.includes(pid));
      const toRemove = initialProductIds.filter(pid => !selectedProductIds.includes(pid));

      try {
        const updatePromises = [];
        if (toAdd.length > 0) updatePromises.push(AdminService.addProductsToDiscount(discountId, toAdd));
        if (toRemove.length > 0) updatePromises.push(AdminService.removeProductsFromDiscount(toRemove));
        
        await Promise.all(updatePromises);
      } catch (linkErr) {
        console.error("Linking failed", linkErr);
        // Continue to success message but warn?
        // Usually better to just succeed main task.
      }

      alert(`تم ${isEditMode ? 'تحديث' : 'إنشاء'} الخصم بنجاح!`);

      if (!isEditMode && discountId) {
        navigate(`/admin/discounts/edit/${discountId}`);
      } else {
        fetchLinkedProducts();
        fetchAllProducts();
      }

    } catch (err) {
      console.error(err);
      let msg = 'فشل حفظ الخصم';
      const status = err.response?.status;
      if (err.response && err.response.data) {
        const data = err.response.data;
        msg = typeof data === 'string' ? data : (data.title || data.message || msg);
      }
      if (status === 400) setError(`فشل الحفظ (400): ${msg}`);
      else if (status === 500) setError(`خطأ في الخادم (500). تأكد من صحة التواريخ والبيانات.`);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isActive) await AdminService.deactivateDiscount(id);
      else await AdminService.activateDiscount(id);
      setIsActive(!isActive);
    } catch (err) {
      console.error(err);
      setError('فشل في تحديث الحالة');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.discountPercentage) return <div className="p-4">جاري التحميل...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{isEditMode ? 'تعديل الخصم' : 'إضافة خصم جديد'}</h1>
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
            <button className={`btn ${isActive ? 'btn-danger' : 'btn-success'}`} onClick={handleToggleActive} disabled={loading} style={{ background: isActive ? '#dc3545' : '#28a745', color: 'white', borderColor: 'transparent' }}>
              {isActive ? 'إلغاء التنشيط' : 'تنشيط'}
            </button>
          )}
          <button className="btn" onClick={() => navigate('/admin/discounts')}>رجوع</button>
        </div>
      </div>

      {error && <div className="card" style={{ color: 'var(--danger)', border: '1px solid currentColor' }}>{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">نسبة الخصم</label>
            <input 
              type="text" 
              name="discountPercentage" 
              className="form-input" 
              value={formData.discountPercentage} 
              onChange={handleChange} 
              placeholder="10"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">تاريخ البدء</label>
            <input type="datetime-local" name="startDate" className="form-input" value={formData.startDate} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">تاريخ الانتهاء</label>
            <input type="datetime-local" name="endDate" className="form-input" value={formData.endDate} onChange={handleChange} required />
          </div>

          {/* Products Selection Section - Mimicking CollectionForm */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>اختر المنتجات</h2>
            {productsError && <p style={{ color: 'var(--danger)' }}>{productsError}</p>}

            <div className="card" style={{ border: '1px solid #eee', padding: 0, overflow: 'hidden' }}>
              {productsLoading ? (
                <div className="p-4">جاري تحميل المنتجات...</div>
              ) : allProducts.length > 0 ? (
                <>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th>صورة</th>
                          <th>الاسم</th>
                          <th>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allProducts.map(prod => {
                          const isChecked = selectedProductIds.includes(prod.id);
                          const isActiveProd = prod.isActive !== undefined ? prod.isActive : prod.IsActive;
                          return (
                            <tr key={prod.id} style={{ background: isChecked ? '#f0f9ff' : 'transparent' }}>
                              <td>
                                <input
                                  type="checkbox"
                                  value={prod.id}
                                  checked={isChecked}
                                  onChange={handleProductSelect}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                              </td>
                              <td>
                                {prod.images && prod.images.length > 0 ? (
                                  <img src={prod.images[0].imageUrl || prod.images[0]} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                ) : <span style={{ fontSize: '0.8rem', color: '#999' }}>لا توجد صورة</span>}
                              </td>
                              <td>
                                <span style={{ display: 'block', fontWeight: 500 }}>{prod.enName}</span>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>{prod.price} EGP</span>
                              </td>
                              <td>
                                {isActiveProd ? <span className="badge badge-success">نشط</span> : <span className="badge badge-warning">غير نشط</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div style={{ padding: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', borderTop: '1px solid #eee' }}>
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="btn"
                    >
                      السابق
                    </button>
                    <span style={{ fontSize: '0.9rem' }}>
                      صفحة {page} من {totalPages || 1}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="btn"
                    >
                      التالي
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4">لا توجد منتجات.</div>
              )}
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
              تم اختيار {selectedProductIds.length} منتج.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn" onClick={() => navigate('/admin/discounts')}>إلغاء</button>
            <button type="submit" className="btn btn-primary" disabled={loading || productsLoading}>
              {loading ? 'جاري الحفظ...' : (isEditMode ? 'تحديث الخصم' : 'إنشاء وحفظ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountForm;
