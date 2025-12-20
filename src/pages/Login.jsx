import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../layouts/admin.css'; // Reuse admin styles for consistency

const Login = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;
        if (password === adminPassword) {
            localStorage.setItem('isAdminAuthenticated', 'true');
            navigate('/admin');
        } else {
            setError('كلمة المرور غير صحيحة');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f3f4f6'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>تسجيل الدخول</h1>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">كلمة المرور</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور"
                        />
                    </div>
                    {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        دخول
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
