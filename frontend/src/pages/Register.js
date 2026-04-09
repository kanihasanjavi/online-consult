import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';

const SPECS = ['Cardiologist','Dermatologist','Neurologist','Orthopedist','Pediatrician','Psychiatrist','Gynecologist','Ophthalmologist','ENT Specialist','Dentist','General Physician','Urologist'];
const BLOOD = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function Register() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [step,    setStep]    = useState(1);
  const [agreed,  setAgreed]  = useState(false);
  const [error,   setError]   = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [form,    setForm]    = useState({
    name:'', email:'', password:'', confirmPassword:'', role:'',
    phone:'', bloodGroup:'', age:'', gender:'', city:'', country:'',
    specialization:'', experience:'', fees:'', bio:''
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
  const phoneRegex = /^[0-9]{10}$/;

  const capitalizeWords = v => v.replace(/\b\w/g, c => c.toUpperCase());

  const ch = e => {
    let val = e.target.value;
    if (e.target.name === 'name') val = capitalizeWords(val);
    setForm({ ...form, [e.target.name]: val });
    setError('');
    setFieldErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validateField = (name, value) => {
    if (name === 'name' && !value.trim()) return 'Full name is required';
    if (name === 'email') { if (!value.trim()) return 'Email is required'; if (!emailRegex.test(value.trim())) return 'Enter a valid email (e.g. name@example.com)'; }
    if (name === 'password') { if (!value) return 'Password is required'; if (value.length < 6) return 'Minimum 6 characters'; }
    if (name === 'confirmPassword' && value !== form.password) return 'Passwords do not match';
    if (name === 'phone' && value) { const d = value.replace(/[\s\-+]/g,''); if (!phoneRegex.test(d)) return 'Phone must be exactly 10 digits'; }
    return '';
  };

  const handleBlur = e => { const err = validateField(e.target.name, e.target.value); setFieldErrors(prev => ({ ...prev, [e.target.name]: err })); };

  const validateStep1 = () => {
    if (!form.name.trim()) return 'Full name is required';
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) return 'Please enter a valid email';   
    if (!form.password || form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!form.role) return 'Please select Patient or Doctor';
    if (!agreed) return 'Please agree to Terms and Conditions';
    return '';
  };

  const handleNext = () => { const e = validateStep1(); if (e) { setError(e); return; } setError(''); setStep(2); };

  const handleSubmit = async () => {
    if (form.phone) { const d = form.phone.replace(/[\s\-+]/g,''); if (!phoneRegex.test(d)) { setError('Phone number must be exactly 10 digits'); return; } }
    setLoading(true);
    try {
      const payload = { ...form }; delete payload.confirmPassword;
      const res = await registerUser(payload);
      login(res.data.user, res.data.token);
      navigate(form.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient');
    } catch (err) { setError(err.response?.data?.message || 'Registration failed. Try again.'); }
    finally { setLoading(false); }
  };

  const IconLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
      <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.2)" stroke="none"/>
    </svg>
  );

  const lbl = { display:'block', color:'rgba(255,255,255,0.52)', fontSize:11, fontWeight:500, marginBottom:5, letterSpacing:.3 };
  const FErr = ({ name }) => fieldErrors[name] ? <div style={{ color:'#fca5a5', fontSize:11, marginTop:4 }}>⚠ {fieldErrors[name]}</div> : null;

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0B1F3A 0%,#0E3A5F 40%,#0B2E40 100%)', fontFamily:"'Poppins',sans-serif", position:'relative', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes pulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .rg-input { width:100%; background:rgba(255,255,255,0.06); border:1px solid rgba(63,167,163,0.25); border-radius:9px; color:#fff; font-size:13px; font-family:'Poppins',sans-serif; outline:none; transition:all .25s; padding:12px 14px; box-sizing:border-box; }
        .rg-input:focus { border-color:rgba(63,167,163,0.7)!important; background:rgba(63,167,163,0.08)!important; box-shadow:0 0 0 3px rgba(63,167,163,0.14)!important; }
        .rg-input.err { border-color:rgba(220,38,38,0.6)!important; }
        .rg-input::placeholder { color:rgba(255,255,255,0.3); }
        .rg-input option { background:#0a1e30; color:#fff; }
        .rg-btn { width:100%; padding:13px; background:linear-gradient(135deg,#1976d2,#3FA7A3); color:#fff; border:none; border-radius:9px; font-size:14px; font-weight:700; font-family:'Poppins',sans-serif; cursor:pointer; box-shadow:0 8px 28px rgba(63,167,163,0.4); transition:all .3s; }
        .rg-btn:hover:not(:disabled) { transform:translateY(-2px)!important; box-shadow:0 14px 36px rgba(63,167,163,0.55)!important; }
        .rg-btn:disabled { opacity:.5; cursor:not-allowed; }
        .rg-nav-link { color:rgba(255,255,255,0.72); font-size:14px; font-weight:500; padding:7px 14px; cursor:pointer; transition:color .2s; }
        .rg-nav-link:hover { color:#3FA7A3; }
        .rg-link { background:none; border:none; color:#3FA7A3; font-weight:600; font-size:13px; cursor:pointer; font-family:'Poppins',sans-serif; }
        .rg-card { animation:fadeUp .7s ease both; }
        .rg-scroll { max-height:280px; overflow-y:auto; padding-right:4px; }
        .rg-scroll::-webkit-scrollbar { width:4px; }
        .rg-scroll::-webkit-scrollbar-thumb { background:rgba(63,167,163,0.35); border-radius:2px; }
      `}</style>
      <div style={{ position:'absolute', top:-100, right:-80, width:500, height:500, background:'radial-gradient(circle,rgba(63,167,163,0.15) 0%,transparent 65%)', borderRadius:'50%', animation:'pulse 6s ease-in-out infinite', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:-80, left:-80, width:400, height:400, background:'radial-gradient(circle,rgba(25,118,210,0.12) 0%,transparent 65%)', borderRadius:'50%', animation:'pulse 7s ease-in-out infinite reverse', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden', opacity:.5 }}>
        <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <polygon points="100,80 140,103 140,149 100,172 60,149 60,103" fill="none" stroke="rgba(63,167,163,0.18)" strokeWidth="1"/>
          <polygon points="300,40 345,65 345,115 300,140 255,115 255,65" fill="none" stroke="rgba(63,167,163,0.12)" strokeWidth="1"/>
          <polygon points="950,120 995,145 995,195 950,220 905,195 905,145" fill="none" stroke="rgba(25,118,210,0.18)" strokeWidth="1"/>
          <polygon points="1100,300 1140,323 1140,369 1100,392 1060,369 1060,323" fill="none" stroke="rgba(63,167,163,0.14)" strokeWidth="1"/>
          <line x1="140" y1="126" x2="255" y2="90" stroke="rgba(63,167,163,0.15)" strokeWidth="0.8"/>
          <circle cx="140" cy="126" r="3" fill="#3FA7A3" opacity="0.5"/>
          <circle cx="995" cy="170" r="3" fill="#1976d2" opacity="0.5"/>
        </svg>
      </div>
      <nav style={{ position:'relative', zIndex:10, padding:'0 5%', borderBottom:'1px solid rgba(63,167,163,0.15)', background:'rgba(11,31,58,0.6)', backdropFilter:'blur(18px)' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:66 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width:38, height:38, background:'linear-gradient(135deg,#1976d2,#3FA7A3)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IconLogo/></div>
            <div><div style={{ color:'#fff', fontWeight:700, fontSize:16 }}>MediConsult</div><div style={{ color:'rgba(255,255,255,0.38)', fontSize:8, letterSpacing:2, textTransform:'uppercase' }}>Online Doctor Portal</div></div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span className="rg-nav-link" onClick={() => navigate('/')}>Home</span>
            <span style={{ color:'rgba(255,255,255,0.2)', fontSize:16 }}>|</span>
            <button onClick={() => navigate('/login')} style={{ background:'linear-gradient(135deg,#1976d2,#3FA7A3)', color:'#fff', border:'none', padding:'9px 22px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>Login</button>
          </div>
        </div>
      </nav>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'calc(100vh - 130px)', padding:'32px 20px', position:'relative', zIndex:2 }}>
        <div className="rg-card" style={{ width:'100%', maxWidth:460 }}>
          <div style={{ background:'rgba(10,26,58,0.82)', border:'1px solid rgba(63,167,163,0.25)', borderRadius:20, padding:'38px 36px', backdropFilter:'blur(24px)', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:1, background:'linear-gradient(90deg,transparent,rgba(63,167,163,0.7),transparent)' }}/>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <svg width="64" height="80" viewBox="0 0 90 110" fill="none">
                <defs><linearGradient id="rg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1976d2" stopOpacity=".9"/><stop offset="100%" stopColor="#3FA7A3" stopOpacity=".8"/></linearGradient><linearGradient id="rg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3FA7A3"/><stop offset="100%" stopColor="#42a5f5"/></linearGradient></defs>
                <path d="M45 5 L80 20 L80 55 Q80 85 45 105 Q10 85 10 55 L10 20 Z" fill="url(#rg1)" stroke="url(#rg2)" strokeWidth="1.8"/>
                <rect x="38" y="30" width="14" height="40" rx="3" fill="white" fillOpacity=".92"/>
                <rect x="25" y="43" width="40" height="14" rx="3" fill="white" fillOpacity=".92"/>
              </svg>
            </div>
            <h2 style={{ color:'#fff', fontSize:22, fontWeight:700, textAlign:'center', marginBottom:4 }}>{step===1?'Create Your Account':'Complete Your Profile'}</h2>
            <p style={{ color:'rgba(255,255,255,0.38)', fontSize:12, textAlign:'center', marginBottom:20 }}>{step===1?'Join MediConsult — free forever':`Fill in your ${form.role==='doctor'?'professional':'health'} details`}</p>
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:22 }}>
              {[1,2].map(s=><div key={s} style={{ width:s===step?28:9, height:9, borderRadius:5, background:s<=step?'linear-gradient(135deg,#1976d2,#3FA7A3)':'rgba(255,255,255,0.15)', transition:'all .3s' }}/>)}
            </div>
            {error && <div style={{ background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.35)', borderRadius:9, padding:'10px 14px', color:'#fca5a5', fontSize:12, marginBottom:16, textAlign:'center' }}>⚠️ {error}</div>}

            {step===1 && (
              <div>
                <div style={{ marginBottom:12 }}><label style={lbl}>Full Name</label><input className={`rg-input${fieldErrors.name?' err':''}`} name="name" placeholder="Your Full Name" value={form.name} onChange={ch} onBlur={handleBlur}/><FErr name="name"/></div>
                <div style={{ marginBottom:12 }}><label style={lbl}>Email Address</label><input className={`rg-input${fieldErrors.email?' err':''}`} name="email" type="email" placeholder="your@email.com" value={form.email} onChange={ch} onBlur={handleBlur}/><FErr name="email"/></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                  <div style={{ position:'relative' }}>
                    <label style={lbl}>Password</label>
                    <input className={`rg-input${fieldErrors.password?' err':''}`} name="password" type={showPw?'text':'password'} placeholder="Min 6 chars" value={form.password} onChange={ch} onBlur={handleBlur} style={{ paddingRight:36 }}/>
                    <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:'absolute', right:10, top:28, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:0 }}>
                      {showPw ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                           : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                    <FErr name="password"/>
                  </div>
                  <div style={{ position:'relative' }}>
                    <label style={lbl}>Confirm</label>
                    <input className={`rg-input${fieldErrors.confirmPassword?' err':''}`} name="confirmPassword" type={showCpw?'text':'password'} placeholder="Repeat password" value={form.confirmPassword} onChange={ch} onBlur={handleBlur} style={{ paddingRight:36 }}/>
                    <button type="button" onClick={()=>setShowCpw(!showCpw)} style={{ position:'absolute', right:10, top:28, background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.35)', padding:0 }}>
                      {showCpw ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                             : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                    <FErr name="confirmPassword"/>
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>Register As</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[{v:'patient',label:'Patient',sub:'I need medical help'},{v:'doctor',label:'Doctor',sub:'I provide care'}].map(r=>(
                      <div key={r.v} onClick={()=>{setForm({...form,role:r.v});setError('');}} style={{ background:form.role===r.v?'rgba(63,167,163,0.18)':'rgba(255,255,255,0.05)', border:`2px solid ${form.role===r.v?'rgba(63,167,163,0.7)':'rgba(255,255,255,0.12)'}`, borderRadius:10, padding:'14px 12px', cursor:'pointer', textAlign:'center', transition:'all .2s' }}>
                        <div style={{ color:form.role===r.v?'#3FA7A3':'#fff', fontWeight:600, fontSize:13 }}>{r.label}</div>
                        <div style={{ color:'rgba(255,255,255,0.38)', fontSize:11, marginTop:2 }}>{r.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <div onClick={()=>setAgreed(!agreed)} style={{ width:18, height:18, borderRadius:4, flexShrink:0, border:`2px solid ${agreed?'#3FA7A3':'rgba(255,255,255,0.28)'}`, background:agreed?'rgba(63,167,163,0.3)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                    {agreed&&<span style={{ color:'#3FA7A3', fontSize:12, fontWeight:700 }}>✓</span>}
                  </div>
                  <span style={{ color:'rgba(255,255,255,0.45)', fontSize:12 }}>I agree to the <span style={{ color:'#3FA7A3' }}>Terms and Conditions</span></span>
                </div>
                <button className="rg-btn" onClick={handleNext}>Continue →</button>
                <div style={{ textAlign:'center', marginTop:16 }}>
                  <span style={{ color:'rgba(255,255,255,0.38)', fontSize:12 }}>Already have an account? </span>
                  <button className="rg-link" onClick={()=>navigate('/login')}>Login</button>
                </div>
              </div>
            )}

            {step===2 && (
              <div>
                <div className="rg-scroll">
                  <div style={{ marginBottom:12 }}>
                    <label style={lbl}>Phone Number (10 digits) *</label>
                    <input className={`rg-input${fieldErrors.phone?' err':''}`} name="phone" type="tel" placeholder="9876543210" value={form.phone} onChange={ch} onBlur={handleBlur} maxLength={10}/>
                    <FErr name="phone"/>
                  </div>
                  {form.role==='patient' ? (
                    <>
                      {[{n:'age',l:'Age',t:'number',ph:'Your age'},{n:'city',l:'City',t:'text',ph:'Your city'},{n:'country',l:'Country',t:'text',ph:'Your country'}].map(f=>(
                        <div key={f.n} style={{ marginBottom:12 }}><label style={lbl}>{f.l}</label><input className="rg-input" name={f.n} type={f.t} placeholder={f.ph} value={form[f.n]} onChange={ch}/></div>
                      ))}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                        <div><label style={lbl}>Blood Group</label><select className="rg-input" name="bloodGroup" value={form.bloodGroup} onChange={ch}><option value="">Select</option>{BLOOD.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
                        <div><label style={lbl}>Gender</label><select className="rg-input" name="gender" value={form.gender} onChange={ch}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom:12 }}><label style={lbl}>Specialization</label><select className="rg-input" name="specialization" value={form.specialization} onChange={ch}><option value="">Select Specialization</option>{SPECS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                        <div><label style={lbl}>Experience (years)</label><input className="rg-input" name="experience" type="number" placeholder="e.g. 5" value={form.experience} onChange={ch}/></div>
                        <div><label style={lbl}>Consultation Fee (₹)</label><input className="rg-input" name="fees" type="number" placeholder="e.g. 500" value={form.fees} onChange={ch}/></div>
                      </div>
                      <div style={{ marginBottom:12 }}><label style={lbl}>Professional Bio</label><textarea className="rg-input" name="bio" value={form.bio} onChange={ch} placeholder="Brief professional summary..." rows={3} style={{ resize:'vertical', paddingTop:12 }}/></div>
                    </>
                  )}
                </div>
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button onClick={()=>{setStep(1);setError('');}} style={{ flex:1, padding:12, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>← Back</button>
                  <button className="rg-btn" onClick={handleSubmit} disabled={loading} style={{ flex:2 }}>{loading?'⏳ Creating...':'✅ Create Account'}</button>
                </div>
              </div>
            )}
            <button onClick={()=>navigate('/')} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', marginTop:16, background:'none', border:'none', color:'rgba(255,255,255,0.22)', fontSize:12, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>← Back to Home</button>
          </div>
        </div>
      </div>
      <footer style={{ position:'relative', zIndex:2, textAlign:'center', padding:'18px 5%', borderTop:'1px solid rgba(63,167,163,0.1)', background:'rgba(6,15,28,0.5)' }}>
        <p style={{ color:'rgba(255,255,255,0.22)', fontSize:12 }}>© 2026 MediConsult. All rights reserved.</p>
      </footer>
    </div>
  );
}
