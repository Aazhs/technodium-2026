import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { login } from '../api';

export default function Login({ user }: { user: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      window.location.href = '/dashboard';
    } catch (err: any) {
      let errMsg = 'Invalid email or password.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errMsg = err.response.data.detail.map((d: any) => d.msg).join(', ');
        }
      }
      setError(errMsg);
    }
  };

  return (
    <div className="page-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
      <Nav user={user} />
      
      {/* Decorative Shapes */}
      <div className="shape shape-3" style={{ top: '150px', left: '-50px', width: '200px', height: '200px', opacity: 0.6 }}></div>
      <div className="shape shape-5" style={{ bottom: '100px', right: '-30px', width: '150px', height: '150px', opacity: 0.6 }}></div>

      <section className="form-section" style={{ position: 'relative', zIndex: 2 }}>
        <div className="form-container auth-container">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p className="form-subtitle">Log in to manage your team.</p>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="teamlead@example.com" />
            </div>
            <div className="form-group">
              <label htmlFor="password" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', textTransform: 'none', color: 'var(--pink)' }}>Forgot Password?</Link>
              </label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn btn-primary btn-full magic-hover magic-hover__square">Login to Portal</button>
          </form>
          <div className="auth-footer">
            <p>New to Technodium? <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Create an account</Link></p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
