import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminService from '../../../api/admin';
import '../Products/Product.css'; // Reuse product styles for consistency
import { getOrderStatusArabic, getStatusBadgeClass, OrderStatusEnum, OrderStatusArabic } from '../../../utils/statusMapping';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [createdFrom, setCreatedFrom] = useState('');
    const [createdTo, setCreatedTo] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const fetchOrders = async () => {
        try {
            setLoading(true);
            // Construct params
            const params = {
                Page: page,
                PageSize: pageSize,
            };

            if (createdFrom) params.CreatedFrom = new Date(createdFrom).toISOString();
            if (createdTo) params.CreatedTo = new Date(createdTo).toISOString();
            if (status !== '') params.Status = status;

            const response = await AdminService.getOrders(params);
            const envelopeData = response.data?.data || response.data;
            setOrders(Array.isArray(envelopeData) ? envelopeData : []);
            setError(null);
        } catch (err) {
            console.error(err);
            const backendMessage = err.response?.data?.message || err.message;
            setError(backendMessage || 'فشل جلب الطلبات');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, createdFrom, createdTo, status]);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">الطلبات</h1>
            </div>

            <div className="card">
                {/* Filters */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>من تاريخ</label>
                        <input
                            type="date"
                            className="form-input"
                            value={createdFrom}
                            onChange={(e) => setCreatedFrom(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>إلى تاريخ</label>
                        <input
                            type="date"
                            className="form-input"
                            value={createdTo}
                            onChange={(e) => setCreatedTo(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>الحالة</label>
                        <select
                            className="form-input"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ minWidth: '150px' }}
                        >
                            <option value="">الكل</option>
                            {Object.keys(OrderStatusEnum).map((key) => (
                                <option key={key} value={OrderStatusEnum[key]}>
                                    {OrderStatusArabic[key]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ alignSelf: 'end' }}>
                        <button className="btn btn-primary" onClick={fetchOrders}>بحث</button>
                        <button
                            className="btn"
                            style={{ marginRight: '0.5rem', backgroundColor: '#6b7280', color: 'white' }}
                            onClick={() => {
                                setCreatedFrom('');
                                setCreatedTo('');
                                setStatus('');
                                setPage(1);
                            }}
                        >
                            إعادة تعيين
                        </button>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="table-container">
                    {loading ? (
                        <div className="p-4 text-center">جاري تحميل الطلبات...</div>
                    ) : error ? (
                        <div className="p-4 text-center text-red-500">{error}</div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>رقم الطلب</th>
                                    <th>الهاتف</th>
                                    <th>العنوان</th>
                                    <th>الحالة</th>
                                    <th>الإجمالي</th>
                                    <th>تاريخ الطلب</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id}>
                                            <td>#{order.id}</td>
                                            <td>{order.phone}</td>
                                            <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {order.address}
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                                    {getOrderStatusArabic(order.status)}
                                                </span>
                                            </td>
                                            <td>{order.finalPrice} ج.م</td>
                                            <td>{new Date(order.createdAt).toLocaleDateString('ar-EG')}</td>
                                            <td>
                                                <Link to={`/admin/orders/view/${order.id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                                                    تفاصيل
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>لا توجد طلبات.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination - Simple */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="btn"
                    >
                        السابق
                    </button>
                    <span style={{ alignSelf: 'center' }}>صفحة {page}</span>
                    <button
                        disabled={orders.length < pageSize} // Naive check if we don't have total count
                        onClick={() => setPage(p => p + 1)}
                        className="btn"
                    >
                        التالي
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderList;
