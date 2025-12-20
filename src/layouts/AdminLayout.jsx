import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './admin.css';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          لوحة التحكم
        </div>
        <nav>
          <NavLink to="/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            الرئيسية
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            المنتجات
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            الطلبات
          </NavLink>
          <NavLink to="/admin/collections" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            التشكيلات
          </NavLink>
          <NavLink to="/admin/discounts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            الخصومات
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
