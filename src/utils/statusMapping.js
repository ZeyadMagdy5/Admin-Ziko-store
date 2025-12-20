
export const OrderStatusEnum = {
    Pending: 0,
    Processing: 1,
    Shipped: 2,
    Delivered: 3,
    Cancelled: 4,
    Expired: 5,
    Paid: 6
};

export const OrderStatusArabic = {
    Pending: "قيد الانتظار",
    Processing: "قيد التجهيز",
    Shipped: "تم الشحن",
    Delivered: "تم التوصيل",
    Cancelled: "ملغي",
    Expired: "منتهي",
    Paid: "مدفوع"
};

export const PaymentStatusArabic = {
    Pending: "قيد الانتظار",
    Completed: "مكتمل",
    Failed: "فشلت",
    Confirmed: "مؤكد" // Extra case just in case
};

export const getOrderStatusArabic = (status) => {
    if (!status) return "";
    // Check if it's already arabic or key exists
    const key = Object.keys(OrderStatusArabic).find(k => k.toLowerCase() === status.toLowerCase());
    return key ? OrderStatusArabic[key] : status;
};

export const getPaymentStatusArabic = (status) => {
    if (!status) return "";
    const key = Object.keys(PaymentStatusArabic).find(k => k.toLowerCase() === status.toLowerCase());
    return key ? PaymentStatusArabic[key] : status;
};

export const getStatusBadgeClass = (status) => {
    if (!status) return 'badge-warning';
    const lower = status.toLowerCase();

    if (lower === 'paid' || lower === 'completed' || lower === 'delivered') return 'badge-success';
    if (lower === 'cancelled' || lower === 'expired' || lower === 'failed') return 'badge-danger';
    if (lower === 'shipped' || lower === 'processing') return 'badge-info';

    return 'badge-warning';
};
