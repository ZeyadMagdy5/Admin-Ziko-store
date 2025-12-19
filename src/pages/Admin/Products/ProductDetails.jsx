import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminService from '../../../api/admin';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.getProduct(id);
      setProduct(response.data?.data || response.data);
    } catch (err) {
      console.error('Failed to load product details', err);

      const status = err.response?.status;
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : null);

      if (status === 400 && backendMessage) {
        setError(`فشل تحميل تفاصيل المنتج (400): ${backendMessage}`);
      } else if (status === 404) {
        setError('المنتج غير موجود (404).');
      } else if (status === 500) {
        setError('خطأ في الخادم (500).');
      } else {
        setError(backendMessage || 'فشل في تحميل تفاصيل المنتج.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">جاري تحميل التفاصيل...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!product) return <div className="p-4">المنتج غير موجود.</div>;

  const isActive = product.isActive !== undefined ? product.isActive : product.IsActive;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">تفاصيل المنتج</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/admin/products/edit/${id}`)}
          >
            تعديل
          </button>
          <button className="btn" onClick={() => navigate('/admin/products')}>الرجوع للقائمة</button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

          {/* Details Section */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 'bold' }}>الحالة</label>
              <div>
                {isActive ? (
                  <span className="badge badge-success">نشط</span>
                ) : (
                  <span className="badge badge-warning">غير نشط</span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 'bold' }}>الاسم (إنجليزي)</label>
              <p className="form-input" style={{ background: '#f9fafb', border: 'none' }}>{product.enName || '-'}</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 'bold' }}>الاسم (عربي)</label>
              <p className="form-input" style={{ background: '#f9fafb', border: 'none' }}>{product.arName || '-'}</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 'bold' }}>السعر</label>
              <p className="form-input" style={{ background: '#f9fafb', border: 'none' }}>{product.price}</p>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 'bold' }}>الوصف (إنجليزي)</label>
              <div className="form-textarea" style={{ background: '#f9fafb', border: 'none', minHeight: '80px' }}>
                {product.enDescription || '-'}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 'bold' }}>الوصف (عربي)</label>
              <div className="form-textarea" style={{ background: '#f9fafb', border: 'none', minHeight: '80px' }}>
                {product.arDescription || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Images Gallery */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>صور المنتج</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {product.images && product.images.length > 0 ? (
            product.images.map((img, idx) => (
              <div key={img.id || idx} style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <img
                  src={img.imageUrl}
                  alt={`Product ${idx}`}
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  onClick={() => window.open(img.imageUrl, '_blank')}
                  title="اضغط للعرض بالحجم الكامل"
                />
              </div>
            ))
          ) : (
            <p className="text-muted">لا توجد صور متاحة لهذه المنتج.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
