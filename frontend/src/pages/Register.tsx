import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import HeroShapes from '../components/HeroShapes';
import { submitRegistration, getRegistration, getPSCounts } from '../api';
import { problemStatements } from '../data/psData';

export default function Register({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
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

  useEffect(() => {
    if (user) {
      Promise.all([getRegistration(), getPSCounts()])
        .then(([regData, psData]) => {
          if (regData.registered) setAlreadyRegistered(true);
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
      const res = await submitRegistration(formData);
      setSuccess(res.message);
      setError('');
      setAlreadyRegistered(true);
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
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <HeroShapes />
        <div className="reg-header" style={{ position: 'relative', zIndex: 2 }}>
          <h1>Hackathon Registration</h1>
          <Link to="/dashboard" className="back-link magic-hover magic-hover__square">&larr; Return to Dashboard</Link>
        </div>

        <section className="form-section" style={{ paddingTop: '20px', position: 'relative', zIndex: 2 }}>
          <div className="form-container form-container--wide">
            {alreadyRegistered && !success ? (
              <div className="alert alert-error">
                <h4 style={{ marginBottom: '12px' }}>Registration Detected</h4>
                <p>You have already registered a team. If you need to make changes, please visit the update portal.</p>
                <Link to="/edit-registration" className="btn btn-primary" style={{ marginTop: '24px' }}>Update Registration</Link>
              </div>
            ) : (
              <>
                {error && <div className="alert alert-error">{error}</div>}
                {success && (
                  <div className="alert alert-success">
                    <h4 style={{ marginBottom: '12px' }}>Registration Successful!</h4>
                    <p>{success}</p>
                    <Link to="/dashboard" className="btn btn-ghost" style={{ marginTop: '24px' }}>Back to Dashboard</Link>
                  </div>
                )}
                {!success && (
                  <form onSubmit={handleSubmit} className="registration-form">
                    <div className="form-section-label">01. Team Basics</div>
                    <div className="form-row form-row--3">
                      <div className="form-group">
                        <label>Squad Name</label>
                        <input type="text" name="team_name" required value={formData.team_name} onChange={handleInputChange} placeholder="The Bug Hunters" />
                      </div>
                      <div className="form-group">
                        <label>Institution / University</label>
                        <input type="text" name="university" required value={formData.university} onChange={handleInputChange} placeholder="ASSCET Engineering College" />
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
                      <label>Problem Statement Selection</label>
                      <select name="problem_statement" required value={formData.problem_statement} onChange={handleInputChange} style={{ cursor: 'pointer' }}>
                        <option value="" disabled>Choose your challenge...</option>
                        {problemStatements.map(ps => {
                          const count = psCounts[ps.id] || 0;
                          const disabled = count >= 10;
                          return (
                            <option key={ps.id} value={ps.id} disabled={disabled}>
                              {ps.id} — {ps.title} {disabled ? '(CAPACITY REACHED)' : `(${count}/10 slots filled)`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-section-label" style={{ marginTop: '40px' }}>02. Leader Information (Squad Lead)</div>
                    <div className="form-row form-row--3">
                      <div className="form-group">
                        <label>Leader Full Name</label>
                        <input type="text" name="m1_name" required value={formData.m1_name} onChange={handleInputChange} placeholder="John Doe" />
                      </div>
                      <div className="form-group">
                        <label>Primary Email</label>
                        <input type="email" name="m1_email" required value={formData.m1_email} onChange={handleInputChange} placeholder="lead@example.com" />
                      </div>
                      <div className="form-group">
                        <label>WhatsApp / Mobile</label>
                        <input type="text" name="m1_phone" required value={formData.m1_phone} onChange={handleInputChange} placeholder="+91 XXXXX XXXXX" />
                      </div>
                    </div>

                    {[2, 3, 4].map(num => (
                      formData.team_size >= num && (
                        <React.Fragment key={num}>
                          <div className="form-section-label" style={{ marginTop: '40px' }}>0{num + 1}. Member {num} Information</div>
                          <div className="form-row form-row--3">
                            <div className="form-group">
                              <label>Full Name</label>
                              <input type="text" name={`m${num}_name`} required value={(formData as any)[`m${num}_name`]} onChange={handleInputChange} placeholder={`Member ${num} Name`} />
                            </div>
                            <div className="form-group">
                              <label>Email Address</label>
                              <input type="email" name={`m${num}_email`} required value={(formData as any)[`m${num}_email`]} onChange={handleInputChange} placeholder={`member${num}@example.com`} />
                            </div>
                            <div className="form-group">
                              <label>Mobile Number</label>
                              <input type="text" name={`m${num}_phone`} required value={(formData as any)[`m${num}_phone`]} onChange={handleInputChange} placeholder="+91 XXXXX XXXXX" />
                            </div>
                          </div>
                        </React.Fragment>
                      )
                    ))}

                    <div style={{ marginTop: '60px' }}>
                      <button type="submit" className="btn btn-primary btn-full magic-hover magic-hover__square" style={{ fontSize: '1.4rem', padding: '24px' }}>Confirm Registration</button>
                      <p style={{ textAlign: 'center', marginTop: '16px', fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        By submitting, you agree to the hackathon rules and guidelines.
                      </p>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </section>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Footer />
        </div>
      </div>
    </div>
  );
}
