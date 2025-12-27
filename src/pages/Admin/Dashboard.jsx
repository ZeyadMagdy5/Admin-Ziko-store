import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="animate-fade-in">
      <h1 className="page-title">نظرة عامة</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>مرحبًا بك في لوحة تحكم المسؤول.</p>

      <div className="dashboard-grid">
        <Link to="/admin/products" className="dashboard-card-link">
          <div className="card dashboard-card">
            <div>
              <h2 className="dashboard-card-title">المنتجات</h2>
              <p className="dashboard-card-text">إدارة المنتجات والأسعار والمخزون.</p>
            </div>
          </div>
        </Link>
        
        <Link to="/admin/orders" className="dashboard-card-link">
          <div className="card dashboard-card">
            <div>
              <h2 className="dashboard-card-title">الطلبات</h2>
              <p className="dashboard-card-text">متابعة الطلبات المكتملة والجارية.</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/collections" className="dashboard-card-link">
          <div className="card dashboard-card">
            <div>
              <h2 className="dashboard-card-title">التشكيلات</h2>
              <p className="dashboard-card-text">تنظيم المنتجات في تشكيلات.</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/discounts" className="dashboard-card-link">
          <div className="card dashboard-card">
            <div>
              <h2 className="dashboard-card-title">الخصومات</h2>
              <p className="dashboard-card-text">إدارة المبيعات وأكواد الخصم.</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
