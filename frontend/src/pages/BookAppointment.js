import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDoctorById, getAvailableSlots, bookAppointment } from '../services/api';

const SPEC_COLORS = {'Cardiologist':'#e53935','Dermatologist':'#8e24aa','Neurologist':'#1e88e5','Orthopedist':'#f4511e','Pediatrician':'#43a047','Psychiatrist':'#6d4c41','Gynecologist':'#d81b60','Ophthalmologist':'#00897b','ENT Specialist':'#fb8c00','Dentist':'#3949ab','General Physician':'#1976d2','Urologist':'#00acc1'};
const formatDoctorName = n => !n?'Doctor':/^Dr\.?\s*/i.test(n)?n:`Dr. ${n}`;
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Build a 5-week calendar grid starting from today
function buildCalendar() {
  const today  = new Date(); today.setHours(0,0,0,0);
  const result = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    result.push(d);
  }
  return result;
}

function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [doctor,      setDoctor]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [slots,       setSlots]       = useState([]);
  const [slotsLoading,setSlotsLoading]= useState(false);
  const [selectedDate,setSelectedDate]= useState('');
  const [selectedSlot,setSelectedSlot]= useState('');
  const [type,        setType]        = useState('chat');
  const [reason,      setReason]      = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  const calDays = buildCalendar();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getDoctorById(doctorId)
      .then(r => setDoctor(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Doctor's available day names
  const availDayNames = doctor?.availability?.map(a => a.day) || [];

  const isDayAvailable = (date) => {
    const name = DAY_NAMES[date.getDay()];
    return availDayNames.includes(name);
  };

  // Fetch slots when date selected
  const fetchSlots = useCallback(async (ymd) => {
    setSlotsLoading(true); setSlots([]); setSelectedSlot('');
    try {
      const r = await getAvailableSlots(doctorId, ymd);
      setSlots(r.data.availableSlots || []);
    } catch(e) { setSlots([]); }
    finally { setSlotsLoading(false); }
  }, [doctorId]);

  const handleDayClick = (date) => {
    if (!isDayAvailable(date)) return;
    const ymd = toYMD(date);
    setSelectedDate(ymd);
    fetchSlots(ymd);
  };

  const handleSubmit = async () => {
    if (!selectedDate) { setError('Please select a date'); return; }
    if (!selectedSlot) { setError('Please select a time slot'); return; }
    if (!reason.trim()) { setError('Please describe your reason for visit'); return; }
    setSubmitting(true); setError('');
    try {
      await bookAppointment({ doctorId, date: selectedDate, timeSlot: selectedSlot, type, reason, paymentType:'afterconsultation' });
      navigate('/dashboard/patient', { state: { bookingSuccess: true } });
    } catch(e) {
      setError(e.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#040c1e', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Poppins,sans-serif', color:'rgba(255,255,255,.4)' }}>
      <div style={{ textAlign:'center' }}><div style={{ fontSize:48, marginBottom:16 }}>⏳</div><div>Loading doctor info...</div></div>
    </div>
  );

  const name  = doctor?.userId?.name || '';
  const spec  = doctor?.specialization || '';
  const color = SPEC_COLORS[spec] || '#1976d2';
  const init  = name.replace(/^Dr\.?\s*/i,'').charAt(0).toUpperCase() || 'D';
  const inp   = { width:'100%', padding:'12px 16px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(100,181,246,.2)', borderRadius:9, color:'#fff', fontSize:14, fontFamily:'Poppins,sans-serif', boxSizing:'border-box', outline:'none' };
  const lbl   = { display:'block', color:'rgba(255,255,255,.55)', fontSize:12, fontWeight:500, marginBottom:7 };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#040c1e,#071428,#060f25)', fontFamily:'Poppins,sans-serif' }}>
      <style>{`
        @keyframes pulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.06);opacity:1}}
        .bi:focus{border-color:rgba(66,165,245,.7)!important;background:rgba(25,118,210,.1)!important;outline:none}
        .bi::placeholder{color:rgba(255,255,255,.28)}
        .bi option{background:#0a1628;color:#fff}
        .slot-btn:hover{transform:translateY(-2px)!important;box-shadow:0 6px 18px rgba(25,118,210,.4)!important}
        .day-btn:not(.disabled):hover{border-color:rgba(66,165,245,.6)!important;background:rgba(25,118,210,.15)!important}
        .sub-btn:hover:not(:disabled){transform:translateY(-2px)!important;box-shadow:0 14px 36px rgba(25,118,210,.55)!important}
      `}</style>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(4,12,30,.97)', backdropFilter:'blur(18px)', borderBottom:'1px solid rgba(100,181,246,.15)', padding:'0 6%' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:68 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={()=>navigate('/')}>
            <div style={{ width:40, height:40, background:'linear-gradient(135deg,#1565c0,#42a5f5)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:'#fff', fontWeight:700 }}>✚</div>
            <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>MediConsult</div>
          </div>
          <button onClick={()=>navigate(-1)} style={{ background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.75)', border:'1px solid rgba(255,255,255,.15)', padding:'8px 20px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'Poppins,sans-serif' }}>← Back</button>
        </div>
      </nav>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'32px 6%' }}>
        <h1 style={{ color:'#e3f2fd', fontSize:24, fontWeight:700, marginBottom:4 }}>Book Appointment</h1>
        <p style={{ color:'rgba(255,255,255,.4)', fontSize:13, marginBottom:24 }}>Select an available day, pick a time slot, and confirm your booking</p>

        {/* Doctor card */}
        {doctor&&(
          <div style={{ background:`linear-gradient(135deg,${color}22,rgba(10,22,50,.95))`, border:`1px solid ${color}33`, borderRadius:16, padding:'18px 22px', marginBottom:24, display:'flex', alignItems:'center', gap:18, flexWrap:'wrap' }}>
            <div style={{ width:54, height:54, borderRadius:'50%', background:`linear-gradient(135deg,${color},${color}99)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:22, flexShrink:0 }}>{init}</div>
            <div style={{ flex:1 }}>
              <div style={{ color:'#e3f2fd', fontWeight:700, fontSize:17 }}>{formatDoctorName(name)}</div>
              <div style={{ color:'rgba(255,255,255,.5)', fontSize:13 }}>{spec}</div>
            </div>
            <div style={{ display:'flex', gap:20 }}>
              {[{l:'Fee',v:`₹${doctor.fees}`},{l:'Exp',v:`${doctor.experience} yrs`},{l:'Rating',v:`⭐ ${doctor.rating||4.5}`}].map((s,i)=>(
                <div key={i} style={{ textAlign:'center' }}><div style={{ color:'rgba(255,255,255,.35)', fontSize:10 }}>{s.l}</div><div style={{ color:'#e3f2fd', fontWeight:600, fontSize:13 }}>{s.v}</div></div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background:'rgba(10,22,50,.8)', border:'1px solid rgba(100,181,246,.18)', borderRadius:18, padding:'30px 28px', backdropFilter:'blur(14px)' }}>

          {error&&<div style={{ background:'rgba(220,38,38,.12)', border:'1px solid rgba(220,38,38,.3)', borderRadius:9, padding:'11px 16px', color:'#fca5a5', fontSize:13, marginBottom:20, textAlign:'center' }}>⚠️ {error}</div>}

          {/* ── STEP 1: Date Calendar ── */}
          <div style={{ marginBottom:26 }}>
            <label style={lbl}>📅 Step 1 — Select a Date</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {calDays.map((d, i) => {
                const ymd      = toYMD(d);
                const avail    = isDayAvailable(d);
                const selected = selectedDate === ymd;
                return (
                  <div key={i} className={`day-btn ${!avail?'disabled':''}`}
                    onClick={()=>handleDayClick(d)}
                    style={{
                      width:52, textAlign:'center', padding:'8px 4px', borderRadius:10, cursor:avail?'pointer':'not-allowed',
                      border:`2px solid ${selected?'rgba(66,165,245,.8)':avail?'rgba(255,255,255,.15)':'rgba(255,255,255,.05)'}`,
                      background: selected?'rgba(25,118,210,.3)': avail?'rgba(255,255,255,.05)':'rgba(255,255,255,.02)',
                      opacity: avail?1:0.35, transition:'all .2s'
                    }}>
                    <div style={{ color:'rgba(255,255,255,.45)', fontSize:9, textTransform:'uppercase', marginBottom:2 }}>{DAY_NAMES[d.getDay()].slice(0,3)}</div>
                    <div style={{ color: selected?'#90caf9':avail?'#fff':'rgba(255,255,255,.3)', fontWeight:600, fontSize:14 }}>{d.getDate()}</div>
                    <div style={{ color:'rgba(255,255,255,.35)', fontSize:9 }}>{d.toLocaleString('default',{month:'short'})}</div>
                    {avail&&!selected&&<div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', margin:'3px auto 0' }}/>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:10, display:'flex', gap:16, fontSize:11, color:'rgba(255,255,255,.4)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/> Available</span>
              <span>Greyed out = Doctor not available</span>
            </div>
          </div>

          {/* ── STEP 2: Time Slots ── */}
          {selectedDate&&(
            <div style={{ marginBottom:26 }}>
              <label style={lbl}>🕐 Step 2 — Pick a Time Slot</label>
              {slotsLoading?(
                <div style={{ color:'rgba(255,255,255,.4)', fontSize:13 }}>⏳ Loading available slots...</div>
              ):slots.length===0?(
                <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.25)', borderRadius:10, padding:'14px 18px', color:'#fbbf24', fontSize:13 }}>
                  ⚠️ No available slots for this date. Please pick another day.
                </div>
              ):(
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {slots.map(slot=>(
                    <div key={slot} className="slot-btn" onClick={()=>setSelectedSlot(slot)}
                      style={{
                        padding:'10px 18px', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:600, transition:'all .2s',
                        background: selectedSlot===slot?'linear-gradient(135deg,#1976d2,#42a5f5)':'rgba(255,255,255,.06)',
                        border:`2px solid ${selectedSlot===slot?'transparent':'rgba(255,255,255,.15)'}`,
                        color: selectedSlot===slot?'#fff':'rgba(255,255,255,.8)',
                        boxShadow: selectedSlot===slot?'0 5px 18px rgba(25,118,210,.4)':'none'
                      }}>
                      🕐 {slot}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Consultation Type ── */}
          <div style={{ marginBottom:22 }}>
            <label style={lbl}>💬 Step 3 — Consultation Type</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[{v:'chat',ic:'💬',t:'Chat',d:'Text-based live chat'},{v:'video',ic:'📹',t:'Video',d:'Face-to-face video call'}].map(opt=>(
                <div key={opt.v} onClick={()=>setType(opt.v)}
                  style={{ background:type===opt.v?'rgba(25,118,210,.22)':'rgba(255,255,255,.04)', border:`2px solid ${type===opt.v?'rgba(66,165,245,.7)':'rgba(100,181,246,.15)'}`, borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all .2s' }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{opt.ic}</div>
                  <div style={{ color:'#e3f2fd', fontWeight:600, fontSize:13 }}>{opt.t}</div>
                  <div style={{ color:'rgba(255,255,255,.35)', fontSize:11 }}>{opt.d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── STEP 4: Reason ── */}
          <div style={{ marginBottom:22 }}>
            <label style={lbl}>🩺 Step 4 — Reason for Visit</label>
            <textarea className="bi" value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="Describe your symptoms or reason for consultation..." rows={3}
              style={{ ...inp, resize:'vertical' }}/>
          </div>

          {/* Info note */}
          <div style={{ background:'rgba(25,118,210,.08)', border:'1px solid rgba(25,118,210,.22)', borderRadius:10, padding:'12px 16px', marginBottom:22, display:'flex', alignItems:'flex-start', gap:10 }}>
            <span style={{ fontSize:18 }}>💡</span>
            <div style={{ color:'rgba(255,255,255,.6)', fontSize:12, lineHeight:1.6 }}>
              <strong style={{ color:'#64b5f6' }}>No payment needed right now.</strong> Payment is requested only after the doctor confirms your appointment. Chat access opens 10 minutes before your slot.
            </div>
          </div>

          {/* Fee summary */}
          <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px 18px', marginBottom:22 }}>
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:11, fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>Estimated Fee (payable after confirmation)</div>
            {[{l:'Consultation Fee',v:`₹${doctor?.fees||0}`},{l:'Platform Fee',v:'₹20'},{l:'GST (18%)',v:`₹${Math.round(((doctor?.fees||0)+20)*0.18)}`}].map((r,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ color:'rgba(255,255,255,.45)', fontSize:13 }}>{r.l}</span>
                <span style={{ color:'#e3f2fd', fontSize:13 }}>{r.v}</span>
              </div>
            ))}
            <div style={{ borderTop:'1px solid rgba(255,255,255,.1)', paddingTop:8, marginTop:4, display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'#fff', fontWeight:600 }}>Total</span>
              <span style={{ color:'#4ade80', fontWeight:700, fontSize:16 }}>₹{(doctor?.fees||0)+20+Math.round(((doctor?.fees||0)+20)*0.18)}</span>
            </div>
          </div>

          <button className="sub-btn" onClick={handleSubmit} disabled={submitting}
            style={{ width:'100%', padding:14, background:submitting?'rgba(25,118,210,.5)':'linear-gradient(135deg,#1565c0,#1976d2,#42a5f5)', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, fontFamily:'Poppins,sans-serif', cursor:submitting?'not-allowed':'pointer', boxShadow:submitting?'none':'0 8px 28px rgba(25,118,210,.45)', transition:'all .3s' }}>
            {submitting ? '⏳ Sending Request...' : '✅ Send Appointment Request →'}
          </button>
        </div>
      </div>

      <footer style={{ textAlign:'center', padding:'22px 5%', borderTop:'1px solid rgba(255,255,255,.05)', marginTop:40, background:'rgba(4,12,30,.5)' }}>
        <p style={{ color:'rgba(255,255,255,.25)', fontSize:13 }}>© 2026 MediConsult. All rights reserved.</p>
      </footer>
    </div>
  );
}
