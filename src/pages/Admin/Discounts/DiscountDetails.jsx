import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminService from '../../../api/admin';
import '../Products/Product.css';

const DiscountDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [discount, setDiscount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Products & Pagination
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchDiscount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch products when page or id changes
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page]);

  const fetchDiscount = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.getDiscount(id);
      setDiscount(response.data?.data || response.data);
    } catch (err) {
      console.error('Failed to fetch discount details', err);

      const status = err.response?.status;
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : null);

      if (status === 400 && backendMessage) {
        setError(`فشل جلب تفاصيل الخصم (400): ${backendMessage}`);
      } else if (status === 404) {
        setError('الخصم غير موجود (404).');
      } else if (status === 500) {
        setError('خطأ في الخادم (500).');
      } else {
        setError(backendMessage || 'فشل في جلب تفاصيل الخصم');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const response = await AdminService.getDiscountProducts(id, {
        PageNumber: page,
        PageSize: pageSize
      });
      const envelopeData = response.data?.data || response.data;
      const items = envelopeData?.items || envelopeData || [];

      setProducts(Array.isArray(items) ? items : []);

      // Update pagination info if available
      if (envelopeData?.totalPages) setTotalPages(envelopeData.totalPages);
      if (envelopeData?.totalCount) setTotalCount(envelopeData.totalCount);

    } catch (err) {
      console.error('Failed to fetch products for discount', err);

      const status = err.response?.status;
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : null);

      if (status === 400 && backendMessage) {
        setProductsError(`فشل تحميل المنتجات (400): ${backendMessage}`);
      } else if (status === 500) {
        setProductsError('خطأ في الخادم (500).');
      } else if (err.code === 'ERR_NETWORK') {
        setProductsError('خطأ في الشبكة.');
      } else {
        setProductsError(backendMessage || 'فشل تحميل المنتجات.');
      }
    } finally {
      setProductsLoading(false);
    }
  };

  if (loading) return <div className="p-4">جاري تحميل تفاصيل الخصم...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!discount) return <div className="p-4">الخصم غير موجود.</div>;

  const isActive = discount.isActive !== undefined ? discount.isActive : discount.IsActive;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <button
            className="btn"
            onClick={() => navigate('/admin/discounts')}
            style={{ marginBottom: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
          >
            &larr; الرجوع للقائمة
          </button>
          <h1 className="page-title">تفاصيل الخصم</h1>
          <div style={{ marginTop: '0.5rem' }}>
            {isActive ? (
              <span className="badge badge-success">نشط</span>
            ) : (
              <span className="badge badge-warning">غير نشط</span>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              نسبة الخصم
            </h3>
            <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>{discount.discountPercentage}%</p>
          </div>
          <div>
            <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              تاريخ البدء
            </h3>
            <p style={{ fontSize: '1.0rem' }}>{discount.startDate ? new Date(discount.startDate).toLocaleString('ar-EG') : '-'}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              تاريخ الانتهاء
            </h3>
            <p style={{ fontSize: '1.0rem' }}>{discount.endDate ? new Date(discount.endDate).toLocaleString('ar-EG') : '-'}</p>
          </div>
        </div>

        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            المنتجات المشمولة بهذا الخصم
          </h3>
          {productsError && (
            <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{productsError}</p>
          )}

          {productsLoading ? (
            <div className="p-4">جاري تحميل المنتجات...</div>
          ) : products.length > 0 ? (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>صورة</th>
                      <th>الاسم (إنجليزي)</th>
                      <th>الاسم (عربي)</th>
                      <th>السعر</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const isActiveProduct = product.isActive !== undefined ? product.isActive : product.IsActive;
                      return (
                        <tr key={product.id}>
                          <td>
                            {product.images && product.images.length > 0 ? (
                              <div className="product-thumb">
                                <img src={product.images[0].imageUrl || product.images[0]} alt={product.enName} />
                              </div>
                            ) : (
                              <div className="product-thumb-placeholder">لا توجد صورة</div>
                            )}
                          </td>
                          <td>{product.enName}</td>
                          <td>{product.arName}</td>
                          <td>{product.price}</td>
                          <td>
                            {isActiveProduct ? (
                              <span className="badge badge-success">نشط</span>
                            ) : (
                              <span className="badge badge-warning">غير نشط</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                <button
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
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="btn"
                >
                  التالي
                </button>
              </div>
            </>
          ) : !productsError ? (
            <p className="text-muted">لا توجد منتجات مرتبطة حاليًا بهذا الخصم.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DiscountDetails;
