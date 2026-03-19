import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import HeroShapes from '../components/HeroShapes';
import { getRegistration } from '../api';

export default function Dashboard({ user }: { user: any }) {
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getRegistration()
        .then(data => {
          if (data.registered) setRegistration(data.registration);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="page-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
      <Nav user={user} />
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <HeroShapes />
        <section className="section" style={{ position: 'relative', zIndex: 2, borderBottom: 'none' }}>
          <div className="dash-container">
            <div className="dash-header">
              <h2>Hacker Dashboard</h2>
              <p>Authenticated as <span className="dash-email">{user.email}</span></p>
            </div>
            
            {loading ? (
              <div className="ps-no-results">
                <p>Fetching your data...</p>
              </div>
            ) : (
              <div className="dash-actions">
                {registration ? (
                  <>
                    <div className="dash-card" style={{ textAlign: 'left', borderLeft: '10px solid var(--green)' }}>
                      <span className="ps-id">ACTIVE TEAM</span>
                      <h3 style={{ marginTop: '20px' }}>{registration.team_name}</h3>
                      <p style={{ fontSize: '1.2rem', color: 'var(--text)' }}><strong>Problem:</strong> {registration.problem_statement}</p>
                      <div style={{ marginTop: '24px', padding: '12px', background: 'var(--bg)', border: '2px solid var(--border)' }}>
                        <span style={{ color: 'var(--green)', fontWeight: 800 }}>✓ STATUS: REGISTERED</span>
                      </div>
                    </div>
                    <Link to="/edit-registration" className="dash-card magic-hover magic-hover__square">
                      <span className="ps-id" style={{ background: 'var(--accent)' }}>CONFIGURATION</span>
                      <h3 style={{ marginTop: '20px' }}>Edit Details</h3>
                      <p>Update your team members or change your problem statement selection.</p>
                    </Link>
                  </>
                ) : (
                  <Link to="/register" className="dash-card magic-hover magic-hover__square" style={{ gridColumn: '1 / -1', background: 'var(--yellow)' }}>
                    <span className="ps-id">ACTION REQUIRED</span>
                    <h3 style={{ fontSize: '2.5rem', marginTop: '20px' }}>Complete Your Registration</h3>
                    <p style={{ fontSize: '1.2rem' }}>You haven't registered a team yet. Pick a problem statement and secure your spot!</p>
                    <div className="btn btn-primary" style={{ marginTop: '32px' }}>Start Registration</div>
                  </Link>
                )}
              </div>
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
