import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminService from '../../../api/admin';
import './Product.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchProducts = async () => {
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

      const response = await AdminService.getProducts(params);
      // Handle Envelope
      const envelopeData = response.data?.data || response.data;
      const items = envelopeData?.items || envelopeData || [];
      setProducts(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : null);

      if (status === 400 && backendMessage) {
        setError(`فشل جلب المنتجات (400): ${backendMessage}`);
      } else if (status === 404) {
        setProducts([]);
      } else if (status === 500) {
        setError('خطأ في الخادم (500). يرجى التحقق من تشغيل الواجهة الخلفية.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('خطأ في الشبكة. تعذر الوصول للواجهة الخلفية.');
      } else {
        setError(backendMessage || err.message || 'فشل جلب المنتجات');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, filterStatus]);

  const handleToggleStatus = async (id, newStatus) => {
    try {
      // Optimistic Update
      setProducts(prev => prev.map(p => {
        if (p.id !== id) return p;
        return { ...p, isActive: newStatus, IsActive: newStatus };
      }));

      if (newStatus) {
        await AdminService.activateProduct(id);
      } else {
        await AdminService.deactivateProduct(id);
      }

      // Optional: Re-fetch to ensure sync, but optimistic is usually enough for UX
      // setTimeout(fetchProducts, 500); 
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || err.response?.data || err.message;
      alert(`فشل في ${newStatus ? 'تنشيط' : 'إلغاء تنشيط'} المنتج: ${backendMessage}`);
      fetchProducts(); // Revert on error
    }
  };



  if (loading && products.length === 0) {
    return <div className="p-4">جاري تحميل المنتجات...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">المنتجات</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          + إضافة منتج
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ maxWidth: '400px', flex: 1, marginBottom: 0 }}>
            <input
              type="text"
              className="form-input"
              placeholder="بحث في المنتجات..."
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
                <th>السعر</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => {
                  const isActive = product.isActive !== undefined ? product.isActive : product.IsActive;
                  return (
                    <tr key={product.id}>
                      <td>
                        {product.images && product.images.length > 0 ? (
                          <div className="product-thumb">
                            <img src={product.images[0].imageUrl} alt={product.enName} />
                          </div>
                        ) : (
                          <div className="product-thumb-placeholder">لا توجد صورة</div>
                        )}
                      </td>
                      <td>{product.enName}</td>
                      <td>{product.arName}</td>
                      <td>{product.price}</td>
                      <td>
                        {isActive ? (
                          <span className="badge badge-success">نشط</span>
                        ) : (
                          <span className="badge badge-warning">غير نشط</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link to={`/admin/products/view/${product.id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#e063f1ff' }}>
                            عرض
                          </Link>
                          <Link to={`/admin/products/edit/${product.id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                            تعديل
                          </Link>
                          {isActive ? (
                            <button onClick={() => handleToggleStatus(product.id, false)} className="btn btn-warning" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#f59e0b', color: 'white' }}>
                              إلغاء التنشيط
                            </button>
                          ) : (
                            <button onClick={() => handleToggleStatus(product.id, true)} className="btn btn-success" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#10b981' }}>
                              تنشيط
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>لا توجد منتجات.</td>
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

export default ProductList;
