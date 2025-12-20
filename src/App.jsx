import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import ProductList from './pages/Admin/Products/ProductList';
import ProductForm from './pages/Admin/Products/ProductForm';
import ProductDetails from './pages/Admin/Products/ProductDetails';
import CollectionList from './pages/Admin/Collections/CollectionList';
import CollectionForm from './pages/Admin/Collections/CollectionForm';
import CollectionDetails from './pages/Admin/Collections/CollectionDetails';
import DiscountList from './pages/Admin/Discounts/DiscountList';
import DiscountForm from './pages/Admin/Discounts/DiscountForm';
import DiscountDetails from './pages/Admin/Discounts/DiscountDetails';
import OrderList from './pages/Admin/Orders/OrderList';
import OrderDetails from './pages/Admin/Orders/OrderDetails';

// Placeholder for other sections
const Placeholder = ({ title }) => (
  <div className="card animate-fade-in">
    <h1 className="page-title">{title}</h1>
    <p>This section is under construction.</p>
  </div>
);

import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          {/* Redirect root to admin for now, since we are building Admin Dashboard */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />

            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="products/view/:id" element={<ProductDetails />} />

            {/* Collections */}
            <Route path="collections" element={<CollectionList />} />
            <Route path="collections/new" element={<CollectionForm />} />
            <Route path="collections/edit/:id" element={<CollectionForm />} />
            <Route path="collections/view/:id" element={<CollectionDetails />} />

            {/* Discounts */}
            <Route path="discounts" element={<DiscountList />} />
            <Route path="discounts/new" element={<DiscountForm />} />
            <Route path="discounts/edit/:id" element={<DiscountForm />} />
            <Route path="discounts/view/:id" element={<DiscountDetails />} />

            {/* Orders */}
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/view/:id" element={<OrderDetails />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
