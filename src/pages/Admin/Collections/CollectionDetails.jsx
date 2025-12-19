import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminService from '../../../api/admin';
import '../Products/Product.css';

const CollectionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);
    const [productsError, setProductsError] = useState(null);

    useEffect(() => {
        const fetchCollection = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await AdminService.getCollection(id);
                setCollection(response.data?.data || response.data);
            } catch (err) {
                console.error('Failed to fetch collection details', err);

                const status = err.response?.status;
                const backendMessage =
                    err.response?.data?.message ||
                    err.response?.data?.title ||
                    (typeof err.response?.data === 'string' ? err.response.data : null);

                if (status === 400 && backendMessage) {
                    setError(`فشل جلب تفاصيل التشكيلة (400): ${backendMessage}`);
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
                setProductsError(null);
                const response = await AdminService.getProducts({ CollectionId: id, PageSize: 1000 });
                const envelopeData = response.data?.data || response.data;
                const items = envelopeData?.items || envelopeData || [];
                setProducts(Array.isArray(items) ? items : []);
            } catch (err) {
                console.error('Failed to fetch products for collection', err);
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
            }
        };

        fetchCollection();
        fetchProducts();
    }, [id]);

    if (loading) return <div className="p-4">جاري تحميل تفاصيل التشكيلة...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!collection) return <div className="p-4">التشكيلة غير موجودة</div>;

    const isActive = collection.isActive !== undefined ? collection.isActive : collection.IsActive;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <button className="btn" onClick={() => navigate('/admin/collections')} style={{ marginBottom: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                        &larr; الرجوع للقائمة
                    </button>
                    <h1 className="page-title">{collection.enName}</h1>
                    <div style={{ marginTop: '0.5rem' }}>
                        {isActive ? (
                            <span className="badge badge-success">نشط</span>
                        ) : (
                            <span className="badge badge-warning">غير نشط</span>
                        )}
                    </div>
                </div>
                <Link to={`/admin/collections/edit/${collection.id}`} className="btn btn-primary">
                    تعديل التشكيلة
                </Link>
            </div>

            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>الاسم (إنجليزي)</h3>
                        <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>{collection.enName}</p>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>الاسم (عربي)</h3>
                        <p style={{ fontSize: '1.125rem', fontWeight: 500, fontFamily: 'Tahoma, sans-serif' }}>{collection.arName || '-'}</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>الوصف (إنجليزي)</h3>
                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{collection.enDescription || '-'}</p>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>الوصف (عربي)</h3>
                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontFamily: 'Tahoma, sans-serif' }}>{collection.arDescription || '-'}</p>
                    </div>
                </div>

                <div style={{ marginTop: '3rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>الصور</h3>
                    {collection.images && collection.images.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {collection.images.map((img, idx) => (
                                <div key={idx} style={{ borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', aspectRatio: '1' }}>
                                    <a href={img.imageUrl || img} target="_blank" rel="noopener noreferrer">
                                        <img src={img.imageUrl || img} alt={collection.enName} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">لا توجد صور متاحة لهذه التشكيلة.</p>
                    )}
                </div>

                <div style={{ marginTop: '3rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>المنتجات في هذه التشكيلة</h3>
                    {productsError && (
                        <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{productsError}</p>
                    )}
                    {products.length > 0 ? (
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
                    ) : !productsError ? (
                        <p className="text-muted">لا توجد منتجات مرتبطة حاليًا بهذه التشكيلة.</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CollectionDetails;
