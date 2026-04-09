import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDoctors } from '../services/api';

const formatDoctorName = n => !n ? 'Doctor' : /^Dr\.?\s*/i.test(n) ? n : `Dr. ${n}`;

const SPEC_COLORS = {
  'Cardiologist':'#e53935','Dermatologist':'#8e24aa','Neurologist':'#1e88e5',
  'Orthopedist':'#f4511e','Pediatrician':'#43a047','Psychiatrist':'#7c3aed',
  'Gynecologist':'#d81b60','Ophthalmologist':'#00897b','ENT Specialist':'#fb8c00',
  'Dentist':'#3949ab','General Physician':'#1976d2','Urologist':'#00acc1',
};

const SPECS = [
  'All','Cardiologist','Dermatologist','Neurologist','Orthopedist',
  'Pediatrician','Psychiatrist','Gynecologist','Ophthalmologist',
  'ENT Specialist','Dentist','General Physician','Urologist',
];

/* SVG icons per speciality — no emoji */
const SpecIcon = ({ spec, size = 18, color = '#3FA7A3' }) => {
  const s = { width:size, height:size, display:'block' };
  const p = { fill:'none', stroke:color, strokeWidth:1.8, strokeLinecap:'round', strokeLinejoin:'round' };
  switch (spec) {
    case 'All':           return <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'Cardiologist':  return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case 'Dermatologist': return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'Neurologist':   return <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="3"/><path d="M6.343 6.343a8 8 0 1 0 11.314 11.314A8 8 0 0 0 6.343 6.343z"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>;
    case 'Orthopedist':   return <svg style={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'Pediatrician':  return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'Psychiatrist':  return <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>;
    case 'Gynecologist':  return <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="8" r="4"/><path d="M12 12v9M9 18h6"/></svg>;
    case 'Ophthalmologist': return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'ENT Specialist': return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
    case 'Dentist':       return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M12 2C9.5 2 6 4 6 8c0 3 1 5 2 7s1.5 5 4 5 3-3 4-5 2-4 2-7c0-4-3.5-6-6-6z"/></svg>;
    case 'General Physician': return <svg style={s} viewBox="0 0 24 24" {...p}><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>;
    case 'Urologist':     return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M12 22V12M12 12C12 12 7 9 7 5a5 5 0 0 1 10 0c0 4-5 7-5 7z"/></svg>;
    default:              return <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
  }
};

export function DoctorList() {
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const [doctors,    setDoctors]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [activeSpec, setActiveSpec] = useState('All');
  const [showBanner, setShowBanner] = useState(true);
  const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try { const r = await getDoctors(); setDoctors(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = doctors.filter(d => {
    const n = d.userId?.name || '', s = d.specialization || '';
    return (n.toLowerCase().includes(search.toLowerCase()) || s.toLowerCase().includes(search.toLowerCase()))
      && (activeSpec === 'All' || s === activeSpec);
  });

  const handleBook = id => {
    if (!user) { navigate('/register'); return; }
    if (user.role === 'doctor') { alert('Doctors cannot book appointments.'); return; }
    navigate(`/book/${id}`);
  };

  const IconLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
      <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.2)" stroke="none"/>
    </svg>
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0B1F3A 0%,#0E3A5F 35%,#071828 100%)', fontFamily:"'Poppins',sans-serif", position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        @keyframes pulse   { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

        .dl-navlink        { color:rgba(255,255,255,0.72); font-size:14px; font-weight:500; padding:7px 14px; cursor:pointer; transition:color .2s; }
        .dl-navlink:hover  { color:#3FA7A3; }
        .dl-navlink.active { color:#3FA7A3; border-bottom:2px solid #3FA7A3; }

        .dl-chip           { border-radius:50px; padding:7px 16px; cursor:pointer; transition:all .25s; white-space:nowrap; display:flex; align-items:center; gap:7px; }
        .dl-chip:hover     { transform:translateY(-2px); border-color:rgba(63,167,163,0.6)!important; background:rgba(63,167,163,0.12)!important; }

        .dl-card           { transition:all .32s; }
        .dl-card:hover     { transform:translateY(-5px)!important; }

        .dl-book           { transition:all .25s; }
        .dl-book:hover     { transform:translateY(-2px)!important; filter:brightness(1.12)!important; box-shadow:0 10px 28px rgba(63,167,163,0.5)!important; }

        .dl-view           { transition:all .25s; }
        .dl-view:hover     { background:rgba(63,167,163,0.12)!important; border-color:rgba(63,167,163,0.5)!important; color:#fff!important; }

        .dl-search::placeholder { color:rgba(255,255,255,0.28); }
        .dl-search:focus        { outline:none; }

        @media (max-width:768px) {
          .dl-card-inner    { flex-direction:column!important; align-items:flex-start!important; }
          .dl-btns          { flex-direction:row!important; min-width:unset!important; width:100%!important; }
          .dl-btns button   { flex:1!important; }
          .dl-chips-wrap    { overflow-x:auto!important; flex-wrap:nowrap!important; padding-bottom:6px!important; }
          .dl-nav-extra     { display:none!important; }
        }
      `}</style>

      {/* ── Background glows ── */}
      <div style={{ position:'fixed', top:-80, right:-80, width:440, height:440, background:'radial-gradient(circle,rgba(63,167,163,0.14) 0%,transparent 65%)', borderRadius:'50%', animation:'pulse 6s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:-60, left:-60, width:360, height:360, background:'radial-gradient(circle,rgba(25,118,210,0.12) 0%,transparent 65%)', borderRadius:'50%', animation:'pulse 7s ease-in-out infinite reverse', pointerEvents:'none', zIndex:0 }}/>

      {/* ── Hex SVG background ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', opacity:.45, zIndex:0 }}>
        <svg width="100%" height="100%" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <polygon points="80,60 118,82 118,126 80,148 42,126 42,82"          fill="none" stroke="rgba(63,167,163,0.2)"  strokeWidth="1"/>
          <polygon points="1100,80 1138,102 1138,146 1100,168 1062,146 1062,102" fill="none" stroke="rgba(25,118,210,0.18)" strokeWidth="1"/>
          <polygon points="60,750 98,772 98,816 60,838 22,816 22,772"          fill="none" stroke="rgba(63,167,163,0.16)" strokeWidth="1"/>
          <polygon points="1080,720 1118,742 1118,786 1080,808 1042,786 1042,742" fill="none" stroke="rgba(25,118,210,0.14)" strokeWidth="1"/>
          <polygon points="580,30 618,52 618,96 580,118 542,96 542,52"          fill="none" stroke="rgba(63,167,163,0.12)" strokeWidth="1"/>
          <line x1="118"  y1="104" x2="542"  y2="74"  stroke="rgba(63,167,163,0.1)"  strokeWidth="0.8"/>
          <line x1="1062" y1="124" x2="618"  y2="74"  stroke="rgba(25,118,210,0.1)"  strokeWidth="0.8"/>
          <circle cx="118"  cy="104" r="2.5" fill="#3FA7A3" opacity="0.4"/>
          <circle cx="1062" cy="124" r="2.5" fill="#1976d2" opacity="0.4"/>
          <circle cx="580"  cy="74"  r="2.5" fill="#3FA7A3" opacity="0.35"/>
        </svg>
      </div>

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(11,31,58,0.7)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(63,167,163,0.18)', padding:'0 5%' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:66 }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#1976d2,#3FA7A3)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(63,167,163,0.4)', flexShrink:0 }}>
              <IconLogo/>
            </div>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:16, lineHeight:1.1 }}>MediConsult</div>
              <div style={{ color:'rgba(255,255,255,0.38)', fontSize:8, letterSpacing:2, textTransform:'uppercase' }}>Online Doctor Portal</div>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span className="dl-navlink" onClick={() => navigate('/')}>Home</span>
            <span style={{ color:'rgba(255,255,255,0.2)', fontSize:16 }}>|</span>
            <span className="dl-navlink active" onClick={() => navigate('/doctors')}>Doctors</span>
            <span style={{ color:'rgba(255,255,255,0.2)', fontSize:16 }}>|</span>

            {!user ? (
              <>
                <span className="dl-navlink" onClick={() => navigate('/login')}>Login</span>
                <button onClick={() => navigate('/register')}
                  style={{ background:'linear-gradient(135deg,#1976d2,#3FA7A3)', color:'#fff', border:'none', padding:'9px 22px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Poppins',sans-serif", boxShadow:'0 0 16px rgba(63,167,163,0.35)' }}>
                  Register Free
                </button>
              </>
            ) : (
              <>
                <span className="dl-navlink" onClick={() => navigate(user.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient')}>Dashboard</span>
                <div onClick={() => navigate(user.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient')}
                  style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#1976d2,#3FA7A3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 0 12px rgba(63,167,163,0.4)', marginLeft:4 }}>
                  {user.name?.replace(/^Dr\.?\s*/i,'').charAt(0).toUpperCase()}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 5% 60px', position:'relative', zIndex:1 }}>

        {/* Page heading */}
        <div style={{ marginBottom:24, animation:'fadeUp .6s ease both' }}>
          <h1 style={{ color:'#fff', fontSize:'clamp(22px,3vw,32px)', fontWeight:800, marginBottom:6 }}>
            Find Your <span style={{ color:'#3FA7A3' }}>Doctor</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14 }}>
            Browse verified specialists and book consultations instantly
          </p>
        </div>

        {/* ── Guest banner ── */}
        {showBanner && !user && (
          <div style={{ background:'rgba(63,167,163,0.08)', border:'1px solid rgba(63,167,163,0.3)', borderRadius:14, padding:'14px 20px', marginBottom:22, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, backdropFilter:'blur(10px)', animation:'fadeUp .6s ease both' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'rgba(63,167,163,0.18)', border:'1px solid rgba(63,167,163,0.35)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3FA7A3" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <span style={{ color:'rgba(255,255,255,0.82)', fontSize:13, fontWeight:500 }}>Register to book appointments with our specialist doctors</span>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={() => navigate('/register')}
                style={{ background:'linear-gradient(135deg,#1976d2,#3FA7A3)', color:'#fff', border:'none', padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Poppins',sans-serif", boxShadow:'0 4px 14px rgba(63,167,163,0.35)' }}>
                Register Free
              </button>
              <button onClick={() => navigate('/login')}
                style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.72)', border:'1px solid rgba(255,255,255,0.15)', padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
                Login
              </button>
              <button onClick={() => setShowBanner(false)}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.35)', fontSize:18, cursor:'pointer', lineHeight:1, padding:'4px 6px' }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {/* ── Search bar ── */}
        <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(63,167,163,0.28)', borderRadius:12, padding:'12px 18px', display:'flex', alignItems:'center', gap:12, marginBottom:18, backdropFilter:'blur(10px)', animation:'fadeUp .65s ease both' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(63,167,163,0.7)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="dl-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search doctors, specialities, conditions..."
            style={{ flex:1, background:'none', border:'none', color:'#fff', fontSize:14, fontFamily:"'Poppins',sans-serif" }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:18, cursor:'pointer', lineHeight:1, padding:'2px 4px' }}>
              ✕
            </button>
          )}
        </div>

        {/* ── Speciality filter chips ── */}
        <div className="dl-chips-wrap" style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:22, animation:'fadeUp .7s ease both' }}>
          {SPECS.map(s => {
            const active = activeSpec === s;
            const col    = s === 'All' ? '#3FA7A3' : (SPEC_COLORS[s] || '#3FA7A3');
            return (
              <div key={s} className="dl-chip"
                onClick={() => setActiveSpec(s)}
                style={{
                  background: active ? `${col}22` : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${active ? col : 'rgba(255,255,255,0.12)'}`,
                  boxShadow: active ? `0 0 12px ${col}44` : 'none',
                }}>
                <SpecIcon spec={s} size={15} color={active ? col : 'rgba(255,255,255,0.45)'}/>
                <span style={{ color: active ? col : 'rgba(255,255,255,0.6)', fontSize:12, fontWeight: active ? 700 : 500 }}>{s}</span>
              </div>
            );
          })}
        </div>

        {/* ── Results count + clear ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13 }}>
            {loading ? 'Loading...' : (
              <>{activeSpec !== 'All' ? activeSpec : 'All Doctors'} <span style={{ color:'#3FA7A3', fontWeight:600 }}>({filtered.length} found)</span></>
            )}
          </div>
          {activeSpec !== 'All' && (
            <button onClick={() => setActiveSpec('All')}
              style={{ background:'rgba(63,167,163,0.1)', border:'1px solid rgba(63,167,163,0.3)', color:'#3FA7A3', padding:'5px 14px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
              ✕ Clear filter
            </button>
          )}
        </div>

        {/* ── Doctor cards ── */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(255,255,255,0.4)' }}>
            <div style={{ width:48, height:48, border:'3px solid rgba(63,167,163,0.2)', borderTop:'3px solid #3FA7A3', borderRadius:'50%', margin:'0 auto 20px', animation:'pulse 1s linear infinite' }}/>
            <div style={{ fontSize:15 }}>Loading doctors...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'rgba(255,255,255,0.4)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(63,167,163,0.4)" strokeWidth="1.5" strokeLinecap="round" style={{ margin:'0 auto 16px', display:'block' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <div style={{ fontSize:16, marginBottom:8 }}>No doctors found</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)' }}>Try a different search or speciality</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {filtered.map((doc, idx) => {
              const name     = doc.userId?.name || '';
              const spec     = doc.specialization || '';
              const color    = SPEC_COLORS[spec] || '#3FA7A3';
              const initial  = name.replace(/^Dr\.?\s*/i,'').charAt(0).toUpperCase() || 'D';
              const days     = doc.availability?.map(a => a.day) || [];
              const avToday  = days.includes(today);

              return (
                <div key={doc._id} className="dl-card"
                  style={{
                    background: 'rgba(10,26,58,0.82)',
                    border: `1px solid ${color}38`,
                    borderRadius: 16,
                    overflow: 'hidden',
                    backdropFilter: 'blur(14px)',
                    boxShadow: `0 0 20px ${color}22, 0 8px 32px rgba(0,0,0,0.45)`,
                    animation: `fadeUp .5s ease ${idx * 0.06}s both`,
                  }}>

                  {/* Coloured top accent bar */}
                  <div style={{ height:3, background:`linear-gradient(90deg,${color},${color}66,transparent)` }}/>

                  {/* Top shimmer */}
                  <div style={{ position:'absolute', pointerEvents:'none', left:'5%', right:'5%', height:1, background:`linear-gradient(90deg,transparent,${color}44,transparent)` }}/>

                  <div className="dl-card-inner" style={{ padding:'20px 24px', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>

                    {/* Avatar */}
                    <div style={{ width:60, height:60, borderRadius:'50%', background:`linear-gradient(135deg,${color},${color}99)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:22, flexShrink:0, boxShadow:`0 4px 20px ${color}55`, border:'2px solid rgba(255,255,255,0.15)' }}>
                      {initial}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:180 }}>
                      {/* Name + badge */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
                        <div style={{ color:'#e3f2fd', fontWeight:700, fontSize:16 }}>{formatDoctorName(name)}</div>
                        <div style={{ background:`${color}22`, color:color, border:`1px solid ${color}55`, borderRadius:50, padding:'3px 13px', fontSize:11, fontWeight:600 }}>
                          {spec}
                        </div>
                      </div>

                      {/* Availability */}
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background: avToday ? '#22c55e' : '#f59e0b', boxShadow: avToday ? '0 0 7px rgba(34,197,94,0.8)' : '0 0 7px rgba(245,158,11,0.8)' }}/>
                        <span style={{ color: avToday ? '#4ade80' : '#fbbf24', fontSize:12, fontWeight:500 }}>
                          {avToday ? 'Available Today' : days.length > 0 ? `Next: ${days[0]}` : 'Check schedule'}
                        </span>
                      </div>

                      {/* Stats */}
                      <div style={{ display:'flex', gap:0, flexWrap:'wrap' }}>
                        {[
                          { l:'Experience', v:`${doc.experience || 0} yrs` },
                          { l:'Fees',       v:`₹${doc.fees || 0}`          },
                          { l:'Rating',     v:`${doc.rating || 4.5} ★`     },
                        ].map((st, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <div style={{ width:1, height:28, background:'rgba(255,255,255,0.1)', margin:'0 16px', alignSelf:'center' }}/>}
                            <div>
                              <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, marginBottom:2 }}>{st.l}</div>
                              <div style={{ color:'#e3f2fd', fontWeight:600, fontSize:13 }}>{st.v}</div>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="dl-btns" style={{ display:'flex', flexDirection:'column', gap:9, minWidth:160 }}>
                      <button className="dl-book"
                        onClick={() => handleBook(doc._id)}
                        style={{ padding:'11px 20px', background:'linear-gradient(135deg,#1976d2,#3FA7A3)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Poppins',sans-serif", boxShadow:'0 5px 18px rgba(63,167,163,0.38)' }}>
                        Book Appointment
                      </button>
                      <button className="dl-view"
                        onClick={() => navigate(`/doctor/${doc._id}`)}
                        style={{ padding:'10px 20px', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.65)', border:'1px solid rgba(63,167,163,0.25)', borderRadius:10, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ position:'relative', zIndex:1, textAlign:'center', padding:'22px 5%', borderTop:'1px solid rgba(63,167,163,0.1)', background:'rgba(6,15,28,0.5)' }}>
        <p style={{ color:'rgba(255,255,255,0.22)', fontSize:13 }}>© 2026 MediConsult. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default DoctorList;