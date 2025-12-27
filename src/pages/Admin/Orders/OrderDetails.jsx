import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminService from '../../../api/admin';
import '../Products/Product.css'; // Reusing styles
import {
  getOrderStatusArabic,
  getPaymentStatusArabic,
  getStatusBadgeClass,
  OrderStatusEnum,
  OrderStatusArabic
} from '../../../utils/statusMapping';
import { mapToAdminOrderVM } from '../../../utils/orderViewModel';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update Status State
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await AdminService.getOrder(id);
        const data = response.data?.data || response.data;

        // Map to ViewModel
        const viewModel = mapToAdminOrderVM(data);
        setOrder(viewModel);

        // Initialize status dropdown with the MAPPED strict status (integer)
        setSelectedStatus(viewModel.orderStatus);
      } catch (err) {
        console.error(err);
        setError('فشل جلب تفاصيل الطلب');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (selectedStatus === '') return;
    try {
      setUpdating(true);
      setUpdateMessage(null);

      // Call API
      await AdminService.updateOrderStatus(id, parseInt(selectedStatus));

      setUpdateMessage({ type: 'success', text: 'تم تحديث حالة الطلب بنجاح' });

      // Update local ViewModel state
      setOrder(prev => ({ ...prev, orderStatus: parseInt(selectedStatus) }));

    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || err.message;

      // Handle Backend Business Rule Blocks
      if (typeof backendMessage === 'string' && backendMessage.includes('Invalid status transition')) {
        setUpdateMessage({
          type: 'error',
          text: `عملية غير مسموحة: هذا الطلب في حالة نهائية (ملغي/منتهي) ولا يسمح النظام بتعديله. يرجى إنشاء طلب جديد.`
        });
      } else {
        setUpdateMessage({ type: 'error', text: `فشل تحديث الحالة: ${backendMessage}` });
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-4">جاري تحميل التفاصيل...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!order) return <div className="p-4">الطلب غير موجود</div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">تفاصيل الطلب #{order.id}</h1>
        <Link to="/admin/orders" className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
          <span>&rarr;</span> عودة للطلبات
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>معلومات أساسية</h2>

        {/* Status Update Control */}
        <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600 }}>تحديث الحالة:</span>
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.5rem' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {[OrderStatusEnum.Processing, OrderStatusEnum.Shipped, OrderStatusEnum.Delivered, OrderStatusEnum.Cancelled].map(statusEnum => (
                <option key={statusEnum} value={statusEnum}>
                  {OrderStatusArabic[statusEnum]} ({statusEnum})
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              onClick={handleStatusUpdate}
              disabled={updating}
            >
              {updating ? 'جاري التحديث...' : 'حفظ'}
            </button>
          </div>
          {updateMessage && (
            <div style={{ marginTop: '0.5rem', color: updateMessage.type === 'success' ? 'green' : 'red', fontSize: '0.9rem' }}>
              {updateMessage.text}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <strong>الحالة الحالية:</strong> <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>{getOrderStatusArabic(order.orderStatus)}</span>
          </div>
          <div>
            <strong>حالة الدفع:</strong> <span className={`badge ${getStatusBadgeClass(order.paymentStatus, 'payment')}`}>{getPaymentStatusArabic(order.paymentStatus)}</span>
          </div>
          <div>
            <strong>تاريخ الطلب:</strong> {(() => {
              if (!order.createdAt) return 'N/A';
              // Ensure we treat the date string as UTC if it doesn't specify timezone
              const dateStr = order.createdAt.endsWith('Z') ? order.createdAt : `${order.createdAt}Z`;
              return new Date(dateStr).toLocaleString('ar-EG', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              });
            })()}
          </div>
          <div>
            <strong>الاسم:</strong> {order.name}
          </div>
          <div>
            <strong>الهاتف:</strong> {order.phone}
          </div>
          <div>
            <strong>العنوان:</strong> {order.address}
          </div>
          <div>
            <strong>الإجمالي النهائي:</strong> {order.finalPrice} ج.م
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>المنتجات</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>صورة</th>
                <th>الاسم (عربي)</th>
                <th>الاسم (إنجليزي)</th>
                <th>سعر الوحدة</th>
                <th>الكمية</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {order._raw?.orderItems?.map((item, index) => (
                <tr key={index}>
                  <td>
                    {item.product?.images?.[0]?.imageUrl ? (
                      <img
                        src={item.product.images[0].imageUrl}
                        alt={item.product.enName}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    ) : 'لا توجد صورة'}
                  </td>
                  <td>{item.product?.arName}</td>
                  <td>{item.product?.enName}</td>
                  <td>{item.unitPrice}</td>
                  <td>{item.quantity}</td>
                  <td>{item.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>سجل الدفعات</h2>
        {order._raw?.payments && order._raw.payments.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>المعرف</th>
                  <th>المبلغ</th>
                  <th>الطريقة</th>
                  <th>الحالة</th>
                  <th>رقم المعاملة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {order._raw.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.id}</td>
                    <td>{payment.amount} {payment.currency}</td>
                    <td>{payment.method}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                        {getPaymentStatusArabic(payment.status)}
                      </span>
                    </td>
                    <td>{payment.transactionId || '-'}</td>
                    <td>{new Date(payment.createdAt).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>لا توجد مدفوعات مسجلة.</p>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
