
import { OrderStatusEnum } from './statusMapping';

// Enums (Frontend Only)
export const PaymentStatusEnum = {
  Unpaid: 0,
  Paid: 1,
  Failed: 2
};

// Mappings for UI Display
export const PaymentStatusArabic = {
  0: "غير مدفوع",
  1: "مدفوع",
  2: "فشل الدفع"
};

/**
 * Derives the strict Payment Status from the payments array.
 * Logic:
 * 1. Any Success/Paid -> Paid
 * 2. Any Pending -> Unpaid
 * 3. All Failed -> Failed
 * 4. Empty/Missing -> Unpaid
 */
/**
 * Derives the strict Payment Status.
 * Priority:
 * 1. PaymobTransactionObj (if available) - checking success/pending flags.
 * 2. Amount Check (paid_amount_cents >= amount_cents).
 * 3. Payments Array check.
 */
const derivePaymentStatus = (order) => {
  if (!order) return PaymentStatusEnum.Unpaid;

  // 1. Check PaymobTransactionObj (Direct Transaction Status)
  // The user specified: success (bool) and pending (bool)
  const txn = order.paymobTransactionObj;
  if (txn) {
    if (txn.success === true) return PaymentStatusEnum.Paid;
    if (txn.success === false && txn.pending === false) return PaymentStatusEnum.Failed;
    if (txn.pending === true) return PaymentStatusEnum.Unpaid;
  }

  // 2. Amount Check (Integrity Check)
  // "amount_cents and paid_amount_cents fields are compared"
  // Note: Ensure we handle potential nulls/undefined safely
  if (order.amount_cents != null && order.paid_amount_cents != null) {
    if (Number(order.paid_amount_cents) >= Number(order.amount_cents) && Number(order.amount_cents) > 0) {
      return PaymentStatusEnum.Paid;
    }
  }

  // 3. Fallback: Payments Array
  const payments = order.payments || [];
  if (payments.length > 0) {
    // Normalize statuses
    const statuses = payments.map(p => (p.status || "").toLowerCase());

    if (statuses.some(s => s === 'success' || s === 'paid' || s === 'completed')) {
      return PaymentStatusEnum.Paid;
    }
    if (statuses.some(s => s === 'pending')) {
      return PaymentStatusEnum.Unpaid;
    }
    if (statuses.every(s => s === 'failed')) {
      return PaymentStatusEnum.Failed;
    }
  }

  return PaymentStatusEnum.Unpaid;
};

/**
 * Maps the backend order status string to our strict OrderStatusEnum.
 * Temporary mapping until backend is fixed.
 */
const mapOrderStatus = (backendStatus) => {
  const status = (backendStatus || "").toLowerCase();

  switch (status) {
    case 'completed':
    case 'delivered':
      return OrderStatusEnum.Delivered;
    case 'shipped':
      return OrderStatusEnum.Shipped;
    case 'processing':
    case 'under preparation':
      return OrderStatusEnum.Processing;
    case 'cancelled':
      return OrderStatusEnum.Cancelled;
    case 'expired':
      // Business rule: Expired -> Cancelled
      return OrderStatusEnum.Cancelled;
    case 'pending':
    default:
      return OrderStatusEnum.Pending;
  }
};

/**
 * Transforms raw backend order data into a clean AdminOrderVM.
 */
export const mapToAdminOrderVM = (rawOrder) => {
  const paymentStatus = derivePaymentStatus(rawOrder);
  let orderStatus = mapOrderStatus(rawOrder.status);

  // Business Rule: Automatically set to Processing if Paid and currently Pending
  if (paymentStatus === PaymentStatusEnum.Paid && orderStatus === OrderStatusEnum.Pending) {
    orderStatus = OrderStatusEnum.Processing;
  }

  return {
    id: rawOrder.id,
    name: rawOrder.customerName || rawOrder.name || rawOrder.Name || rawOrder.userName || rawOrder.UserName || rawOrder.clientName || rawOrder.recipientName || rawOrder.fullName || (rawOrder.user && (rawOrder.user.name || rawOrder.user.Name)) || (rawOrder.shippingAddress && rawOrder.shippingAddress.name) || null,
    phone: rawOrder.phone,
    address: rawOrder.address,
    finalPrice: rawOrder.finalPrice,
    createdAt: rawOrder.createdAt,
    expiresAt: rawOrder.expiresAt,

    // Computed Fields
    paymentStatus, // Use the derived variable
    orderStatus,   // Use the modified variable

    // Keep raw data if needed for deep details, but UI should prefer VM fields
    _raw: rawOrder
  };
};
