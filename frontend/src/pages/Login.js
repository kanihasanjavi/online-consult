import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const ch = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); setFieldErrors(prev=>({...prev,[e.target.name]:''})); };

  const validateField = (name, value) => {
    if (name === 'email') { if (!value.trim()) return 'Email is required'; if (!emailRegex.test(value.trim())) return 'Enter a valid email (e.g. name@example.com)'; }
    if (name === 'password' && !value) return 'Password is required';
    return '';
  };
  const handleBlur = e => { const err = validateField(e.target.name, e.target.value); setFieldErrors(prev=>({...prev,[e.target.name]:err})); };

  const handleSubmit = async e => {
    e.preventDefault();
    const emailErr = validateField('email', form.email);
    const pwErr    = validateField('password', form.password);
    if (emailErr || pwErr) { setFieldErrors({ email: emailErr, password: pwErr }); return; }
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient');
    } catch (err) { setError(err.response?.data?.message || 'Login failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const IconLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
      <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.2)" stroke="none"/>
    </svg>
  );

  const FErr = ({ name }) => fieldErrors[name] ? <div style={{ color:'#fca5a5', fontSize:11, marginTop:4 }}>⚠ {fieldErrors[name]}</div> : null;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0B1F3A 0%,#0E3A5F 40%,#0B2E40 100%)', fontFamily:"'Poppins',sans-serif", position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes pulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .ln-input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(63,167,163,0.25); border-radius:9px; color:#fff; font-size:14px; font-family:'Poppins',sans-serif; transition:all .25s; outline:none; }
        .ln-input:focus { border-color:rgba(63,167,163,0.7)!important; background:rgba(63,167,163,0.08)!important; box-shadow:0 0 0 3px rgba(63,167,163,0.14)!important; }
        .ln-input.err { border-color:rgba(220,38,38,0.6)!important; }
        .ln-input::placeholder { color:rgba(255,255,255,0.3); }
        .ln-btn { width:100%; padding:14px; background:linear-gradient(135deg,#1976d2,#3FA7A3); color:#fff; border:none; border-radius:9px; font-size:15px; font-weight:700; font-family:'Poppins',sans-serif; cursor:pointer; box-shadow:0 8px 28px rgba(63,167,163,0.4); transition:all .3s; }
        .ln-btn:hover:not(:disabled) { transform:translateY(-2px)!important; box-shadow:0 14px 36px rgba(63,167,163,0.55)!important; }
        .ln-btn:disabled { opacity:.5; cursor:not-allowed; }
        .ln-nav-link { color:rgba(255,255,255,0.72); font-size:14px; font-weight:500; padding:7px 14px; cursor:pointer; }
        .ln-nav-link:hover { color:#3FA7A3; }
        .ln-link { background:none; border:none; color:#3FA7A3; font-weight:600; font-size:14px; cursor:pointer; font-family:'Poppins',sans-serif; }
        .ln-card { animation:fadeUp .7s ease both; }
      `}</style>
      <div style={{ position:'absolute', top:-100, right:-80, width:500, height:500, background:'radial-gradient(circle,rgba(63,167,163,0.15) 0%,transparent 65%)', borderRadius:'50%', animation:'pulse 6s ease-in-out infinite', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-80, left:-80, width:400, height:400, background:'radial-gradient(circle,rgba(25,118,210,0.12) 0%,transparent 65%)', borderRadius:'50%', animation:'pulse 7s ease-in-out infinite reverse', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', opacity:.5 }}>
        <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <polygon points="100,80 140,103 140,149 100,172 60,149 60,103" fill="none" stroke="rgba(63,167,163,0.18)" strokeWidth="1"/>
          <polygon points="950,120 995,145 995,195 950,220 905,195 905,145" fill="none" stroke="rgba(25,118,210,0.18)" strokeWidth="1"/>
          <polygon points="80,600 120,623 120,669 80,692 40,669 40,623" fill="none" stroke="rgba(25,118,210,0.14)" strokeWidth="1"/>
          <line x1="140" y1="126" x2="255" y2="90" stroke="rgba(63,167,163,0.15)" strokeWidth="0.8"/>
          <line x1="995" y1="170" x2="1060" y2="346" stroke="rgba(25,118,210,0.12)" strokeWidth="0.8"/>
          <circle cx="140" cy="126" r="3" fill="#3FA7A3" opacity="0.5"/>
          <circle cx="995" cy="170" r="3" fill="#1976d2" opacity="0.5"/>
        </svg>
      </div>
      <nav style={{ position:'relative', zIndex:10, padding:'0 5%', borderBottom:'1px solid rgba(63,167,163,0.15)', background:'rgba(11,31,58,0.6)', backdropFilter:'blur(18px)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:66 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={()=>navigate('/')}>
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#1976d2,#3FA7A3)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IconLogo/></div>
            <div><div style={{ color:'#fff', fontWeight:700, fontSize:16 }}>MediConsult</div><div style={{ color:'rgba(255,255,255,0.38)', fontSize:8, letterSpacing:2, textTransform:'uppercase' }}>Online Doctor Portal</div></div>
          </div>
          <div className="ln-nav-links" style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span className="ln-nav-link" onClick={()=>navigate('/')}>Home</span>
            <span style={{ color:'rgba(255,255,255,0.2)', fontSize:16 }}>|</span>
            <span className="ln-nav-link" onClick={()=>navigate('/doctors')}>Doctors</span>
            <span style={{ color:'rgba(255,255,255,0.2)', fontSize:16 }}>|</span>
            <button onClick={()=>navigate('/register')} style={{ background:'linear-gradient(135deg,#1976d2,#3FA7A3)', color:'#fff', border:'none', padding:'9px 22px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>Register Free</button>
          </div>
        </div>
      </nav>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 130px)', padding:'40px 20px', position:'relative', zIndex:2 }}>
        <div className="ln-card" style={{ width:'100%', maxWidth:440 }}>
          <div style={{ background:'rgba(10,26,58,0.82)', border:'1px solid rgba(63,167,163,0.25)', borderRadius:20, padding:'44px 40px', backdropFilter:'blur(24px)', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg,transparent,rgba(63,167,163,0.7),transparent)' }}/>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <svg width="72" height="88" viewBox="0 0 90 110" fill="none">
                <defs><linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1976d2" stopOpacity=".9"/><stop offset="100%" stopColor="#3FA7A3" stopOpacity=".8"/></linearGradient><linearGradient id="sg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3FA7A3"/><stop offset="100%" stopColor="#42a5f5"/></linearGradient></defs>
                <path d="M45 5 L80 20 L80 55 Q80 85 45 105 Q10 85 10 55 L10 20 Z" fill="url(#sg1)" stroke="url(#sg2)" strokeWidth="1.8"/>
                <path d="M45 15 L72 27 L72 55 Q72 78 45 95 Q18 78 18 55 L18 27 Z" fill="rgba(255,255,255,0.05)"/>
                <rect x="38" y="30" width="14" height="40" rx="3" fill="white" fillOpacity=".92"/>
                <rect x="25" y="43" width="40" height="14" rx="3" fill="white" fillOpacity=".92"/>
              </svg>
            </div>
            <h2 style={{ color:'#fff', fontSize:24, fontWeight:700, textAlign:'center', marginBottom:6 }}>Welcome Back</h2>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, textAlign:'center', marginBottom:26, lineHeight:1.6 }}>Sign in to your MediConsult account</p>
            {error && <div style={{ background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.35)', borderRadius:9, padding:'11px 16px', color:'#fca5a5', fontSize:13, marginBottom:18, textAlign:'center' }}>⚠️ {error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:14, position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:fieldErrors.email?'38%':'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(63,167,163,0.7)" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <input className={`ln-input${fieldErrors.email?' err':''}`} name="email" type="email" placeholder="Email address" value={form.email} onChange={ch} onBlur={handleBlur} autoComplete="email" style={{ padding:'13px 14px 13px 42px' }}/>
                <FErr name="email"/>
              </div>
              <div style={{ marginBottom:10, position:'relative' }}>
                <div style={{ position:'absolute', left:14, top:fieldErrors.password?'38%':'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(63,167,163,0.7)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input className={`ln-input${fieldErrors.password?' err':''}`} name="password" type={showPw?'text':'password'} placeholder="Password" value={form.password} onChange={ch} onBlur={handleBlur} autoComplete="current-password" style={{ padding:'13px 44px 13px 42px' }}/>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.38)', padding:0 }}>
                  {showPw ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
                <FErr name="password"/>
              </div>
              <div style={{ textAlign:'right', marginBottom:22 }}>
                <button type="button" style={{ background:'none', border:'none', color:'rgba(63,167,163,0.8)', fontSize:12, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>Forgot password?</button>
              </div>
              <button type="submit" className="ln-btn" disabled={loading}>{loading?'⏳ Signing in...':'Login →'}</button>
            </form>
            <div style={{ textAlign:'center', marginTop:20 }}>
              <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Don't have an account? </span>
              <button className="ln-link" onClick={()=>navigate('/register')}>Register Free</button>
            </div>
            <button onClick={()=>navigate('/')} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', marginTop:16, background:'none', border:'none', color:'rgba(255,255,255,0.25)', fontSize:12, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>← Back to Home</button>
          </div>
        </div>
      </div>
      <footer style={{ position:'relative', zIndex:2, textAlign:'center', padding:'18px 5%', borderTop:'1px solid rgba(63,167,163,0.1)', background:'rgba(6,15,28,0.5)' }}>
        <p style={{ color:'rgba(255,255,255,0.22)', fontSize:12 }}>© 2026 MediConsult. All rights reserved.</p>
      </footer>
    </div>
  );
}
