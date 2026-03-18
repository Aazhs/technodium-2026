import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { signup } from '../api';

export default function Signup({ user }: { user: any }) {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const res = await signup(formData);
      if (res.message.includes('Check your email')) {
        setSuccessMsg(res.message);
        setError('');
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      let errMsg = 'Registration failed.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map((d: any) => d.msg).join(', ');
        }
      }
      setError(errMsg);
      setSuccessMsg('');
    }
  };

  return (
    <div className="page-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
      <Nav user={user} />
      
      {/* Decorative Shapes */}
      <div className="shape shape-1" style={{ top: '100px', right: '-80px', width: '250px', height: '250px', opacity: 0.5 }}></div>
      <div className="shape shape-4" style={{ bottom: '50px', left: '-40px', width: '180px', height: '180px', opacity: 0.5 }}></div>

      <section className="form-section" style={{ position: 'relative', zIndex: 2 }}>
        <div className="form-container auth-container">
          <div className="auth-header">
            <h2>Join the Movement</h2>
            <p className="form-subtitle">Create your Technodium 2026 account.</p>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          {successMsg && (
            <div className="alert alert-success">
              <h4 style={{ marginBottom: '8px' }}>Success!</h4>
              {successMsg}
            </div>
          )}
          {!successMsg && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
                <p className="password-hint" style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Include 8+ chars, 1 uppercase, 1 number & 1 special character.
                </p>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" required value={formData.confirm_password} onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} placeholder="••••••••" />
              </div>
              <button type="submit" className="btn btn-primary btn-full magic-hover magic-hover__square">Create My Account</button>
            </form>
          )}
          <div className="auth-footer">
            <p>Already a member? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Sign in here</Link></p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
