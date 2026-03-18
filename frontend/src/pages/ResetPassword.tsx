import { useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { resetPassword } from '../api';

export default function ResetPassword() {
  const [formData, setFormData] = useState({ password: '', confirm_password: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Supabase puts access_token in the hash
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (!access_token) {
      setError('Missing token.');
      return;
    }
    try {
      const res = await resetPassword({ ...formData, access_token, refresh_token: refresh_token || '' });
      setMsg(res.message);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Reset failed.');
    }
  };

  return (
    <div className="page-wrap">
      <Nav user={null} />
      <section className="form-section">
        <div className="form-container auth-container">
          <div className="auth-header">
            <h2>Set New Password</h2>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}
          {!msg && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>New Password</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                <p className="password-hint" style={{ marginTop: '4px' }}>Min 8 chars, 1 uppercase, 1 number, 1 special char.</p>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" required value={formData.confirm_password} onChange={e => setFormData({ ...formData, confirm_password: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary btn-full magic-hover magic-hover__square">Update Password</button>
            </form>
          )}
          {msg && (
            <div className="auth-footer">
              <p><Link to="/login">Proceed to Login</Link></p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
