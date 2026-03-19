import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import HeroShapes from '../components/HeroShapes';
import { getRegistration } from '../api';
import { problemStatements } from '../data/psData';

type Registration = {
  team_name?: string;
  university?: string;
  team_size?: number;
  problem_statement?: string;
  leader_name?: string;
  leader_email?: string;
  leader_phone?: string;
  member2_name?: string | null;
  member2_email?: string | null;
  member2_phone?: string | null;
  member3_name?: string | null;
  member3_email?: string | null;
  member3_phone?: string | null;
  member4_name?: string | null;
  member4_email?: string | null;
  member4_phone?: string | null;
};

type TeamMember = {
  role: string;
  name: string;
  email: string;
  phone: string;
  toneClass: string;
};

function buildTeamMembers(registration: Registration | null): TeamMember[] {
  if (!registration) return [];

  const teamSize = Math.max(1, Math.min(4, registration.team_size || 1));
  const members: TeamMember[] = [
    {
      role: 'Team Lead',
      name: registration.leader_name || 'Team lead',
      email: registration.leader_email || 'Not provided',
      phone: registration.leader_phone || 'Not provided',
      toneClass: 'is-lead',
    },
  ];

  const additionalMembers = [
    {
      role: 'Member 2',
      name: registration.member2_name,
      email: registration.member2_email,
      phone: registration.member2_phone,
      toneClass: 'is-member-two',
    },
    {
      role: 'Member 3',
      name: registration.member3_name,
      email: registration.member3_email,
      phone: registration.member3_phone,
      toneClass: 'is-member-three',
    },
    {
      role: 'Member 4',
      name: registration.member4_name,
      email: registration.member4_email,
      phone: registration.member4_phone,
      toneClass: 'is-member-four',
    },
  ];

  additionalMembers.slice(0, teamSize - 1).forEach(member => {
    members.push({
      role: member.role,
      name: member.name || member.role,
      email: member.email || 'Not provided',
      phone: member.phone || 'Not provided',
      toneClass: member.toneClass,
    });
  });

  return members;
}

export default function Dashboard({ user }: { user: any }) {
  const [registration, setRegistration] = useState<Registration | null>(null);
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

  const teamMembers = buildTeamMembers(registration);
  const selectedProblem = registration
    ? problemStatements.find(problem => problem.id === registration.problem_statement)
    : null;
  const teamSize = registration?.team_size || teamMembers.length;
  const teamSizeLabel = `${teamSize} Member${teamSize === 1 ? '' : 's'}`;
  const problemId = registration?.problem_statement || 'Not selected';
  const problemLabel = selectedProblem
    ? `${selectedProblem.id} · ${selectedProblem.title}`
    : problemId;

  return (
    <div className="page-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
      <Nav user={user} />
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <HeroShapes />
        <section className="section dash-section" style={{ position: 'relative', zIndex: 2, borderBottom: 'none' }}>
          <div className="dash-container">
            <div className="dash-hero">
              <div className="dash-header">
                <span className="form-section-label">Dashboard</span>
                <h2>Team Command Center</h2>
                <p>Keep your squad details, challenge brief, and next actions in one place.</p>
              </div>
              <div className="dash-account-card">
                <span className="ps-id">Authenticated</span>
                <h3>{user.email}</h3>
                <p>This account is the control point for team registration and updates.</p>
              </div>
            </div>

            {loading ? (
              <div className="ps-no-results dash-loading-state">
                <p>Fetching your data...</p>
              </div>
            ) : (
              <div className="dash-grid">
                {registration ? (
                  <>
                    <article className="dash-card dash-card--overview">
                      <div className="dash-card-head">
                        <div>
                          <span className="ps-id">Active Team</span>
                          <h3>{registration.team_name || 'Untitled Team'}</h3>
                        </div>
                        <div className="dash-status-pill">Registered</div>
                      </div>

                      <p className="dash-lead">
                        <strong>Challenge:</strong> {problemLabel}
                      </p>

                      <div className="dash-metrics">
                        <div className="dash-metric">
                          <span className="dash-metric-label">Institution</span>
                          <strong>{registration.university || 'Pending'}</strong>
                        </div>
                        <div className="dash-metric">
                          <span className="dash-metric-label">Team Size</span>
                          <strong>{teamSizeLabel}</strong>
                        </div>
                        <div className="dash-metric">
                          <span className="dash-metric-label">Problem ID</span>
                          <strong>{problemId}</strong>
                        </div>
                        <div className="dash-metric">
                          <span className="dash-metric-label">Lead Contact</span>
                          <strong>{registration.leader_phone || 'Pending'}</strong>
                        </div>
                      </div>
                    </article>

                    <article className="dash-card dash-card--actions">
                      <span className="ps-id dash-tag-accent">Quick Actions</span>
                      <h3>Manage Registration</h3>
                      <p>Need to update your roster or switch your selected challenge? Use the edit portal.</p>
                      <Link to="/edit-registration" className="btn btn-primary magic-hover magic-hover__square">
                        Edit Team Details
                      </Link>
                      <div className="dash-note-list">
                        <div className="dash-note-item">
                          <span className="dash-note-kicker">Status</span>
                          <p>Your team is locked in and visible to the organizing team.</p>
                        </div>
                        <div className="dash-note-item">
                          <span className="dash-note-kicker">Reminder</span>
                          <p>Keep email and phone details current so updates reach the right people.</p>
                        </div>
                      </div>
                    </article>

                    <article className="dash-card dash-card--roster">
                      <div className="dash-section-head">
                        <div>
                          <span className="form-section-label">Team Roster</span>
                          <h3>Everyone on this squad</h3>
                        </div>
                        <p>{teamMembers.length} confirmed member{teamMembers.length === 1 ? '' : 's'}</p>
                      </div>
                      <div className="dash-roster-grid">
                        {teamMembers.map(member => (
                          <div key={member.role} className={`dash-member-card ${member.toneClass}`}>
                            <div className="dash-member-top">
                              <span className="dash-member-role">{member.role}</span>
                              <span className="dash-member-dot" />
                            </div>
                            <h4>{member.name}</h4>
                            <div className="dash-member-meta">
                              <div>
                                <span>Email</span>
                                {member.email === 'Not provided' ? (
                                  <div className="dash-member-value">{member.email}</div>
                                ) : (
                                  <a href={`mailto:${member.email}`}>{member.email}</a>
                                )}
                              </div>
                              <div>
                                <span>Phone</span>
                                {member.phone === 'Not provided' ? (
                                  <div className="dash-member-value">{member.phone}</div>
                                ) : (
                                  <a href={`tel:${member.phone}`}>{member.phone}</a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>

                  </>
                ) : (
                  <>
                    <article className="dash-card dash-card--empty">
                      <span className="ps-id">Action Required</span>
                      <h3>Complete your team registration</h3>
                      <p>
                        You are signed in, but your squad has not been submitted yet. Register your team, choose a
                        problem statement, and add every member in one pass.
                      </p>
                      <div className="dash-empty-points">
                        <div className="dash-empty-point">
                          <strong>1.</strong>
                          <span>Set your team name, institution, and size.</span>
                        </div>
                        <div className="dash-empty-point">
                          <strong>2.</strong>
                          <span>Select the challenge your team wants to solve.</span>
                        </div>
                        <div className="dash-empty-point">
                          <strong>3.</strong>
                          <span>Add the lead and all member contact details.</span>
                        </div>
                      </div>
                      <Link to="/register" className="btn btn-primary magic-hover magic-hover__square">
                        Start Registration
                      </Link>
                    </article>

                    <article className="dash-card dash-card--actions">
                      <span className="ps-id dash-tag-accent">Account Ready</span>
                      <h3>What happens next</h3>
                      <p>Your login is active. Once you submit your registration, this dashboard will show your full roster and selected challenge brief.</p>
                      <div className="dash-note-list">
                        <div className="dash-note-item">
                          <span className="dash-note-kicker">Tip</span>
                          <p>Keep all member emails and phone numbers ready before you begin.</p>
                        </div>
                        <div className="dash-note-item">
                          <span className="dash-note-kicker">Theme Fit</span>
                          <p>This dashboard will stay consistent with the rest of the portal after registration too.</p>
                        </div>
                      </div>
                    </article>
                  </>
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
