import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminService from '../../../api/admin';
import '../Products/Product.css'; // Reuse product styles for consistency
import { getOrderStatusArabic, getStatusBadgeClass, OrderStatusEnum, OrderStatusArabic, getPaymentStatusArabic, PaymentStatusEnum, PaymentStatusArabic } from '../../../utils/statusMapping';
import { mapToAdminOrderVM } from '../../../utils/orderViewModel';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 50; // Increased page size to make client-side filtering more effective

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

      // Send Payment Status to Backend as requested
      if (paymentStatusFilter !== '') {
        params.PaymentStatus = parseInt(paymentStatusFilter);
      }

      const response = await AdminService.getOrders(params);
      const envelopeData = response.data?.data || response.data;

      // Map raw data the ViewModel
      const rawItems = Array.isArray(envelopeData) ? envelopeData : [];
      const viewModels = rawItems.map(mapToAdminOrderVM);

      setOrders(viewModels);
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
  }, [page, createdFrom, createdTo, paymentStatusFilter]); // Added paymentStatusFilter to dependency

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذا الطلب؟ سيتم إزالته من السجلات.')) return;

    // Optimistically remove from UI
    const previousOrders = [...orders];
    setOrders(prev => prev.filter(o => o.id !== id));

    try {
      await AdminService.deleteOrder(id);
      alert('تم الحذف بنجاح');
    } catch (err) {
      console.error("Delete failed", err);
      // Revert if critical error, but if 404 or similar, ignore
      const status = err.response?.status;
      if (status === 404) return; // Already deleted

      setOrders(previousOrders);
      alert('فشل في حذف الطلب. قد يكون مرتبط بيانات أخرى.');
    }
  };

  // Client-Side Filter Logic (Fallback if backend ignores param)
  const filteredOrders = orders.filter(order => {
    if (paymentStatusFilter !== '') {
      return order.paymentStatus === parseInt(paymentStatusFilter);
    }
    return true;
  });

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
            <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.2rem' }}>حالة الدفع</label>
            <select
              className="form-input"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="">كل الحالات</option>
              {/* Payment Status Dropdown */}
              <option value={PaymentStatusEnum.Paid}>{PaymentStatusArabic[PaymentStatusEnum.Paid]}</option>
              <option value={PaymentStatusEnum.Failed}>{PaymentStatusArabic[PaymentStatusEnum.Failed]}</option>
              <option value={PaymentStatusEnum.Unpaid}>{PaymentStatusArabic[PaymentStatusEnum.Unpaid]}</option>
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
                setPaymentStatusFilter('');
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
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>العنوان</th>
                  <th>الحالة</th>
                  <th>حالة الدفع</th>
                  <th>الإجمالي</th>
                  <th>تاريخ الطلب</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.name}</td>
                      <td>{order.phone}</td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.address}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                          {getOrderStatusArabic(order.orderStatus)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(order.paymentStatus, 'payment')}`}>
                          {getPaymentStatusArabic(order.paymentStatus)}
                        </span>
                      </td>
                      <td>{order.finalPrice} ج.م</td>
                      <td>{new Date(order.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td>
                        <Link to={`/admin/orders/view/${order.id}`} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                          تفاصيل
                        </Link>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="btn"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#ef4444', color: 'white' }}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>لا توجد طلبات.</td>
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
