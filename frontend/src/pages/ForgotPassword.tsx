import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { forgotPassword } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await forgotPassword({ email });
      setMsg(res.message);
    } catch (err: any) {
      setMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="page-wrap">
      <Nav user={null} />
      <section className="form-section">
        <div className="form-container auth-container">
          <div className="auth-header">
            <h2>Reset Password</h2>
            <p className="form-subtitle">Enter your email to receive a reset link.</p>
          </div>
          {msg && <div className="alert alert-success">{msg}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-full magic-hover magic-hover__square">Send Link</button>
          </form>
          <div className="auth-footer">
            <p>Remembered? <Link to="/login">Log in</Link></p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
