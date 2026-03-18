import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { editRegistration, getRegistration, getPSCounts } from '../api';
import { problemStatements } from '../data/psData';

export default function EditRegistration({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [psCounts, setPsCounts] = useState<Record<string, number>>({});
  
  const [formData, setFormData] = useState({
    team_name: '', university: '', team_size: 1, problem_statement: '',
    m1_name: '', m1_email: '', m1_phone: '',
    m2_name: '', m2_email: '', m2_phone: '',
    m3_name: '', m3_email: '', m3_phone: '',
    m4_name: '', m4_email: '', m4_phone: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [originalPs, setOriginalPs] = useState('');

  useEffect(() => {
    if (user) {
      Promise.all([getRegistration(), getPSCounts()])
        .then(([regData, psData]) => {
          if (!regData.registered) {
            window.location.href = '/register';
            return;
          }
          const r = regData.registration;
          setFormData({
            team_name: r.team_name || '', university: r.university || '', team_size: r.team_size || 1, problem_statement: r.problem_statement || '',
            m1_name: r.leader_name || '', m1_email: r.leader_email || '', m1_phone: r.leader_phone || '',
            m2_name: r.member2_name || '', m2_email: r.member2_email || '', m2_phone: r.member2_phone || '',
            m3_name: r.member3_name || '', m3_email: r.member3_email || '', m3_phone: r.member3_phone || '',
            m4_name: r.member4_name || '', m4_email: r.member4_email || '', m4_phone: r.member4_phone || ''
          });
          setOriginalPs(r.problem_statement || '');
          if (psData.counts) setPsCounts(psData.counts);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) return <Navigate to="/login" />;
  if (loading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await editRegistration(formData);
      setSuccess(res.message);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Update failed.');
      setSuccess('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'team_size' ? parseInt(value) : value }));
  };

  return (
    <div className="page-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
      <Nav user={user} />
      
      {/* Decorative Shapes */}
      <div className="shape shape-4" style={{ top: '100px', right: '-100px', width: '300px', height: '300px', opacity: 0.3 }}></div>
      <div className="shape shape-5" style={{ bottom: '50px', left: '-50px', width: '200px', height: '200px', opacity: 0.3 }}></div>

      <div className="reg-header" style={{ position: 'relative', zIndex: 2 }}>
        <h1>Update Your Registration</h1>
        <Link to="/dashboard" className="back-link magic-hover magic-hover__square">&larr; Return to Dashboard</Link>
      </div>

      <section className="form-section" style={{ paddingTop: '20px', position: 'relative', zIndex: 2 }}>
        <div className="form-container form-container--wide">
          {error && <div className="alert alert-error">{error}</div>}
          {success && (
            <div className="alert alert-success">
              <h4 style={{ marginBottom: '12px' }}>Changes Saved</h4>
              <p>{success}</p>
              <Link to="/dashboard" className="btn btn-ghost" style={{ marginTop: '24px' }}>Back to Dashboard</Link>
            </div>
          )}
          <form onSubmit={handleSubmit} className="registration-form">
            <div className="form-section-label">01. Update Team Details</div>
            <div className="form-row form-row--3">
              <div className="form-group">
                <label>Squad Name</label>
                <input type="text" name="team_name" required value={formData.team_name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Institution / University</label>
                <input type="text" name="university" required value={formData.university} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Squad Size</label>
                <select name="team_size" value={formData.team_size} onChange={handleInputChange} style={{ cursor: 'pointer' }}>
                  <option value={1}>1 Member (Solo)</option>
                  <option value={2}>2 Members</option>
                  <option value={3}>3 Members</option>
                  <option value={4}>4 Members</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Update Problem Statement</label>
              <select name="problem_statement" required value={formData.problem_statement} onChange={handleInputChange} style={{ cursor: 'pointer' }}>
                <option value="" disabled>Choose your challenge...</option>
                {problemStatements.map(ps => {
                  const count = psCounts[ps.id] || 0;
                  const isCurrent = ps.id === originalPs;
                  const disabled = !isCurrent && count >= 10;
                  return (
                    <option key={ps.id} value={ps.id} disabled={disabled}>
                      {ps.id} — {ps.title} {isCurrent ? '(STAYING WITH THIS)' : (disabled ? '(NO SLOTS AVAILABLE)' : `(${count}/10 slots filled)`)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-section-label" style={{ marginTop: '40px' }}>02. Leader Details (Squad Lead)</div>
            <div className="form-row form-row--3">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="m1_name" required value={formData.m1_name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Primary Email</label>
                <input type="email" name="m1_email" required value={formData.m1_email} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input type="text" name="m1_phone" required value={formData.m1_phone} onChange={handleInputChange} />
              </div>
            </div>

            {[2, 3, 4].map(num => (
              formData.team_size >= num && (
                <React.Fragment key={num}>
                  <div className="form-section-label" style={{ marginTop: '40px' }}>0{num + 1}. Member {num} Details</div>
                  <div className="form-row form-row--3">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input type="text" name={`m${num}_name`} required value={(formData as any)[`m${num}_name`]} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input type="email" name={`m${num}_email`} required value={(formData as any)[`m${num}_email`]} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number</label>
                      <input type="text" name={`m${num}_phone`} required value={(formData as any)[`m${num}_phone`]} onChange={handleInputChange} />
                    </div>
                  </div>
                </React.Fragment>
              )
            ))}

            <div style={{ marginTop: '60px' }}>
              <button type="submit" className="btn btn-primary btn-full magic-hover magic-hover__square" style={{ fontSize: '1.4rem', padding: '24px' }}>Save All Changes</button>
            </div>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
}
