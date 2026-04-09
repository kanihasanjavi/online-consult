import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const getDash = () => user?.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient';

  const IconCalendar = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
  const IconChat     = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
  const IconRx       = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>);
  const IconFile     = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
  const IconCard     = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);
  const IconStar     = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
  const IconLogo     = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.2)" stroke="none"/></svg>);

  const FEATURES = [
    { Icon: IconCalendar, title: 'Book Appointment',     sub: 'Schedule at your convenience',  teal: true  },
    { Icon: IconChat,     title: 'Live Chat',            sub: 'Real-time consultation',         teal: false },
    { Icon: IconRx,       title: 'Digital Prescription', sub: 'Secure e-prescriptions',        teal: true  },
    { Icon: IconFile,     title: 'Medical History',      sub: 'Complete health records',        teal: false },
    { Icon: IconCard,     title: 'Easy Payment',         sub: 'Secure transactions',            teal: true  },
    { Icon: IconStar,     title: 'Rate Your Doctor',     sub: 'Community-driven trust',         teal: false },
  ];

  const STEPS = [
    { n: '01', title: 'Register & Login',  desc: 'Create your free account as a patient or doctor in under 2 minutes.' },
    { n: '02', title: 'Find Your Doctor',  desc: 'Browse verified specialists and filter by expertise and availability.' },
    { n: '03', title: 'Book & Consult',    desc: 'Schedule a slot and consult securely via live chat or video call.'    },
  ];

  const sectionDivider = (fromColor, toColor, dotColor = '#3FA7A3') => (
    <div style={{ textAlign: 'center', marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ width: 60, height: 1, background: `linear-gradient(90deg,transparent,${dotColor})` }}/>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: `0 0 9px ${dotColor}` }}/>
        <div style={{ width: 60, height: 1, background: `linear-gradient(90deg,${dotColor},transparent)` }}/>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: '#0B1F3A', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes floatUp   { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-10px)} }
        @keyframes floatDown { 0%,100%{transform:translateY(0)}  50%{transform:translateY(10px)}  }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ecgDraw   { from{stroke-dashoffset:2400} to{stroke-dashoffset:0} }
        @keyframes glowPulse { 0%,100%{opacity:0.55} 50%{opacity:1} }

        .mc-navlink        { color:rgba(255,255,255,0.72); font-size:14px; font-weight:500; padding:7px 14px; cursor:pointer; transition:color .2s; text-decoration:none; }
        .mc-navlink:hover  { color:#3FA7A3; }
        .mc-navlink.active { color:#3FA7A3; border-bottom:2px solid #3FA7A3; }

        .mc-btn-pri        { background:linear-gradient(135deg,#1976d2,#3FA7A3); color:#fff; border:none; padding:14px 32px; border-radius:10px; font-size:15px; font-weight:700; cursor:pointer; box-shadow:0 6px 24px rgba(63,167,163,0.42); transition:all .28s; font-family:'Poppins',sans-serif; }
        .mc-btn-pri:hover  { transform:translateY(-3px) scale(1.03)!important; box-shadow:0 14px 36px rgba(63,167,163,0.55)!important; }

        .mc-btn-out        { background:transparent; color:#fff; border:1.5px solid rgba(63,167,163,0.58); padding:14px 32px; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; backdrop-filter:blur(10px); transition:all .28s; font-family:'Poppins',sans-serif; }
        .mc-btn-out:hover  { background:rgba(63,167,163,0.12)!important; border-color:rgba(63,167,163,0.9)!important; transform:translateY(-3px)!important; }

        .mc-btn-nav        { background:linear-gradient(135deg,#1976d2,#3FA7A3); color:#fff; border:none; padding:10px 22px; border-radius:9px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 0 18px rgba(63,167,163,0.35); transition:all .25s; font-family:'Poppins',sans-serif; }
        .mc-btn-nav:hover  { transform:translateY(-2px)!important; box-shadow:0 8px 24px rgba(63,167,163,0.5)!important; }

        .mc-btn-cta        { background:rgba(11,31,58,0.72); color:#fff; border:1.5px solid rgba(63,167,163,0.5); padding:14px 60px; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; box-shadow:0 4px 24px rgba(63,167,163,0.22); backdrop-filter:blur(12px); transition:all .3s; font-family:'Poppins',sans-serif; }
        .mc-btn-cta:hover  { background:rgba(25,118,210,0.32)!important; transform:translateY(-2px)!important; box-shadow:0 10px 32px rgba(63,167,163,0.4)!important; }

        .mc-btn-logout     { background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.7); border:1px solid rgba(255,255,255,0.15); padding:8px 16px; border-radius:8px; font-size:13px; cursor:pointer; font-family:'Poppins',sans-serif; transition:all .2s; }

        .mc-feat-card      { background:rgba(255,255,255,0.06); border:1px solid rgba(63,167,163,0.2); border-radius:16px; padding:22px 20px; backdrop-filter:blur(14px); display:flex; align-items:center; gap:16px; transition:all .3s; cursor:default; }
        .mc-feat-card:hover{ transform:translateY(-6px)!important; border-color:rgba(63,167,163,0.5)!important; box-shadow:0 16px 40px rgba(63,167,163,0.2)!important; background:rgba(255,255,255,0.1)!important; }

        .mc-step-card      { flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(63,167,163,0.18); border-radius:16px; padding:26px 22px; backdrop-filter:blur(12px); transition:all .3s; }
        .mc-step-card:hover{ transform:translateY(-5px)!important; border-color:rgba(63,167,163,0.4)!important; box-shadow:0 14px 36px rgba(63,167,163,0.15)!important; }

        .mc-hex-float      { animation:floatUp 4s ease-in-out infinite; }
        .mc-hex-float:nth-child(even) { animation-name:floatDown; }

        .mc-ecg-path {
          stroke-dasharray: 2400;
          stroke-dashoffset: 2400;
          animation: ecgDraw 5s linear infinite;
        }

        .mc-hero-content { animation: fadeInUp .9s ease both; }

        @media (max-width:900px) {
          .mc-hex-scene    { display:none!important; }
          .mc-hero-content { flex:1 1 100%!important; padding:48px 5% 32px!important; }
          .mc-feat-grid    { grid-template-columns:1fr 1fr!important; }
          .mc-step-wrap    { flex-direction:column!important; }
          .mc-hero-h1      { font-size:30px!important; }
        }
        @media (max-width:560px) {
          .mc-feat-grid    { grid-template-columns:1fr!important; }
          .mc-hero-h1      { font-size:24px!important; }
        }
      `}</style>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(11,31,58,0.96)' : 'rgba(11,31,58,0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(63,167,163,0.18)',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.35)' : 'none',
        transition: 'all .3s', padding: '0 5%',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 66 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#1976d2,#3FA7A3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 18px rgba(63,167,163,0.45)', flexShrink: 0 }}>
              <IconLogo />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, lineHeight: 1.1 }}>MediConsult</div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 8.5, letterSpacing: 2, textTransform: 'uppercase' }}>Online Doctor Portal</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="mc-navlink active" onClick={() => navigate('/')}>Home</span>
            <span className="mc-navlink"        onClick={() => navigate('/doctors')}>Doctors</span>
            {!user ? (
              <>
                <span className="mc-navlink" onClick={() => navigate('/login')}>Login</span>
                <button className="mc-btn-nav" onClick={() => navigate('/register')}>Register Free</button>
              </>
            ) : (
              <>
                <span className="mc-navlink" onClick={() => navigate(getDash())}>Dashboard</span>
                <div onClick={() => navigate(getDash())} style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1976d2,#3FA7A3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginLeft: 4, boxShadow: '0 0 12px rgba(63,167,163,0.4)' }}>
                  {user.name?.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
                </div>
                <button className="mc-btn-logout" onClick={logout} style={{ marginLeft: 8 }}>Logout</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      {/*
        FIX: Hero is now a proper 2-column flex layout.
        Left col = text content (flex:1, min-width:0)
        Right col = hex visual (flex:0 0 48%, self-contained, overflow:hidden)
        Nothing is position:absolute that spans both columns → zero overlap possible.
        ECG line sits BELOW both columns inside the section as a decorative strip.
      */}
      <section style={{ position: 'relative', minHeight: '100vh', background: 'linear-gradient(135deg,#0B1F3A 0%,#0E3A5F 38%,#0a3550 65%,#0B2E40 100%)', overflow: 'hidden', paddingTop: 66, display: 'flex', flexDirection: 'column' }}>

        {/* Subtle full-section background depth — purely decorative, z-index 0 */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 60%, rgba(25,118,210,0.08) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }}/>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(0deg,#071828,transparent)', pointerEvents: 'none', zIndex: 0 }}/>

        {/* ── Two-column row ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          {/* LEFT: Text content — strictly left half, never overflows */}
          <div className="mc-hero-content" style={{ flex: '0 0 52%', minWidth: 0, padding: '80px 0 80px 5%' }}>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(63,167,163,0.14)', border: '1px solid rgba(63,167,163,0.38)', borderRadius: 50, padding: '7px 18px', marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3FA7A3', boxShadow: '0 0 8px #3FA7A3' }}/>
              <span style={{ color: '#3FA7A3', fontSize: 13, fontWeight: 600, letterSpacing: '.3px' }}>Trusted by 10,000+ patients</span>
            </div>

            <h1 className="mc-hero-h1" style={{ fontSize: 'clamp(32px,4.5vw,58px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 18, textShadow: '0 0 40px rgba(63,167,163,0.18)' }}>
              Your Health,<br/>
              <span style={{ color: '#3FA7A3' }}>Our Priority</span>
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.64)', fontSize: 16, lineHeight: 1.78, marginBottom: 36, maxWidth: 420 }}>
              Consult experienced doctors online anytime, anywhere with ease. Digital healthcare at your fingertips.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
              <button className="mc-btn-pri" onClick={() => navigate('/doctors')}>Find a Doctor →</button>
              <button className="mc-btn-out" onClick={() => navigate('/register')}>Register Free</button>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(63,167,163,0.2)', borderRadius: 14, padding: '12px 22px', backdropFilter: 'blur(12px)', flexWrap: 'wrap', gap: 0 }}>
              {[{ v: '500+', l: 'Doctors' }, { v: '10k+', l: 'Patients' }, { v: '4.9 ★', l: 'Rating' }, { v: '24/7', l: 'Available' }].map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div style={{ width: 1, height: 34, background: 'rgba(63,167,163,0.25)', margin: '0 18px' }}/>}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{s.v}</div>
                    <div style={{ color: 'rgba(255,255,255,0.48)', fontSize: 11, marginTop: 1 }}>{s.l}</div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* RIGHT: Hex visual — strictly right half, overflow:hidden so nothing bleeds left */}
          <div className="mc-hex-scene" style={{ flex: '0 0 48%', minWidth: 0, height: '100%', overflow: 'hidden', pointerEvents: 'none', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
            <svg width="100%" height="100%" viewBox="0 0 560 620" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              <defs>
                <radialGradient id="hg1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#3FA7A3" stopOpacity="0.5"/><stop offset="100%" stopColor="#3FA7A3" stopOpacity="0"/></radialGradient>
                <radialGradient id="hg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#1976d2" stopOpacity="0.45"/><stop offset="100%" stopColor="#1976d2" stopOpacity="0"/></radialGradient>
              </defs>

              {/* Glow clouds — all within the 560×620 viewBox */}
              <ellipse cx="300" cy="200" rx="140" ry="120" fill="url(#hg2)" opacity="0.6"/>
              <ellipse cx="420" cy="380" rx="110" ry="100" fill="url(#hg1)" opacity="0.45"/>
              <ellipse cx="140" cy="470" rx="100" ry="85"  fill="url(#hg1)" opacity="0.28"/>

              {/* Background outline hexagons */}
              <polygon points="280,40  338,73  338,139 280,172 222,139 222,73"  fill="none" stroke="rgba(63,167,163,0.13)" strokeWidth="1.2"/>
              <polygon points="150,120 200,148 200,204 150,232 100,204 100,148" fill="none" stroke="rgba(63,167,163,0.1)"  strokeWidth="1"/>
              <polygon points="400,60  452,90  452,150 400,180 348,150 348,90"  fill="none" stroke="rgba(25,118,210,0.12)" strokeWidth="1"/>
              <polygon points="470,240 508,262 508,306 470,328 432,306 432,262" fill="none" stroke="rgba(63,167,163,0.12)" strokeWidth="1"/>
              <polygon points="90,320  136,346 136,398 90,424  44,398  44,346"  fill="none" stroke="rgba(25,118,210,0.1)"  strokeWidth="1"/>
              <polygon points="320,410 368,436 368,488 320,514 272,488 272,436" fill="none" stroke="rgba(63,167,163,0.11)" strokeWidth="1"/>

              {/* Connecting lines between hex centres */}
              <line x1="280" y1="110" x2="200" y2="152" stroke="rgba(63,167,163,0.28)"  strokeWidth="0.9"/>
              <line x1="280" y1="110" x2="398" y2="122" stroke="rgba(63,167,163,0.28)"  strokeWidth="0.9"/>
              <line x1="398" y1="122" x2="468" y2="262" stroke="rgba(25,118,210,0.22)"  strokeWidth="0.9"/>
              <line x1="200" y1="152" x2="90"  y2="346" stroke="rgba(63,167,163,0.2)"   strokeWidth="0.9"/>
              <line x1="468" y1="284" x2="398" y2="436" stroke="rgba(25,118,210,0.2)"   strokeWidth="0.9"/>
              <line x1="398" y1="436" x2="320" y2="462" stroke="rgba(63,167,163,0.22)"  strokeWidth="0.9"/>
              <line x1="90"  y1="372" x2="272" y2="460" stroke="rgba(63,167,163,0.18)"  strokeWidth="0.9"/>

              {/* Node glow dots */}
              <circle cx="280" cy="110" r="5"   fill="#3FA7A3" opacity="0.85"/><circle cx="280" cy="110" r="11"  fill="#3FA7A3" opacity="0.15"/>
              <circle cx="398" cy="122" r="4.5" fill="#1976d2" opacity="0.9"/> <circle cx="398" cy="122" r="10"  fill="#1976d2" opacity="0.16"/>
              <circle cx="200" cy="152" r="4"   fill="#3FA7A3" opacity="0.7"/>
              <circle cx="468" cy="284" r="5"   fill="#3FA7A3" opacity="0.85"/><circle cx="468" cy="284" r="11"  fill="#3FA7A3" opacity="0.13"/>
              <circle cx="90"  cy="372" r="4"   fill="#1976d2" opacity="0.68"/>
              <circle cx="398" cy="436" r="4.5" fill="#3FA7A3" opacity="0.78"/>
              <circle cx="320" cy="462" r="3.5" fill="#1976d2" opacity="0.62"/>

              {/* ── Hex icons — all inside the 560×620 viewport ── */}
              {/* HEART */}
              <g className="mc-hex-float">
                <polygon points="280,58 314,77 314,115 280,134 246,115 246,77" fill="rgba(14,58,95,0.9)" stroke="#3FA7A3" strokeWidth="1.4"/>
                <path d="M268,90 C268,85 272,81 276,81 C280,81 282,84 282,84 C282,84 284,81 288,81 C292,81 296,85 296,90 C296,97 282,106 282,106 C282,106 268,97 268,90Z" fill="#3FA7A3" opacity="0.88"/>
              </g>
              {/* CROSS */}
              <g className="mc-hex-float" style={{ animationDelay:'.5s' }}>
                <polygon points="152,138 180,154 180,186 152,202 124,186 124,154" fill="rgba(14,58,95,0.9)" stroke="#42a5f5" strokeWidth="1.4"/>
                <rect x="145" y="156" width="14" height="26" rx="2.5" fill="#42a5f5" opacity="0.9"/>
                <rect x="138" y="163" width="28" height="12" rx="2.5" fill="#42a5f5" opacity="0.9"/>
              </g>
              {/* DNA */}
              <g className="mc-hex-float" style={{ animationDelay:'1s' }}>
                <polygon points="400,78 430,95 430,129 400,146 370,129 370,95" fill="rgba(14,58,95,0.9)" stroke="#3FA7A3" strokeWidth="1.4"/>
                <path d="M388,90 C400,102 412,102 400,114 C388,126 400,126 388,138" fill="none" stroke="#3FA7A3"   strokeWidth="2"   strokeLinecap="round"/>
                <path d="M412,90 C400,102 388,102 400,114 C412,126 400,126 412,138" fill="none" stroke="#42a5f5" strokeWidth="2"   strokeLinecap="round"/>
                <line x1="390" y1="100" x2="410" y2="100" stroke="rgba(255,255,255,0.38)" strokeWidth="1.2"/>
                <line x1="390" y1="114" x2="410" y2="114" stroke="rgba(255,255,255,0.38)" strokeWidth="1.2"/>
                <line x1="390" y1="128" x2="410" y2="128" stroke="rgba(255,255,255,0.38)" strokeWidth="1.2"/>
              </g>
              {/* WIFI HEALTH */}
              <g className="mc-hex-float" style={{ animationDelay:'.3s' }}>
                <polygon points="468,258 500,276 500,312 468,330 436,312 436,276" fill="rgba(14,58,95,0.9)" stroke="#3FA7A3" strokeWidth="1.4"/>
                <path d="M450,298 C450,287 458,280 468,280 C478,280 486,287 486,298" fill="none" stroke="#3FA7A3" strokeWidth="1.9" opacity="0.45"/>
                <path d="M455,298 C455,291 461,286 468,286 C475,286 481,291 481,298" fill="none" stroke="#3FA7A3" strokeWidth="1.9" opacity="0.72"/>
                <circle cx="468" cy="304" r="3.5" fill="#3FA7A3"/>
              </g>
              {/* PILL */}
              <g className="mc-hex-float" style={{ animationDelay:'1.3s' }}>
                <polygon points="92,340 122,357 122,391 92,408 62,391 62,357" fill="rgba(14,58,95,0.9)" stroke="#42a5f5" strokeWidth="1.4"/>
                <rect x="79" y="362" width="26" height="14" rx="7" fill="none" stroke="#42a5f5" strokeWidth="1.8"/>
                <rect x="79" y="362" width="13" height="14" rx="7" fill="#42a5f5" opacity="0.8"/>
              </g>
              {/* HOSPITAL */}
              <g className="mc-hex-float" style={{ animationDelay:'.7s' }}>
                <polygon points="322,428 352,445 352,479 322,496 292,479 292,445" fill="rgba(14,58,95,0.9)" stroke="#3FA7A3" strokeWidth="1.4"/>
                <rect x="308" y="443" width="28" height="34" rx="2" fill="none" stroke="#3FA7A3" strokeWidth="1.4"/>
                <rect x="315" y="449" width="14" height="7"  rx="1.5" fill="#3FA7A3" opacity="0.8"/>
                <rect x="310" y="466" width="8"  height="10" rx="1.5" fill="#3FA7A3" opacity="0.6"/>
                <rect x="322" y="466" width="8"  height="10" rx="1.5" fill="#3FA7A3" opacity="0.6"/>
              </g>

              {/* Bokeh particles */}
              <circle cx="220" cy="235" r="3"   fill="#3FA7A3" opacity="0.32"/><circle cx="220" cy="235" r="7"   fill="#3FA7A3" opacity="0.09"/>
              <circle cx="445" cy="165" r="2.5" fill="#1976d2" opacity="0.48"/><circle cx="445" cy="165" r="5.5" fill="#1976d2" opacity="0.11"/>
              <circle cx="140" cy="510" r="2.5" fill="#3FA7A3" opacity="0.32"/>
              <circle cx="510" cy="455" r="3.5" fill="#3FA7A3" opacity="0.27"/><circle cx="510" cy="455" r="8"   fill="#3FA7A3" opacity="0.07"/>
              <circle cx="250" cy="535" r="2"   fill="#1976d2" opacity="0.35"/>
              <circle cx="368" cy="305" r="2.5" fill="#3FA7A3" opacity="0.26"/>
              <circle cx="185" cy="410" r="2"   fill="#1976d2" opacity="0.3"/>
              <circle cx="535" cy="350" r="3"   fill="#3FA7A3" opacity="0.23"/>
              <circle cx="65"  cy="255" r="2"   fill="#3FA7A3" opacity="0.22"/>
              <circle cx="540" cy="135" r="2.5" fill="#1976d2" opacity="0.28"/>
            </svg>
          </div>
        </div>

        {/* ECG line — sits below both columns, spans full width, z-index 0 */}
        <div style={{ position: 'relative', zIndex: 1, height: 44, overflow: 'hidden', flexShrink: 0 }}>
          <svg width="100%" height="44" viewBox="0 0 1200 44" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <polyline className="mc-ecg-path"
              points="0,24 80,24 96,24 108,10 118,38 126,6 134,38 142,24 220,24 300,24 316,24 328,12 336,34 342,8 348,34 354,24 440,24 520,24 536,24 548,12 556,34 562,8 568,34 574,24 660,24 740,24 756,24 768,12 776,34 782,8 788,34 794,24 880,24 960,24 976,24 988,12 996,34 1002,8 1008,34 1014,24 1100,24 1200,24"
              fill="none" stroke="rgba(63,167,163,0.52)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="0,24 1200,24" fill="none" stroke="rgba(63,167,163,0.1)" strokeWidth="0.8"/>
          </svg>
        </div>
      </section>

      {/* ═══════════ FEATURE CARDS ═══════════ */}
      <section style={{ background: 'linear-gradient(180deg,#071828 0%,#0a1e30 100%)', padding: '80px 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(63,167,163,0.09) 1.5px,transparent 1.5px)', backgroundSize: '36px 36px', pointerEvents: 'none' }}/>
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <h2 style={{ color: '#fff', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, marginBottom: 14 }}>Core Features</h2>
          </div>
          {sectionDivider()}
          <div className="mc-feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="mc-feat-card">
                <div style={{ width: 52, height: 52, borderRadius: 13, background: f.teal ? 'rgba(63,167,163,0.15)' : 'rgba(25,118,210,0.15)', border: `1px solid ${f.teal ? 'rgba(63,167,163,0.3)' : 'rgba(25,118,210,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: f.teal ? '#3FA7A3' : '#42a5f5' }}>
                  <f.Icon />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{f.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.44)', fontSize: 12, marginTop: 3 }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ OUR FEATURES ═══════════ */}
      <section style={{ background: 'linear-gradient(180deg,#0a1e30 0%,#0B1F3A 100%)', padding: '80px 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(25,118,210,0.07) 1.5px,transparent 1.5px)', backgroundSize: '40px 40px', pointerEvents: 'none' }}/>
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <h2 style={{ color: '#fff', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, marginBottom: 14 }}>Our Features</h2>
          </div>
          {sectionDivider()}
          <div className="mc-step-wrap" style={{ display: 'flex', gap: 16 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="mc-step-card">
                <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#1976d2,#3FA7A3)', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(63,167,163,0.4)', marginBottom: 16 }}>
                  <span style={{ transform: 'rotate(45deg)', color: '#fff', fontWeight: 800, fontSize: 15 }}>{s.n}</span>
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{s.title}</div>
                <p style={{ color: 'rgba(255,255,255,0.44)', fontSize: 13, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section style={{ background: 'linear-gradient(180deg,#0B1F3A 0%,#071828 100%)', padding: '80px 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle,rgba(63,167,163,0.07) 1.5px,transparent 1.5px)', backgroundSize: '38px 38px', pointerEvents: 'none' }}/>
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <h2 style={{ color: '#fff', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, marginBottom: 14 }}>How It Works</h2>
          </div>
          {sectionDivider()}
          <div className="mc-step-wrap" style={{ display: 'flex', gap: 16 }}>
            {[
              { n: '01', title: 'Register & Login',  desc: 'Create your account as a patient or doctor in minutes. Quick and secure.' },
              { n: '02', title: 'Find Your Doctor',  desc: 'Browse verified specialists and filter by expertise, availability and ratings.' },
              { n: '03', title: 'Book & Consult',    desc: 'Schedule a slot and consult securely via live chat anytime, anywhere.' },
            ].map((s, i) => (
              <div key={i} className="mc-step-card">
                <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#1976d2,#3FA7A3)', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(63,167,163,0.4)', marginBottom: 16 }}>
                  <span style={{ transform: 'rotate(45deg)', color: '#fff', fontWeight: 800, fontSize: 15 }}>{s.n}</span>
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{s.title}</div>
                <p style={{ color: 'rgba(255,255,255,0.44)', fontSize: 13, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section style={{ background: 'linear-gradient(135deg,#0E3A5F,#0B2E40,#071828)', padding: '96px 5%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 520, height: 260, background: 'radial-gradient(ellipse,rgba(63,167,163,0.13) 0%,transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: '28%', left: 0, right: 0, height: 32, opacity: .38, pointerEvents: 'none', overflow: 'hidden' }}>
          <svg width="100%" height="32" viewBox="0 0 900 32" preserveAspectRatio="none">
            <polyline points="0,16 80,16 94,16 104,7 112,25 118,4 124,25 130,16 220,16 310,16 324,16 332,8 338,24 344,4 350,24 356,16 460,16 570,16 584,16 592,8 598,24 604,4 610,24 616,16 720,16 810,16 824,16 832,8 838,24 844,4 850,24 856,16 900,16" fill="none" stroke="rgba(63,167,163,0.62)" strokeWidth="1.5"/>
          </svg>
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 700, marginBottom: 12 }}>Ready to consult a doctor?</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 32 }}>Join 10,000+ patients already using MediConsult</p>
          <button className="mc-btn-cta" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ background: '#060f1c', padding: '24px 5%', textAlign: 'center', borderTop: '1px solid rgba(63,167,163,0.12)' }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>© 2026 MediConsult. All rights reserved.</p>
      </footer>
    </div>
  );
}
