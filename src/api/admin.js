import client from './client';

const AdminService = {
  // Collections
  getCollections: (params) => client.get('/api/admin/collections', { params }),
  createCollection: (data) => client.post('/api/admin/collections', data),
  getCollection: (id) => client.get(`/api/admin/collections/${id}`),
  updateCollection: (id, data) => client.put(`/api/admin/collections/${id}`, data),
  deleteCollection: (id) => client.delete(`/api/admin/collections/${id}`),

  activateCollection: (id) => client.post(`/api/admin/collections/${id}/activate`, {}, { headers: { 'Content-Type': 'application/json' } }),
  deactivateCollection: (id) => client.post(`/api/admin/collections/${id}/deactivate`, {}, { headers: { 'Content-Type': 'application/json' } }),
  addProductsToCollection: (collectionId, productIds) =>
    client.post(`/api/admin/collections/${collectionId}/products`, productIds),
  removeProductsFromCollection: (collectionId, productIds) =>
    client.delete('/api/admin/collections/products', { params: { collectionId }, data: productIds }),
  addCollectionImages: (id, formData) => client.post(`/api/admin/collections/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteCollectionImage: (collectionId, imageId) => client.delete(`/api/admin/collections/${collectionId}/images/${imageId}`),

  // Discounts
  getDiscounts: (params) => client.get('/api/admin/discounts', { params }),
  createDiscount: (data) => client.post('/api/admin/discounts', data),
  getDiscount: (id) => client.get(`/api/admin/discounts/${id}`),
  updateDiscount: (id, data) => client.put(`/api/admin/discounts/${id}`, data),
  deleteDiscount: (id) => client.delete(`/api/admin/discounts/${id}`),
  activateDiscount: (id) => client.post(`/api/admin/discounts/${id}/activate`, {}, { headers: { 'Content-Type': 'application/json' } }),
  deactivateDiscount: (id) => client.post(`/api/admin/discounts/${id}/deactivate`, {}, { headers: { 'Content-Type': 'application/json' } }),
  // Redirecting to products filter as specific endpoint returns 405
  getDiscountProducts: (id, params) => client.get('/api/admin/products', { params: { ...params, DiscountId: id } }),
  addProductsToDiscount: (discountId, productIds) =>
    client.post(`/api/admin/discounts/${discountId}/products`, productIds),
  removeProductsFromDiscount: (productIds) =>
    client.delete('/api/admin/discounts/products', { data: productIds }),

  // Products
  getProducts: (params) => client.get('/api/admin/products', { params }),
  createProduct: (data) => client.post('/api/admin/products', data),
  getProduct: (id) => client.get(`/api/admin/products/${id}`),
  updateProduct: (id, data) => client.put(`/api/admin/products/${id}`, data),
  activateProduct: (id) => client.post(`/api/admin/products/${id}/activate`, {}, { headers: { 'Content-Type': 'application/json' } }),
  deactivateProduct: (id) => client.post(`/api/admin/products/${id}/deactivate`, {}, { headers: { 'Content-Type': 'application/json' } }),
  addProductImages: (id, formData) => client.post(`/api/admin/products/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProductImage: (productId, imageId) => client.delete(`/api/admin/products/${productId}/images/${imageId}`),

  // Orders
  getOrders: (params) => client.get('/api/admin/orders', { params }),
  getOrder: (id) => client.get(`/api/admin/orders/${id}`),
  updateOrderStatus: (id, status) => client.put(`/api/admin/orders/${id}/status`, { status }),
  deleteOrder: (id) => client.delete(`/api/admin/orders/${id}`),
};

export default AdminService;
