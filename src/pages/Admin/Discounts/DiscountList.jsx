import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminService from '../../../api/admin';
import '../Products/Product.css';

const DiscountList = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlyValid, setOnlyValid] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [page, setPage] = useState(1);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Prepare and Log Parameters
      const params = {
        PageNumber: Number(page) || 1,
        PageSize: 50,
        OnlyValid: onlyValid ? true : undefined, // Send 'true' or nothing
      };

      if (filterStatus === 'active') {
        params.IsActive = true;
      } else if (filterStatus === 'inactive') {
        params.IsActive = false;
      }

      console.log('Fetching Discounts with params:', params);

      // 2. Send Request
      const response = await AdminService.getDiscounts(params);
      
      // 3. Handle Response
      // Support Data Envelope { data: { items: [] } } or Direct Array { items: [] } or []
      const envelopeData = response.data?.data || response.data;
      const items = envelopeData?.items || envelopeData || [];

      // 4. Validate and Set State
      if (Array.isArray(items)) {
        setDiscounts(items);
        // Optional: Update total items if pagination needed later
        // if (envelopeData?.totalItems) setTotalItems(envelopeData.totalItems);
      } else {
        console.warn('Expected array of discounts but got:', items);
        setDiscounts([]);
      }

    } catch (err) {
      // 5. & 6. Handle Errors & Log
      console.error('Fetch Discounts Failed:', err);
      if (err.response) {
         console.error('Server Status:', err.response.status);
         console.error('Server Data:', err.response.data);
      }

      const status = err.response?.status;
      const backendMessage =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : '');

      if (status === 400) {
        setError(`طلب غير صالح (400): ${backendMessage}`);
      } else if (status === 404) {
        // Not found often means "No products/discounts found", so clear list, don't show error
        setDiscounts([]);
      } else if (status === 500) {
        setError('خطأ داخلي في الخادم (500). يرجى مراجعة المسؤول.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('تعذر الاتصال بالخادم. يرجى التحقق من الشبكة.');
      } else {
        setError(backendMessage || err.message || 'فشل غير متوقع في جلب الخصومات.');
      }
    } finally {
      // 7. Stop Loading
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, onlyValid, filterStatus]);

    const handleToggleStatus = async (id, newStatus) => {
        try {
            setDiscounts(prev => prev.map(d => {
                if (d.id !== id) return d;
                return { ...d, isActive: newStatus, IsActive: newStatus };
            }));

            if (newStatus) {
                await AdminService.activateDiscount(id);
            } else {
                await AdminService.deactivateDiscount(id);
            }
        } catch (err) {
            alert(`فشل في ${newStatus ? 'تنشيط' : 'إلغاء تنشيط'} الخصم.`);
            fetchDiscounts();
        }
    };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذا الخصم نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await AdminService.deleteDiscount(id);
      setDiscounts(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      alert('فشل حذف الخصم');
    }
  };

  if (loading && discounts.length === 0) {
    return <div className="p-4">جاري تحميل الخصومات...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">الخصومات</h1>
        <Link to="/admin/discounts/new" className="btn btn-primary">
          + إضافة خصم
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
            <label className="form-label">عرض الساري فقط</label>
            <input
              type="checkbox"
              checked={onlyValid}
              onChange={(e) => { setOnlyValid(e.target.checked); setPage(1); }}
            />
          </div>
          <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
            <label className="form-label">الحالة</label>
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="all">الكل</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
        </div>

        <div className="table-container" style={{ marginTop: '1.5rem' }}>
          <table>
            <thead>
              <tr>
                <th>النسبة</th>
                <th>تاريخ البدء</th>
                <th>تاريخ الانتهاء</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length > 0 ? (
                discounts.map((discount) => {
                  const isActive = discount.isActive !== undefined ? discount.isActive : discount.IsActive;
                  return (
                    <tr key={discount.id}>
                      <td>{discount.discountPercentage}%</td>
                      <td>{discount.startDate ? new Date(discount.startDate).toLocaleString('ar-EG') : '-'}</td>
                      <td>{discount.endDate ? new Date(discount.endDate).toLocaleString('ar-EG') : '-'}</td>
                      <td>
                        {isActive ? (
                          <span className="badge badge-success">نشط</span>
                        ) : (
                          <span className="badge badge-warning">غير نشط</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link
                            to={`/admin/discounts/view/${discount.id}`}
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#6366f1' }}
                          >
                            عرض
                          </Link>
                          <Link
                            to={`/admin/discounts/edit/${discount.id}`}
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            تعديل
                          </Link>
                          {isActive ? (
                            <button
                              onClick={() => handleToggleStatus(discount.id, false)}
                              className="btn btn-warning"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#f59e0b', color: 'white' }}
                            >
                              إلغاء التنشيط
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(discount.id, true)}
                              className="btn btn-success"
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#10b981' }}
                            >
                              تنشيط
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(discount.id)}
                            className="delete-btn"
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#ef4444' }}
                            title="حذف نهائي"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>لا توجد خصومات.</td>
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

export default DiscountList;
