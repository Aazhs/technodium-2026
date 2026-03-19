import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import HeroShapes from '../components/HeroShapes';
import { problemStatements } from '../data/psData';
import { getPSCounts } from '../api';

export default function Landing({ user }: { user: any }) {
  const [psCounts, setPsCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showCount, setShowCount] = useState(9);
  const [stats, setStats] = useState([0, 0, 0, 0]);

  const finalStats = [100, 4, 50, 50];

  useEffect(() => {
    getPSCounts().then(data => {
      if (data && data.counts) {
        setPsCounts(data.counts);
      }
    }).catch(e => console.error(e));

    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.stat, .tl-item').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const duration = 1400;
    const start = performance.now();
    let animationFrame = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out for a smooth finish
      const eased = 1 - Math.pow(1 - progress, 3);

      setStats(finalStats.map((target) => Math.round(target * eased)));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const PAGE_SIZE = 9;

  const getMatchingCards = () => {
    const query = searchQuery.toLowerCase().trim();
    return problemStatements.filter(card => {
      const text = `${card.id} ${card.title} ${card.desc}`.toLowerCase();
      if (query && !text.includes(query)) return false;
      if (showAvailableOnly) {
        const ct = psCounts[card.id] || 0;
        if (ct >= 10) return false;
      }
      return true;
    });
  };

  const matched = getMatchingCards();
  const visibleCards = matched.slice(0, showCount);
  const remaining = matched.length - showCount;

  return (
    <>
      <Nav user={user} />

      {/* ── HERO ──────────────────────────────────── */}
      <section className="hero" id="hero">
        <HeroShapes />
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-overlay">
              <div className="presented-by magic-hover">
                <span>Presented by <strong>ASSCET club</strong></span>
                <img src="/static/images/girlscript-logo.png" alt="ASSCET" className="presented-logo" />
              </div>
              <h1 className="magic-hover">TECHNODIUM<span className="accent"> 2026</span></h1>
              <p className="hero-sub magic-hover"></p>
              <div className="hero-btns">
                <Link to="/register" className="btn btn-primary btn-hero magic-hover magic-hover__square">Register Now</Link>
                <a href="#timeline" className="btn btn-ghost btn-hero magic-hover magic-hover__square">Explore Timeline</a>
              </div>
            </div>
          </div>

          {/* Integrated Stats Bar */}
          <div className="hero-stats">
            <div className="hero-stat-item magic-hover">
              <span className="stat-num">{stats[0]}+</span>
              <span className="stat-label">Teams</span>
            </div>
            <div className="hero-stat-item magic-hover">
              <span className="stat-num">{String(stats[1]).padStart(2, '0')}</span>
              <span className="stat-label">Members</span>
            </div>
            <div className="hero-stat-item magic-hover">
              <span className="stat-num">{stats[2]}</span>
              <span className="stat-label">Problems</span>
            </div>
            <div className="hero-stat-item magic-hover">
              <span className="stat-num">{stats[3]}K</span>
              <span className="stat-label">Prize Pool</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPONSORS (HIDDEN) ─────────────────────────────────────── */}
      {/* <section className="section section--alt" id="sponsors">
        <div className="section-inner">
          <h2 className="section-title">Our Esteemed Sponsors</h2>
          <div className="marquee-container">
            <div className="marquee-content">
              {[1, 2].map((i) => (
                <React.Fragment key={i}>
                  <div className="sponsor-item">
                    <img src="/static/images/cc.jpg" alt="Campus Credentials Logo" className="sponsor-logo" />
                    <span className="sponsor-name">Campus Credentials</span>
                  </div>
                  <div className="sponsor-item">
                    <img src="/static/images/preskillet.jpg" alt="Preskillet Logo" className="sponsor-logo" />
                    <span className="sponsor-name">Preskillet</span>
                  </div>
                  <div className="sponsor-item">
                    <img src="/static/images/tutorial-point.png" alt="Tutorial Point Logo" className="sponsor-logo" />
                    <span className="sponsor-name">Tutorial Point</span>
                  </div>
                  <div className="sponsor-item">
                    <img src="/static/images/pod.png" alt="Pod Logo" className="sponsor-logo" />
                    <span className="sponsor-name">Pod</span>
                  </div>
                  <div className="sponsor-item">
                    <img src="/static/images/worqhat.jpg" alt="Worqhat Logo" className="sponsor-logo" />
                    <span className="sponsor-name">Worqhat</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* ── TIMELINE ─────────────────────────────────────── */}
      <section className="section" id="timeline">
        <div className="section-inner">
          <h2 className="section-title">Timeline</h2>
          <div className="timeline">
            <div className="tl-item">
              <div className="tl-marker"></div>
              <div className="tl-content">
                <span className="tl-date">8 March &rarr; 15 March</span>
                <h3>Registration & Team Formation</h3>
                <p>Register via Unstop. Form a team of exactly 4 members. Team lead signs up and logs in on our portal using their email. Problem statements are allocated on a first-come, first-served basis.</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-marker"></div>
              <div className="tl-content">
                <span className="tl-date">16 March</span>
                <h3>Problem Statement Selection</h3>
                <p>Choose from 50 problem statements. Start preparing PPT</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-marker"></div>
              <div className="tl-content">
                <span className="tl-date">24 March</span>
                <h3>PPT Submission</h3>
                <p>Submit your solution deck. Presentation format will be provided by the organizing team beforehand.</p>
              </div>
            </div>
            <div className="tl-item">
              <div className="tl-marker"></div>
              <div className="tl-content">
                <span className="tl-date">28 March</span>
                <h3>Final Presentation</h3>
                <p>Top teams present their solutions live. Winners are announced after all rounds.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WINNERS & PRIZES ──────────────────────────────── */}
      <section className="section section--alt" id="winners">
        <div className="section-inner section-inner--wide">
          <h2 className="section-title">Prizes & Recognition</h2>
          <p className="section-desc">Victory is rewarding. Compete for internship opportunities and premium goodies.</p>
          
          {[
            "Group 1: 1st Year Students",
            "Group 2: 2nd Year Students",
            "Group 3: 3rd & 4th Year Students"
          ].map((groupTitle, i) => (
            <div className="winner-group" key={i}>
              <h3 className="winner-group-title">{groupTitle}</h3>
              <div className="winners-grid">
                <div className="winner-card prize-1">
                  <div className="winner-place-badge">🥇 1st Place</div>
                  <ul className="winner-perks">
                    <li>6-Month Internship from <strong>TutorialsPoint</strong></li>
                    <li>Premium Goodies & Swag Kit</li>
                    <li>Winner Certificate</li>
                  </ul>
                </div>
                <div className="winner-card prize-2">
                  <div className="winner-place-badge">🥈 2nd Place</div>
                  <ul className="winner-perks">
                    <li>Premium Goodies Bag</li>
                    <li>Special Mention Certificate</li>
                    <li>Tech Vouchers</li>
                  </ul>
                </div>
                <div className="winner-card prize-3">
                  <div className="winner-place-badge">🥉 3rd Place</div>
                  <ul className="winner-perks">
                    <li>Exclusive Goodies</li>
                    <li>Certificate of Excellence</li>
                    <li>Swag Pack</li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
          
          <div className="participation-prize">
            <h4>🏅 For All Participants</h4>
            <p>Every squad that successfully submits their solution will receive a <span className="perk-highlight">Certificate of Participation</span>, exclusive digital assets, and access to our developer community!</p>
          </div>
        </div>
      </section>

      {/* ── ROUND STRUCTURE ──────────────────────────────── */}
      <section className="section section--alt" id="structure">
        <div className="section-inner">
          <h2 className="section-title">Round Structure</h2>
          <div className="rounds-grid">
            <div className="round-card round-card--final magic-hover magic-hover__square">
              <div className="round-num">01</div>
              <h3>Registration</h3>
              <p className="round-meta">150 &ndash; 200 Teams</p>
              <p>All registered teams compete. Top performers are shortlisted for the next round.</p>
            </div>
            <div className="round-card magic-hover magic-hover__square">
              <div className="round-num">02</div>
              <h3>Round I</h3>
              <p className="round-meta">100 &ndash; 150 Teams</p>
              <p>Screened teams present their approach. 2 winners advance from each group.</p>
            </div>
            <div className="round-card magic-hover magic-hover__square">
              <div className="round-num">03</div>
              <h3>Round II</h3>
              <p className="round-meta">~100 Teams</p>
              <p>Deeper evaluation. Teams are divided into 8 groups. 2 winners per group move to finals.</p>
            </div>
            <div className="round-card magic-hover magic-hover__square">
              <div className="round-num">F</div>
              <h3>Grand Finale</h3>
              <p className="round-meta">Top 16 Teams</p>
              <p>Live presentations. 1st, 2nd, and 3rd place winners crowned.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM STATEMENTS ────────────────────────────── */}
      <section className="section" id="problems">
        <div className="section-inner section-inner--wide">
          <h2 className="section-title">Problem Statements</h2>
          <p className="section-desc">Choose one out of <span style={{ color: 'var(--accent)' }}>50</span> total Problem Statements during registration. Allocation is first-come, first-served.</p>

          <div className="ps-controls">
            <div className="ps-search-wrap">
              <svg className="ps-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                className="ps-search"
                placeholder="Search problem statements..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setShowCount(PAGE_SIZE); }}
              />
            </div>
            <label className="ps-toggle">
              <input type="checkbox" checked={showAvailableOnly} onChange={e => { setShowAvailableOnly(e.target.checked); setShowCount(PAGE_SIZE); }} />
              <span className="ps-toggle-slider"></span>
              <span className="ps-toggle-label">Show available only</span>
            </label>
          </div>

          <div className="ps-grid">
            {visibleCards.map((ps) => (
              <div className="ps-card ps-card--visible" key={ps.id}>
                <div className="ps-card-head">
                  <span className="ps-id">{ps.id}</span>
                  <span className="ps-count">{psCounts[ps.id] || 0}/10 Teams</span>
                </div>
                <h4>{ps.title}</h4>
                <p>{ps.desc}</p>
                <span className="ps-label">Expected Output</span>
                <ul className="ps-list">
                  {ps.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>

          {matched.length === 0 && (
            <div className="ps-no-results">
              <p>No problem statements match your search.</p>
            </div>
          )}

          {remaining > 0 && (
            <div className="ps-load-more-wrap">
              <button className="btn btn-ghost ps-load-more" onClick={() => setShowCount(showCount + PAGE_SIZE)}>
                Show More <span>({remaining} more)</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="section section--alt" id="how">
        <div className="section-inner section-inner--wide">
          <h2 className="section-title">How to Register</h2>
          <p className="section-desc">Follow these steps to secure your spot in Technodium 2026.</p>
          <div className="steps-grid">
            <div className="step-card magic-hover magic-hover__square">
              <div className="step-num">01</div>
              <h4>Register on Unstop</h4>
              <p>Create your team on the Unstop platform first. Ensure exactly 4 members per squad.</p>
            </div>
            <div className="step-card magic-hover magic-hover__square">
              <div className="step-num">02</div>
              <h4>Account Setup</h4>
              <p>The team lead must create an account on this portal using their official email address.</p>
            </div>
            <div className="step-card magic-hover magic-hover__square">
              <div className="step-num">03</div>
              <h4>Select Problem</h4>
              <p>Login and browse the 50 problem statements. Pick one before slots fill up!</p>
            </div>
            <div className="step-card magic-hover magic-hover__square">
              <div className="step-num">04</div>
              <h4>Build & Submit</h4>
              <p>Develop your solution and submit your PPT/Deck by the deadline for evaluation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DETAILS & RULES ──────────────────────────────── */}
      <section className="section" id="details">
        <div className="section-inner">
          <h2 className="section-title">Hackathon Information</h2>
          <div className="details-grid">
            <div className="detail-block">
              <h3 className="detail-title">About the Event</h3>
              <p>Technodium 2026, organized by ASSCET club, is a Software Hackathon for undergraduate students. Participants will solve real-world challenges across various domains for a prize pool and internship opportunities.</p>
            </div>
            <div className="detail-block">
              <h3 className="detail-title">Eligibility & Format</h3>
              <ul className="detail-list">
                <li>Open to all undergraduate students.</li>
                <li>Team Size: 1-4 members (inter-college & inter-specialization teams allowed).</li>
                <li>Industry-related Problem Statements will be provided.</li>
              </ul>
            </div>
            <div className="detail-block">
              <h3 className="detail-title">Event Process</h3>
              <ul className="detail-list">
                <li>Problem statement selection.</li>
                <li>Submission of solution video & PPT for shortlisting.</li>
                <li>Grand Finale with live demos & presentations.</li>
              </ul>
            </div>
            <div className="detail-block">
              <h3 className="detail-title">Rules & Judging</h3>
              <ul className="detail-list">
                <li>Teams can propose their own problem statement.</li>
                <li>Strict deadlines; no late submissions allowed.</li>
                <li>Plagiarism will lead to immediate disqualification.</li>
                <li>Solutions are judged on: innovation, feasibility, scalability, technical execution, and presentation clarity.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
