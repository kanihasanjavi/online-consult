import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateProfile } from '../services/api';

const HEX = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='140'%3E%3Cpolygon points='60,5 115,35 115,105 60,135 5,105 5,35' fill='none' stroke='rgba(100,180,255,0.1)' stroke-width='1.2'/%3E%3C/svg%3E")`;
const BLOOD = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function PatientProfile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name:'', phone:'', bloodGroup:'', age:'', gender:'', city:'', country:'' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'patient') { navigate('/dashboard/doctor'); return; }
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const r = await getMyProfile();
      setProfile(r.data);
      setForm({ name: r.data.name||'', phone: r.data.phone||'', bloodGroup: r.data.bloodGroup||'', age: r.data.age||'', gender: r.data.gender||'', city: r.data.city||'', country: r.data.country||'' });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const r = await updateProfile(form);
      setProfile(r.data.user);
      updateUser({ ...user, name: r.data.user.name });
      setEditMode(false);
      setMsg('✅ Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch(e) { setMsg('❌ Update failed. Please try again.'); }
    finally { setSaving(false); }
  };

  const inp = { width:'100%', padding:'12px 16px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(100,181,246,.22)', borderRadius:10, color:'#fff', fontSize:14, fontFamily:'Poppins,sans-serif', boxSizing:'border-box', outline:'none', transition:'all .25s' };
  const lbl = { display:'block', color:'rgba(255,255,255,.55)', fontSize:12, fontWeight:500, marginBottom:6, letterSpacing:.3 };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#040c1e', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Poppins,sans-serif', color:'rgba(255,255,255,.4)' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:48, marginBottom:16 }}>⏳</div><div>Loading profile...</div></div>
    </div>
  );

  const initial = profile?.name?.charAt(0).toUpperCase() || 'P';

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#040c1e 0%,#071428 50%,#060f25 100%)', fontFamily:'Poppins,sans-serif', position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
        .pi:focus{border-color:rgba(66,165,245,.7)!important;background:rgba(25,118,210,.1)!important;box-shadow:0 0 0 3px rgba(25,118,210,.14)!important}
        .pi::placeholder{color:rgba(255,255,255,.28)}
        .pi option{background:#0a1628;color:#fff}
        .sb:hover:not(:disabled){transform:translateY(-2px)!important;box-shadow:0 14px 36px rgba(25,118,210,.5)!important}
        .nh:hover{color:#fff!important;background:rgba(255,255,255,.08)!important;border-radius:8px}
      `}</style>
      <div style={{ position:'fixed', inset:0, backgroundImage:HEX, backgroundSize:'120px 140px', opacity:.55, pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', top:-100, right:-100, width:500, height:500, background:'radial-gradient(circle,rgba(25,118,210,.12) 0%,transparent 65%)', borderRadius:'50%', animation:'pulse 6s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>

      {/* NAVBAR */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(4,12,30,.97)', backdropFilter:'blur(18px)', borderBottom:'1px solid rgba(100,181,246,.15)', padding:'0 5%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:68 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width:40, height:40, background:'linear-gradient(135deg,#1565c0,#42a5f5)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff', fontWeight:700, boxShadow:'0 4px 16px rgba(25,118,210,.45)', border:'1px solid rgba(255,255,255,.15)' }}>✚</div>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:18, lineHeight:1.1 }}>MediConsult</div>
              <div style={{ color:'rgba(255,255,255,.38)', fontSize:9, letterSpacing:2, textTransform:'uppercase' }}>Online Doctor Portal</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={() => navigate('/dashboard/patient')} style={{ background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.75)', border:'1px solid rgba(255,255,255,.15)', padding:'9px 20px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>← Dashboard</button>
            <button onClick={logout} style={{ background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.7)', border:'1px solid rgba(255,255,255,.15)', padding:'9px 18px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:800, margin:'0 auto', padding:'36px 5%', position:'relative', zIndex:1 }}>

        {/* Hero card */}
        <div style={{ background:'linear-gradient(135deg,#1976d2,#7c3aed)', borderRadius:20, padding:'36px 32px', marginBottom:24, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, background:'rgba(255,255,255,.06)', borderRadius:'50%' }}/>
          <div style={{ position:'absolute', bottom:-30, left:'30%', width:160, height:160, background:'rgba(255,255,255,.04)', borderRadius:'50%' }}/>
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,.2)', border:'3px solid rgba(255,255,255,.35)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:32, flexShrink:0 }}>{initial}</div>
            <div style={{ flex:1 }}>
              <div style={{ color:'#fff', fontWeight:700, fontSize:24, marginBottom:4 }}>{profile?.name}</div>
              <div style={{ color:'rgba(255,255,255,.75)', fontSize:13, marginBottom:6 }}>{profile?.email}</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <span style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.25)', borderRadius:50, padding:'4px 14px', fontSize:12, fontWeight:500 }}>🤒 Patient</span>
                {profile?.bloodGroup && <span style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.25)', borderRadius:50, padding:'4px 14px', fontSize:12, fontWeight:500 }}>🩸 {profile.bloodGroup}</span>}
                {profile?.city && <span style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.25)', borderRadius:50, padding:'4px 14px', fontSize:12, fontWeight:500 }}>📍 {profile.city}</span>}
              </div>
            </div>
            <button onClick={() => setEditMode(!editMode)} style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'1px solid rgba(255,255,255,.3)', padding:'10px 24px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', backdropFilter:'blur(10px)', transition:'all .25s' }}>
              {editMode ? '✕ Cancel' : '✏️ Edit Profile'}
            </button>
          </div>
        </div>

        {msg && (
          <div style={{ background: msg.includes('✅') ? 'rgba(34,197,94,.12)' : 'rgba(220,38,38,.12)', border:`1px solid ${msg.includes('✅') ? 'rgba(34,197,94,.3)' : 'rgba(220,38,38,.3)'}`, borderRadius:10, padding:'12px 18px', color: msg.includes('✅') ? '#4ade80' : '#fca5a5', fontSize:13, marginBottom:18, textAlign:'center' }}>{msg}</div>
        )}

        {!editMode ? (
          /* View Mode */
          <div>
            <div style={{ color:'rgba(255,255,255,.55)', fontSize:12, fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:16 }}>Personal Information</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14, marginBottom:24 }}>
              {[
                { ic:'👤', l:'Full Name', v:profile?.name||'—' },
                { ic:'✉️', l:'Email', v:profile?.email||'—' },
                { ic:'📱', l:'Phone', v:profile?.phone||'—' },
                { ic:'🎂', l:'Age', v:profile?.age ? `${profile.age} years` : '—' },
                { ic:'👤', l:'Gender', v:profile?.gender ? profile.gender.charAt(0).toUpperCase()+profile.gender.slice(1) : '—' },
                { ic:'🩸', l:'Blood Group', v:profile?.bloodGroup||'—', special:true },
                { ic:'🏙️', l:'City', v:profile?.city||'—' },
                { ic:'🌍', l:'Country', v:profile?.country||'—' },
              ].map((item, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.09)', borderRadius:14, padding:'18px 20px', display:'flex', gap:14, alignItems:'center' }}>
                  <div style={{ width:44, height:44, background:'rgba(25,118,210,.15)', border:'1px solid rgba(25,118,210,.25)', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{item.ic}</div>
                  <div>
                    <div style={{ color:'rgba(255,255,255,.38)', fontSize:11, marginBottom:4 }}>{item.l}</div>
                    {item.special && item.v !== '—'
                      ? <span style={{ background:'#fef3c7', color:'#d97706', padding:'3px 12px', borderRadius:50, fontSize:14, fontWeight:700 }}>{item.v}</span>
                      : <div style={{ color:'#fff', fontWeight:600, fontSize:14 }}>{item.v}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Account created */}
            <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:18 }}>📅</span>
              <div style={{ color:'rgba(255,255,255,.45)', fontSize:13 }}>Account created: <span style={{ color:'rgba(255,255,255,.7)' }}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) : '—'}</span></div>
            </div>

            <div style={{ display:'flex', gap:12, marginTop:24 }}>
              <button onClick={() => navigate('/dashboard/patient')} style={{ flex:1, padding:13, background:'linear-gradient(135deg,#1976d2,#42a5f5)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', boxShadow:'0 8px 22px rgba(25,118,210,.35)' }}>📅 View Appointments</button>
              <button onClick={() => navigate('/doctors')} style={{ flex:1, padding:13, background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.75)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>👨‍⚕️ Find Doctors</button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div style={{ background:'rgba(10,22,50,.8)', border:'1px solid rgba(100,181,246,.18)', borderRadius:18, padding:'32px', backdropFilter:'blur(14px)', boxShadow:'0 16px 48px rgba(0,0,0,.4)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg,transparent,rgba(100,181,246,.6),transparent)' }}/>
            <div style={{ color:'rgba(255,255,255,.7)', fontSize:14, fontWeight:600, marginBottom:22 }}>✏️ Edit Your Profile</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input className="pi" type="text" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Your full name" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input className="pi" type="text" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="+91 9XXXXXXXXX" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Age</label>
                <input className="pi" type="number" value={form.age} onChange={e => setForm({...form, age:e.target.value})} placeholder="Your age" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Gender</label>
                <select className="pi" value={form.gender} onChange={e => setForm({...form, gender:e.target.value})} style={inp}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Blood Group</label>
                <select className="pi" value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup:e.target.value})} style={inp}>
                  <option value="">Select Blood Group</option>
                  {BLOOD.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>City</label>
                <input className="pi" type="text" value={form.city} onChange={e => setForm({...form, city:e.target.value})} placeholder="Your city" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Country</label>
                <input className="pi" type="text" value={form.country} onChange={e => setForm({...form, country:e.target.value})} placeholder="Your country" style={inp}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, marginTop:24 }}>
              <button onClick={() => setEditMode(false)} style={{ flex:1, padding:13, background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.7)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Cancel</button>
              <button className="sb" onClick={handleSave} disabled={saving} style={{ flex:2, padding:13, background: saving ? 'rgba(25,118,210,.5)' : 'linear-gradient(135deg,#1565c0,#1976d2,#42a5f5)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, fontFamily:'Poppins,sans-serif', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 8px 28px rgba(25,118,210,.45)', transition:'all .3s' }}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer style={{ position:'relative', zIndex:1, textAlign:'center', padding:'24px 5%', borderTop:'1px solid rgba(255,255,255,.05)', marginTop:40, background:'rgba(4,12,30,.5)' }}>
        <p style={{ color:'rgba(255,255,255,.25)', fontSize:13 }}>© 2026 MediConsult. All rights reserved.</p>
      </footer>
    </div>
  );
}
