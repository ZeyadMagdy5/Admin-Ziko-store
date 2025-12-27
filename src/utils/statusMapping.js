
export const OrderStatusEnum = {
  Pending: 0,
  Processing: 1,
  Shipped: 2,
  Delivered: 3,
  Cancelled: 4
};

export const PaymentStatusEnum = {
  Unpaid: 0,
  Paid: 1,
  Failed: 2
};

export const OrderStatusArabic = {
  0: "قيد الانتظار",
  1: "قيد التجهيز",
  2: "تم الشحن",
  3: "تم التوصيل",
  4: "ملغي"
};

export const PaymentStatusArabic = {
  0: "غير مدفوع / قيد الانتظار",
  1: "مدفوع",
  2: "فشل الدفع"
};

export const getOrderStatusArabic = (status) => {
  if (status === undefined || status === null) return "";
  // Handle Integer
  if (OrderStatusArabic[status]) return OrderStatusArabic[status];
  // Handle String (fallback)
  const key = Object.keys(OrderStatusEnum).find(k => k.toLowerCase() === String(status).toLowerCase());
  return key ? OrderStatusArabic[OrderStatusEnum[key]] : status;
};

export const getPaymentStatusArabic = (status) => {
  if (status === undefined || status === null) return "";
  // Handle Integer
  if (PaymentStatusArabic[status]) return PaymentStatusArabic[status];

  return "غير معروف";
};

export const getStatusBadgeClass = (status, type = 'order') => {
  if (status === undefined || status === null) return 'badge-secondary';

  // Normalize to integer if possible
  let statusInt = status;
  if (typeof status === 'string') {
    const enumObj = type === 'payment' ? PaymentStatusEnum : OrderStatusEnum;
    const key = Object.keys(enumObj).find(k => k.toLowerCase() === status.toLowerCase());
    if (key) statusInt = enumObj[key];
  }

  if (type === 'payment') {
    if (statusInt === PaymentStatusEnum.Paid) return 'badge-success';
    if (statusInt === PaymentStatusEnum.Failed) return 'badge-danger';
    return 'badge-warning'; // Unpaid
  }

  // Order Status
  if (statusInt === OrderStatusEnum.Delivered) return 'badge-success';
  if (statusInt === OrderStatusEnum.Cancelled) return 'badge-danger';
  if (statusInt === OrderStatusEnum.Shipped) return 'badge-primary';
  if (statusInt === OrderStatusEnum.Processing) return 'badge-info';

  return 'badge-warning'; // Pending
};
