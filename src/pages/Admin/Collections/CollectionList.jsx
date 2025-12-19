import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminService from '../../../api/admin';
import '../Products/Product.css'; // Reuse product styles for table and badges

const CollectionList = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const params = {
        PageNumber: page,
        PageSize: 50,
        SearchName: search || undefined,
      };

      if (filterStatus === 'active') {
        params.IsActive = true;
      } else if (filterStatus === 'inactive') {
        params.IsActive = false;
      }

      const response = await AdminService.getCollections(params);
      // Handle Envelope: response.data = { success: true, data: { items: [...] } or [...] }
      const envelopeData = response.data?.data || response.data;
      const items = envelopeData?.items || envelopeData || [];
      setCollections(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : null);

      if (status === 400 && backendMessage) {
        setError(`فشل في جلب التشكيلات (400): ${backendMessage}`);
      } else if (status === 404) {
        setCollections([]);
      } else if (status === 500) {
        setError('خطأ في الخادم (500). يرجى التحقق من تشغيل الواجهة الخلفية.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('خطأ في الشبكة. تعذر الوصول للواجهة الخلفية.');
      } else {
        setError(backendMessage || err.message || 'فشل في جلب التشكيلات');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [page, search, filterStatus]);

    const handleToggleStatus = async (id, newStatus) => {
        try {
            // Optimistic Update
            setCollections(prev => prev.map(c => {
                if (c.id !== id) return c;
                return { ...c, isActive: newStatus, IsActive: newStatus };
            }));

            if (newStatus) {
                await AdminService.activateCollection(id);
            } else {
                await AdminService.deactivateCollection(id);
            }
        } catch (err) {
            console.error(err);
            alert(`فشل في ${newStatus ? 'تنشيط' : 'إلغاء تنشيط'} التشكيلة.`);
            fetchCollections();
        }
    };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذه التشكيلة نهائيًا؟ سيتم فك ارتباط المنتجات وحذف الصور المرتبطة.')) return;
    
    // Optimistic UI update could be risky here if it fails, so we'll wait.
    // Ensure we show loading or some indication? For now just async await.
    
    try {
      // 1. Fetch details to find dependencies
      const detailsRes = await AdminService.getCollection(id);
      const data = detailsRes.data?.data || detailsRes.data;

      // 2. Deactivate (Best practice before delete)
      try { await AdminService.deactivateCollection(id); } catch (e) { /* ignore if already inactive */ }

      // 3. Remove Products associations
      const products = data.products || [];
      if (products.length > 0) {
          const pids = products.map(p => p.id);
          await AdminService.removeProductsFromCollection(pids);
      }

      // 4. Remove Images
      const images = data.images || [];
      if (images.length > 0) {
          // Delete sequentially to avoid overwhelming server or parallel with Promise.all
          await Promise.all(images.map(img => AdminService.deleteCollectionImage(id, img.id).catch(() => {})));
      }

      // 5. Finally Delete Collection
      await AdminService.deleteCollection(id);
      
      setCollections(prev => prev.filter(c => c.id !== id));
      alert('تم حذف التشكيلة بنجاح.');
      
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || err.response?.data || err.message;
      alert(`فشل في حذف التشكيلة (حاول مرة أخرى): ${backendMessage}`);
      fetchCollections(); // Refresh list to be safe
    }
  };

  if (loading && collections.length === 0) {
    return <div className="p-4">جاري تحميل التشكيلات...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">التشكيلات</h1>
        <Link to="/admin/collections/new" className="btn btn-primary">
          + إضافة تشكيلة
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ maxWidth: '400px', flex: 1, marginBottom: 0 }}>
            <input
              type="text"
              className="form-input"
              placeholder="بحث في التشكيلات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
        </div>

        <div className="table-container" style={{ marginTop: '1.5rem' }}>
          <table>
            <thead>
              <tr>
                <th>صورة</th>
                <th>الاسم (إنجليزي)</th>
                <th>الاسم (عربي)</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {collections.length > 0 ? (
                collections.map((collection) => {
                  const isActive = collection.isActive !== undefined ? collection.isActive : collection.IsActive;
                  return (
                    <tr key={collection.id}>
                      <td>
                        {collection.images && collection.images.length > 0 ? (
                          <div className="product-thumb">
                            <img src={collection.images[0].imageUrl || collection.images[0]} alt={collection.enName} />
                          </div>
                        ) : (
                          <div className="product-thumb-placeholder">لا توجد صورة</div>
                        )}
                      </td>
                      <td>{collection.enName}</td>
                      <td>{collection.arName}</td>
                      <td>
                        {isActive ? (
                          <span className="badge badge-success">نشط</span>
                        ) : (
                          <span className="badge badge-warning">غير نشط</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link to={`/admin/collections/view/${collection.id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#6366f1' }}>
                            عرض
                          </Link>
                          <Link to={`/admin/collections/edit/${collection.id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                            تعديل
                          </Link>
                          {isActive ? (
                            <button onClick={() => handleToggleStatus(collection.id, false)} className="btn btn-warning" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#f59e0b', color: 'white' }}>
                              إلغاء التنشيط
                            </button>
                          ) : (
                            <button onClick={() => handleToggleStatus(collection.id, true)} className="btn btn-success" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#10b981' }}>
                              تنشيط
                            </button>
                          )}
                          <button onClick={() => handleDelete(collection.id)} className="delete-btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#ef4444' }} title="حذف نهائي">
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>لا توجد تشكيلات.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn">السابق</button>
          <span style={{ alignSelf: 'center' }}>صفحة {page}</span>
          <button onClick={() => setPage(p => p + 1)} className="btn">التالي</button>
        </div>
      </div>
    </div>
  );
};

export default CollectionList;
