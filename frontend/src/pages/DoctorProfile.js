import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, getDoctorByUserId, updateProfile, updateDoctorProfile } from '../services/api';

const HEX = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='140'%3E%3Cpolygon points='60,5 115,35 115,105 60,135 5,105 5,35' fill='none' stroke='rgba(100,180,255,0.1)' stroke-width='1.2'/%3E%3C/svg%3E")`;
const SPECS = ['Cardiologist','Dermatologist','Neurologist','Orthopedist','Pediatrician','Psychiatrist','Gynecologist','Ophthalmologist','ENT Specialist','Dentist','General Physician','Urologist'];
const SPEC_COLORS = {'Cardiologist':'#e53935','Dermatologist':'#8e24aa','Neurologist':'#1e88e5','Orthopedist':'#f4511e','Pediatrician':'#43a047','Psychiatrist':'#6d4c41','Gynecologist':'#d81b60','Ophthalmologist':'#00897b','ENT Specialist':'#fb8c00','Dentist':'#3949ab','General Physician':'#1976d2','Urologist':'#00acc1'};
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const formatDoctorName = n => !n ? 'Doctor' : /^Dr\.?\s*/i.test(n) ? n : `Dr. ${n}`;

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name:'', phone:'', specialization:'', experience:'', fees:'', bio:'' });
  const [selectedDays, setSelectedDays] = useState([]);
  const [availTimes, setAvailTimes] = useState({});

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'doctor') { navigate('/dashboard/patient'); return; }
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    try {
      const [prof, doc] = await Promise.all([getMyProfile(), getDoctorByUserId(user.id)]);
      setProfile(prof.data);
      setDoctor(doc.data);
      setForm({ name: prof.data.name||'', phone: prof.data.phone||'', specialization: doc.data.specialization||'', experience: doc.data.experience||'', fees: doc.data.fees||'', bio: doc.data.bio||'' });
      const days = doc.data.availability?.map(a => a.day) || [];
      setSelectedDays(days);
      const times = {};
      doc.data.availability?.forEach(a => { times[a.day] = { start: a.startTime||'09:00', end: a.endTime||'17:00' }; });
      setAvailTimes(times);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleDay = day => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
      const t = {...availTimes}; delete t[day]; setAvailTimes(t);
    } else {
      setSelectedDays([...selectedDays, day]);
      setAvailTimes({...availTimes, [day]: { start:'09:00', end:'17:00' }});
    }
  };

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const [profRes] = await Promise.all([
        updateProfile({ name: form.name, phone: form.phone }),
        updateDoctorProfile({ specialization: form.specialization, experience: form.experience, fees: form.fees, bio: form.bio, availability: selectedDays.map(d => ({ day: d, startTime: availTimes[d]?.start||'09:00', endTime: availTimes[d]?.end||'17:00' })) })
      ]);
      setProfile(profRes.data.user);
      updateUser({ ...user, name: profRes.data.user.name });
      setEditMode(false);
      setMsg('✅ Profile updated successfully!');
      setTimeout(() => setMsg(''), 3000);
      fetchAll();
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

  const name = profile?.name || '';
  const spec = doctor?.specialization || '';
  const color = SPEC_COLORS[spec] || '#1976d2';
  const initial = name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase() || 'D';
  const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#040c1e 0%,#071428 50%,#060f25 100%)', fontFamily:'Poppins,sans-serif', position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
        .pi:focus{border-color:rgba(66,165,245,.7)!important;background:rgba(25,118,210,.1)!important;box-shadow:0 0 0 3px rgba(25,118,210,.14)!important}
        .pi::placeholder{color:rgba(255,255,255,.28)}
        .pi option{background:#0a1628;color:#fff}
        .sb:hover:not(:disabled){transform:translateY(-2px)!important;box-shadow:0 14px 36px rgba(25,118,210,.5)!important}
      `}</style>
      <div style={{ position:'fixed', inset:0, backgroundImage:HEX, backgroundSize:'120px 140px', opacity:.55, pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', top:-100, right:-100, width:500, height:500, background:`radial-gradient(circle,${color}22 0%,transparent 65%)`, borderRadius:'50%', animation:'pulse 6s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>

      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(4,12,30,.97)', backdropFilter:'blur(18px)', borderBottom:'1px solid rgba(100,181,246,.15)', padding:'0 5%' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:68 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width:40, height:40, background:'linear-gradient(135deg,#1565c0,#42a5f5)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff', fontWeight:700, boxShadow:'0 4px 16px rgba(25,118,210,.45)', border:'1px solid rgba(255,255,255,.15)' }}>✚</div>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:18, lineHeight:1.1 }}>MediConsult</div>
              <div style={{ color:'rgba(255,255,255,.38)', fontSize:9, letterSpacing:2, textTransform:'uppercase' }}>Online Doctor Portal</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => navigate('/dashboard/doctor')} style={{ background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.75)', border:'1px solid rgba(255,255,255,.15)', padding:'9px 20px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>← Dashboard</button>
            <button onClick={logout} style={{ background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.7)', border:'1px solid rgba(255,255,255,.15)', padding:'9px 18px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'36px 5%', position:'relative', zIndex:1 }}>

        {/* Hero */}
        <div style={{ background:`linear-gradient(135deg,${color}33,rgba(10,22,50,.95))`, border:`1px solid ${color}44`, borderRadius:20, padding:'36px 32px', marginBottom:24, position:'relative', overflow:'hidden', backdropFilter:'blur(14px)' }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, background:`${color}18`, borderRadius:'50%' }}/>
          <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:`linear-gradient(135deg,${color},${color}99)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:32, flexShrink:0, boxShadow:`0 8px 28px ${color}55`, border:'3px solid rgba(255,255,255,.15)' }}>{initial}</div>
            <div style={{ flex:1 }}>
              <div style={{ color:'#e3f2fd', fontWeight:700, fontSize:24, marginBottom:4 }}>{formatDoctorName(name)}</div>
              <div style={{ color:'rgba(255,255,255,.6)', fontSize:13, marginBottom:8 }}>{spec} • {profile?.email}</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <span style={{ background:`${color}33`, color, border:`1px solid ${color}55`, borderRadius:50, padding:'4px 14px', fontSize:12, fontWeight:600 }}>{spec}</span>
                <span style={{ background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', borderRadius:50, padding:'4px 14px', fontSize:12 }}>{doctor?.experience} yrs exp</span>
                <span style={{ background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', borderRadius:50, padding:'4px 14px', fontSize:12 }}>₹{doctor?.fees} / visit</span>
                <span style={{ background:'rgba(255,185,0,.15)', color:'#fbbf24', border:'1px solid rgba(255,185,0,.3)', borderRadius:50, padding:'4px 14px', fontSize:12, fontWeight:500 }}>⭐ {doctor?.rating||4.5}</span>
              </div>
            </div>
            <button onClick={() => setEditMode(!editMode)} style={{ background:'rgba(255,255,255,.12)', color:'#fff', border:'1px solid rgba(255,255,255,.25)', padding:'10px 24px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', backdropFilter:'blur(10px)' }}>
              {editMode ? '✕ Cancel' : '✏️ Edit Profile'}
            </button>
          </div>
        </div>

        {msg && (
          <div style={{ background: msg.includes('✅') ? 'rgba(34,197,94,.12)' : 'rgba(220,38,38,.12)', border:`1px solid ${msg.includes('✅') ? 'rgba(34,197,94,.3)' : 'rgba(220,38,38,.3)'}`, borderRadius:10, padding:'12px 18px', color: msg.includes('✅') ? '#4ade80' : '#fca5a5', fontSize:13, marginBottom:18, textAlign:'center' }}>{msg}</div>
        )}

        {!editMode ? (
          <div>
            {/* Stats row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:22 }}>
              {[{ic:'⭐', l:'Rating', v:doctor?.rating||4.5, color:'#f59e0b'},{ic:'💰', l:'Consultation Fee', v:`₹${doctor?.fees}`, color:'#22c55e'},{ic:'🏥', l:'Experience', v:`${doctor?.experience} yrs`, color:color}].map((s,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,.05)', border:`1px solid ${s.color}33`, borderRadius:14, padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:46, height:46, background:`${s.color}22`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{s.ic}</div>
                  <div><div style={{ color:'#fff', fontWeight:700, fontSize:20 }}>{s.v}</div><div style={{ color:'rgba(255,255,255,.4)', fontSize:11 }}>{s.l}</div></div>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20 }}>
              {/* Info */}
              <div style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.09)', borderRadius:16, padding:'22px' }}>
                <div style={{ color:'rgba(255,255,255,.5)', fontSize:11, fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:16 }}>Contact Info</div>
                {[{ic:'📱', l:'Phone', v:profile?.phone||'—'},{ic:'✉️', l:'Email', v:profile?.email||'—'}].map((item,i) => (
                  <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'10px 0', borderBottom: i===0?'1px solid rgba(255,255,255,.06)':'none' }}>
                    <span style={{ fontSize:18, opacity:.7 }}>{item.ic}</span>
                    <div><div style={{ color:'rgba(255,255,255,.38)', fontSize:10 }}>{item.l}</div><div style={{ color:'#fff', fontSize:13, fontWeight:500 }}>{item.v}</div></div>
                  </div>
                ))}
              </div>

              {/* Availability */}
              <div style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.09)', borderRadius:16, padding:'22px' }}>
                <div style={{ color:'rgba(255,255,255,.5)', fontSize:11, fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:16 }}>Availability</div>
                {doctor?.availability?.length > 0 ? (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {doctor.availability.map(a => (
                      <div key={a.day} style={{ background: a.day===today?'rgba(34,197,94,.15)':'rgba(25,118,210,.15)', color: a.day===today?'#4ade80':'#64b5f6', border:`1px solid ${a.day===today?'rgba(34,197,94,.3)':'rgba(25,118,210,.3)'}`, borderRadius:50, padding:'5px 16px', fontSize:12, fontWeight:500 }}>
                        {a.day===today ? `✅ ${a.day}` : a.day}
                      </div>
                    ))}
                  </div>
                ) : <div style={{ color:'rgba(255,255,255,.35)', fontSize:13 }}>No availability set yet</div>}
              </div>
            </div>

            {/* Bio */}
            {doctor?.bio && (
              <div style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.09)', borderRadius:16, padding:'22px', marginBottom:20 }}>
                <div style={{ color:'rgba(255,255,255,.5)', fontSize:11, fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>About</div>
                <p style={{ color:'rgba(255,255,255,.7)', fontSize:14, lineHeight:1.8 }}>{doctor.bio}</p>
              </div>
            )}

            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => navigate('/dashboard/doctor')} style={{ flex:1, padding:13, background:`linear-gradient(135deg,${color},${color}cc)`, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif', boxShadow:`0 8px 22px ${color}35` }}>📅 View Dashboard</button>
              <button onClick={() => navigate('/doctors')} style={{ flex:1, padding:13, background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.75)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>🏥 Doctor Directory</button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div style={{ background:'rgba(10,22,50,.8)', border:'1px solid rgba(100,181,246,.18)', borderRadius:18, padding:'32px', backdropFilter:'blur(14px)', boxShadow:'0 16px 48px rgba(0,0,0,.4)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg,transparent,rgba(100,181,246,.6),transparent)' }}/>
            <div style={{ color:'rgba(255,255,255,.7)', fontSize:14, fontWeight:600, marginBottom:22 }}>✏️ Edit Your Professional Profile</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input className="pi" type="text" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Your full name" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input className="pi" type="text" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="+91 9XXXXXXXXX" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Specialization</label>
                <select className="pi" value={form.specialization} onChange={e => setForm({...form, specialization:e.target.value})} style={inp}>
                  <option value="">Select Specialization</option>
                  {SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Experience (years)</label>
                <input className="pi" type="number" value={form.experience} onChange={e => setForm({...form, experience:e.target.value})} placeholder="Years of experience" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Consultation Fees (₹)</label>
                <input className="pi" type="number" value={form.fees} onChange={e => setForm({...form, fees:e.target.value})} placeholder="Fee per consultation" style={inp}/>
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={lbl}>Professional Bio</label>
              <textarea className="pi" value={form.bio} onChange={e => setForm({...form, bio:e.target.value})} placeholder="Describe your expertise and experience..." rows={4} style={{ ...inp, resize:'vertical' }}/>
            </div>

            {/* Availability picker */}
            <div style={{ marginBottom:24 }}>
              <div style={{ color:'rgba(255,255,255,.55)', fontSize:12, fontWeight:500, marginBottom:12, letterSpacing:.3 }}>AVAILABILITY DAYS</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:16 }}>
                {DAYS.map(day => (
                  <div key={day} onClick={() => toggleDay(day)} style={{ background: selectedDays.includes(day) ? 'rgba(25,118,210,.25)' : 'rgba(255,255,255,.05)', border:`2px solid ${selectedDays.includes(day) ? 'rgba(66,165,245,.7)' : 'rgba(255,255,255,.12)'}`, borderRadius:10, padding:'8px 16px', cursor:'pointer', color: selectedDays.includes(day) ? '#90caf9' : 'rgba(255,255,255,.45)', fontSize:13, fontWeight:500, transition:'all .2s' }}>
                    {selectedDays.includes(day) ? '✓ ' : ''}{day}
                  </div>
                ))}
              </div>
              {selectedDays.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {selectedDays.map(day => (
                    <div key={day} style={{ display:'flex', alignItems:'center', gap:14, background:'rgba(25,118,210,.08)', border:'1px solid rgba(25,118,210,.2)', borderRadius:10, padding:'10px 16px' }}>
                      <span style={{ color:'#64b5f6', fontSize:13, fontWeight:600, minWidth:90 }}>{day}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ color:'rgba(255,255,255,.4)', fontSize:12 }}>Start</span>
                        <input className="pi" type="time" value={availTimes[day]?.start||'09:00'} onChange={e => setAvailTimes({...availTimes, [day]: {...availTimes[day], start:e.target.value}})} style={{ ...inp, width:120, padding:'6px 10px', colorScheme:'dark' }}/>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ color:'rgba(255,255,255,.4)', fontSize:12 }}>End</span>
                        <input className="pi" type="time" value={availTimes[day]?.end||'17:00'} onChange={e => setAvailTimes({...availTimes, [day]: {...availTimes[day], end:e.target.value}})} style={{ ...inp, width:120, padding:'6px 10px', colorScheme:'dark' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:12 }}>
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
