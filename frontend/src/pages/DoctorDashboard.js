import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfile, getDoctorByUserId, getDoctorAppointments,
  updateAppointmentStatus, createPrescription, getNotifications,
  markNotificationsRead, setDoctorAvailability,
  getDoctorSchedule, checkChatAccess, updateProfile, updateDoctorProfile
} from '../services/api';
import Sidebar    from '../components/dashboard/Sidebar';
import Topbar     from '../components/dashboard/Topbar';
import StatCard   from '../components/dashboard/Statcard';
import AppointmentCard from '../components/dashboard/Appointmentcard';

/* ─────────────────── constants ─────────────────── */
const formatDoctorName = n => !n ? 'Doctor' : /^Dr\.?\s*/i.test(n) ? n : `Dr. ${n}`;

const ST = {
  pending:   { bg:'#fef3c7', color:'#d97706', label:'Pending'   },
  confirmed: { bg:'#dcfce7', color:'#16a34a', label:'Confirmed' },
  cancelled: { bg:'#fee2e2', color:'#dc2626', label:'Cancelled' },
  completed: { bg:'#dbeafe', color:'#1d4ed8', label:'Completed' },
  expired:   { bg:'#f3f4f6', color:'#6b7280', label:'Expired'   },
};

const ALL_DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const ALL_SLOTS = ['08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM','07:00 PM','08:00 PM'];

// tab indices
const TAB = { OVERVIEW:0, APPOINTMENTS:1, WRITE_RX:2, SCHEDULE:3, AVAILABILITY:4, MESSAGES:5, NOTIFICATIONS:6, PAYMENTS:7, PROFILE:8, APPT_HISTORY:9 };

const SIDEBAR_ITEMS = [
  { label:'Overview',      icon:'overview',      tabIndex:0 },
  { label:'Appointments',  icon:'appointments',  tabIndex:1 },
  { label:'Write Rx',      icon:'rx',            tabIndex:2 },
  { label:'Schedule',      icon:'schedule',      tabIndex:3 },
  { label:'Availability',  icon:'availability',  tabIndex:4 },
  { label:'Messages',      icon:'messages',      tabIndex:5 },
  { label:'Notifications', icon:'notifications', tabIndex:6, badge: true },
  { label:'Appt History',  icon:'appointments',  tabIndex:9 },
  { label:'Payments',      icon:'payments',      tabIndex:7 },
  { label:'Profile',       icon:'profile',       tabIndex:8 },
];

function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ═══════════════════════════════════════════════════════════
   DOCTOR DASHBOARD
═══════════════════════════════════════════════════════════ */
export default function DoctorDashboard() {
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const [tab,           setTab]          = useState(TAB.OVERVIEW);
  const [profile,       setProfile]      = useState(null);
  const [doctor,        setDoctor]       = useState(null);
  const [appointments,  setAppointments] = useState([]);
  const [notifications, setNotifications]= useState([]);
  const [loading,       setLoading]      = useState(true);

  // Reject flow
  const [rejectingId,  setRejectingId]  = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Prescription form
  const [rxForm, setRxForm] = useState({ appointmentId:'', patientId:'', medicines:[{name:'',dosage:'',duration:'',instructions:''}], notes:'' });
  const [rxMsg,  setRxMsg]  = useState('');

  // Schedule
  const [schedDate, setSchedDate] = useState(toYMD(new Date()));
  const [schedule,  setSchedule]  = useState([]);
  const [schedLoad, setSchedLoad] = useState(false);

  // Availability
  const [availDays,   setAvailDays]   = useState({});
  const [availMsg,    setAvailMsg]    = useState('');
  const [availSaving, setAvailSaving] = useState(false);

  // Chat access
  const [chatAccess, setChatAccess] = useState({});
  // Track sent prescriptions per appointment
  const [sentRx, setSentRx] = useState({});

  // Profile edit
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileMsg,  setProfileMsg]  = useState('');

  const greeting = () => { const h=new Date().getHours(); if(h<12)return'Good Morning'; if(h<17)return'Good Afternoon'; return'Good Evening'; };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if(user) fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prof, doc] = await Promise.all([getMyProfile(), getDoctorByUserId(user.id)]);
      setProfile(prof.data); setDoctor(doc.data);
      const avMap = {};
      (doc.data.availability || []).forEach(a => { avMap[a.day] = a.slots.map(s=>s.time); });
      setAvailDays(avMap);
      setProfileForm({ name: prof.data.name||'', specialization: doc.data.specialization||'', experience: doc.data.experience||'', fees: doc.data.fees||'', bio: doc.data.bio||'' });
      const [appts, notifs] = await Promise.all([getDoctorAppointments(doc.data._id), getNotifications(user.id)]);
      setAppointments(appts.data); setNotifications(notifs.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleConfirm = async id => {
    try { await updateAppointmentStatus(id, { status:'confirmed' }); setAppointments(prev=>prev.map(a=>a._id===id?{...a,status:'confirmed'}:a)); setRejectingId(null); }
    catch(e) { alert('Failed to confirm'); }
  };

  const handleReject = async id => {
    if (!rejectReason.trim()) { alert('Please enter a rejection reason'); return; }
    try { await updateAppointmentStatus(id, { status:'cancelled', cancellationReason:rejectReason }); setAppointments(prev=>prev.map(a=>a._id===id?{...a,status:'cancelled',cancellationReason:rejectReason}:a)); setRejectingId(null); setRejectReason(''); }
    catch(e) { alert('Failed to reject'); }
  };

  const handleSendRx = async () => {
    if (!rxForm.appointmentId) { setRxMsg('Select an appointment'); return; }
    if (!rxForm.patientId) { setRxMsg('Patient not found. Please re-select the appointment.'); return; }
    if (rxForm.medicines.every(m=>!m.name)) { setRxMsg('Add at least one medicine'); return; }
    try {
      await createPrescription({...rxForm, doctorId:doctor._id});
      setSentRx(prev => ({...prev, [rxForm.appointmentId]: true}));
      setRxMsg('Prescription sent!');
      setRxForm({ appointmentId:'', patientId:'', medicines:[{name:'',dosage:'',duration:'',instructions:''}], notes:'' });
      setTimeout(()=>setRxMsg(''),3000);
    } catch(e) {
      if (e.response?.data?.alreadySent) {
        setSentRx(prev => ({...prev, [rxForm.appointmentId]: true}));
        setRxMsg('Prescription already sent for this appointment');
      } else {
        setRxMsg(e.response?.data?.message || e.message || 'Failed to send prescription');
      }
    }
  };
  const addMed    = () => setRxForm({...rxForm, medicines:[...rxForm.medicines,{name:'',dosage:'',duration:'',instructions:''}]});
  const removeMed = i  => setRxForm({...rxForm, medicines:rxForm.medicines.filter((_,idx)=>idx!==i)});
  const updateMed = (i,f,v) => { const m=[...rxForm.medicines]; m[i]={...m[i],[f]:v}; setRxForm({...rxForm,medicines:m}); };

  const fetchSchedule = useCallback(async (date) => {
    if (!doctor) return; setSchedLoad(true);
    try { const r=await getDoctorSchedule(doctor._id,date); setSchedule(r.data); }
    catch(e) { setSchedule([]); } finally { setSchedLoad(false); }
  }, [doctor]);

  useEffect(() => { if(tab===TAB.SCHEDULE && doctor) fetchSchedule(schedDate); }, [tab, schedDate, doctor, fetchSchedule]);

  const handleSaveAvailability = async () => {
    setAvailSaving(true); setAvailMsg('');
    try {
      const availability = Object.entries(availDays).filter(([,s])=>s.length>0).map(([day,slots])=>({day,slots:slots.map(time=>({time}))}));
      await setDoctorAvailability({ availability });
      setAvailMsg('Availability saved!'); setTimeout(()=>setAvailMsg(''),3000); fetchAll();
    } catch(e) { setAvailMsg('Save failed'); } finally { setAvailSaving(false); }
  };

  const toggleSlot = (day,slot) => { const cur=availDays[day]||[]; setAvailDays({...availDays,[day]:cur.includes(slot)?cur.filter(s=>s!==slot):[...cur,slot]}); };
  const toggleDay  = day => { if(availDays[day]){const d={...availDays};delete d[day];setAvailDays(d);}else{setAvailDays({...availDays,[day]:[]}); }};

  const handleCheckChat = async apptId => {
    try {
      const r = await checkChatAccess(apptId);
      setChatAccess(prev => ({...prev, [apptId]: r.data}));
      if (r.data.allowed) {
        navigate(`/chat/${apptId}`);
      } else if (r.data.expired) {
        // Window has passed — mark appointment visually expired immediately
        setAppointments(prev => prev.map(a => a._id === apptId ? {...a, status:'expired'} : a));
      }
    } catch(e) { alert('Unable to check chat access'); }
  };

  const handleMarkRead  = async () => { try { await markNotificationsRead(user.id); setNotifications(prev=>prev.map(n=>({...n,isRead:true}))); } catch(e) {} };

  const handleSaveProfile = async () => {
    try {
      const [profRes] = await Promise.all([
        updateProfile({ name: profileForm.name }),
        updateDoctorProfile({ specialization: profileForm.specialization, experience: profileForm.experience, fees: profileForm.fees, bio: profileForm.bio })
      ]);
      setProfile(profRes.data.user);
      setProfileEdit(false);
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setProfileMsg(''), 3000);
      fetchAll();
    } catch(e) { setProfileMsg('Failed to save profile'); }
  };

  if (!user) { navigate('/login'); return null; }

  const todayStr       = new Date().toDateString();
  const tomorrowStr    = new Date(Date.now()+86400000).toDateString();
  const todayAppts     = appointments.filter(a=>new Date(a.date).toDateString()===todayStr);
  const tomorrowAppts  = appointments.filter(a=>new Date(a.date).toDateString()===tomorrowStr);
  const confirmedAppts = appointments.filter(a=>['confirmed','completed'].includes(a.status));
  const pendingAppts   = appointments.filter(a=>a.status==='pending');
  const unread         = notifications.filter(n=>!n.isRead).length;
  const totalEarnings  = appointments.filter(a=>a.paymentDone).reduce((s)=>s+(doctor?.fees||0),0);

  /* ── shared styles ── */
  const gcard = { background:'rgba(10,26,58,0.85)', border:'1px solid rgba(63,167,163,0.2)', borderRadius:16, padding:'20px 22px', backdropFilter:'blur(14px)' };
  const inp   = { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(63,167,163,0.22)', borderRadius:10, color:'#fff', fontSize:13, fontFamily:"'Poppins',sans-serif", boxSizing:'border-box', outline:'none', transition:'all .25s' };
  const lbl   = { display:'block', color:'rgba(255,255,255,0.52)', fontSize:11, fontWeight:500, marginBottom:5 };
  const secH  = { color:'#fff', fontWeight:700, fontSize:15, marginBottom:14, display:'flex', alignItems:'center', gap:8 };

  /* ── Appointment card used in today/all tabs ── */
  const ApptBlock = ({ a, showActions = true }) => {
    const pName       = a.patientId?.name || 'Patient';
    const dateStr     = new Date(a.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
    const isPending   = a.status === 'pending';
    const isExpired   = a.status === 'expired' || (chatAccess[a._id]?.expired === true);
    const isRejecting = rejectingId === a._id;
    const chatInfo    = chatAccess[a._id];

    return (
      <AppointmentCard name={pName} dateStr={dateStr} timeSlot={a.timeSlot} type={a.type} status={a.status} reason={a.reason}>
        {/* Show patient's reason below their name */}
        {a.reason && <div style={{ color:'rgba(255,255,255,0.45)', fontSize:11, marginBottom:6, marginTop:-4 }}>Reason: {a.reason}</div>}

        {isExpired && (
          <span style={{ color:'#9ca3af', fontSize:11, background:'rgba(107,114,128,0.15)', border:'1px solid rgba(107,114,128,0.3)', borderRadius:8, padding:'5px 10px' }}>
            ⌛ Appointment expired — patient can reschedule
          </span>
        )}

        {showActions && !isExpired && (
          <>
            {isPending && !isRejecting && (
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>handleConfirm(a._id)} style={{ flex:1, padding:'9px 0', background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
                  ✓ Confirm
                </button>
                <button onClick={()=>{setRejectingId(a._id);setRejectReason('');}} style={{ flex:1, padding:'9px 0', background:'rgba(220,38,38,0.12)', color:'#fca5a5', border:'1px solid rgba(220,38,38,0.3)', borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
                  ✕ Reject
                </button>
              </div>
            )}
            {isRejecting && (
              <div>
                <input value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Reason for rejection..." style={{...inp,marginBottom:8}}/>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>{setRejectingId(null);setRejectReason('');}} style={{flex:1,padding:'8px 0',background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.65)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:9,fontSize:12,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Cancel</button>
                  <button onClick={()=>handleReject(a._id)} style={{flex:2,padding:'8px 0',background:'linear-gradient(135deg,#dc2626,#ef4444)',color:'#fff',border:'none',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Confirm Rejection</button>
                </div>
              </div>
            )}
            {a.status==='confirmed' && (
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <button onClick={()=>handleCheckChat(a._id)} style={{background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',padding:'8px 18px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 4px 14px rgba(63,167,163,0.35)'}}>
                  {a.type==='video' ? '📹 Start Video' : '💬 Start Chat'}
                </button>
                {chatInfo&&!chatInfo.allowed&&<span style={{color:'#fbbf24',fontSize:11,background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:8,padding:'5px 10px'}}>⏰ {chatInfo.reason}</span>}
                {a.paymentDone&&<span style={{color:'#4ade80',fontSize:11,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:8,padding:'5px 10px'}}>✅ Paid</span>}
              </div>
            )}
            {a.status==='cancelled' && a.cancellationReason && (
              <div style={{background:'rgba(220,38,38,0.08)',border:'1px solid rgba(220,38,38,0.2)',borderRadius:9,padding:'8px 12px',color:'rgba(252,165,165,0.8)',fontSize:11}}>Reason: {a.cancellationReason}</div>
            )}
          </>
        )}
      </AppointmentCard>
    );
  };
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'linear-gradient(135deg,#0B1F3A 0%,#071828 100%)', fontFamily:"'Poppins',sans-serif", overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; }
        .di:focus { border-color:rgba(63,167,163,0.6)!important; background:rgba(63,167,163,0.08)!important; outline:none; }
        .di::placeholder { color:rgba(255,255,255,0.25); }
        .di option { background:#0a1628; color:#fff; }
        .slot-pill:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(63,167,163,0.3); }
        .mc-content-scroll { flex:1; overflow-y:auto; padding:24px; }
        .mc-content-scroll::-webkit-scrollbar { width:5px; }
        .mc-content-scroll::-webkit-scrollbar-track { background:transparent; }
        .mc-content-scroll::-webkit-scrollbar-thumb { background:rgba(63,167,163,0.3); border-radius:3px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp .4s ease both; }
        @media (max-width:768px) {
          .mc-sidebar-label { display:none!important; }
          .mc-two-col { flex-direction:column!important; }
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <Sidebar
        items={SIDEBAR_ITEMS}
        activeTab={tab}
        onTabChange={setTab}
        onLogout={logout}
        unreadCount={unread}
      />

      {/* ── RIGHT: Topbar + content ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        <Topbar
          userName={formatDoctorName(user?.name)}
          userInitial={user?.name?.replace(/^Dr\.?\s*/i,'').charAt(0).toUpperCase()}
          unreadCount={unread}
          onBellClick={() => setTab(TAB.NOTIFICATIONS)}
          onAvatarClick={() => setTab(TAB.PROFILE)}
          placeholder="Search appointments, patients..."
        />

        <div className="mc-content-scroll">

          {loading ? (
            <div style={{ textAlign:'center', padding:80 }}>
              <div style={{ width:48, height:48, border:'3px solid rgba(63,167,163,0.2)', borderTop:'3px solid #3FA7A3', borderRadius:'50%', margin:'0 auto 18px', animation:'spin 1s linear infinite' }}/>
              <div style={{ color:'rgba(255,255,255,0.45)', fontSize:15 }}>Loading dashboard...</div>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : (
            <>
              {/* ══════ TAB 0 : OVERVIEW ══════ */}
              {tab === TAB.OVERVIEW && (
                <div className="fade-up">
                  {/* Greeting banner */}
                  <div style={{ background:'linear-gradient(135deg,rgba(25,118,210,0.35),rgba(63,167,163,0.25))', border:'1px solid rgba(63,167,163,0.28)', borderRadius:16, padding:'20px 24px', marginBottom:22, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                    <div>
                      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginBottom:4 }}>{greeting()},</div>
                      <div style={{ color:'#fff', fontWeight:700, fontSize:22, marginBottom:4 }}>{formatDoctorName(user?.name)}</div>
                      {pendingAppts.length > 0 && <div style={{ color:'#fbbf24', fontSize:13 }}>{pendingAppts.length} pending request{pendingAppts.length>1?'s':''} awaiting action</div>}
                    </div>
                    <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(63,167,163,0.2)', borderRadius:10, padding:'8px 16px' }}>
                      {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
                    </div>
                  </div>

                  {/* Stat cards */}
                  <div style={{ display:'flex', gap:14, marginBottom:22, flexWrap:'wrap' }}>
                    <StatCard label="Total Patients"   value={appointments.length} sub={`↑ Active`}            accentColor="#3FA7A3" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3FA7A3" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}/>
                    <StatCard label="Pending"          value={pendingAppts.length} sub="Need confirmation"     accentColor="#f59e0b" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}/>
                    <StatCard label="Total Earnings"   value={`₹${totalEarnings}`} sub="From paid consults"   accentColor="#4ade80" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}/>
                    <StatCard label="Rating"           value={`${doctor?.rating||4.5} ★`} sub="Patient reviews" accentColor="#fbbf24" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}/>
                  </div>

                  {/* Two-column layout */}
                  <div className="mc-two-col" style={{ display:'flex', gap:18 }}>

                    {/* LEFT — Today & Tomorrow schedule */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={gcard}>
                        <div style={secH}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3FA7A3" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          Today's Schedule
                          <span style={{ marginLeft:'auto', background:'rgba(63,167,163,0.15)', color:'#3FA7A3', fontSize:11, padding:'3px 10px', borderRadius:50, fontWeight:600 }}>{todayAppts.length} appts</span>
                        </div>
                        {todayAppts.length === 0 ? (
                          <div style={{ textAlign:'center', padding:'24px 0', color:'rgba(255,255,255,0.38)', fontSize:13 }}>No appointments today</div>
                        ) : todayAppts.map(a=><ApptBlock key={a._id} a={a}/>)}

                        <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:14, marginTop:6 }}>
                          <div style={{ ...secH, fontSize:13, color:'rgba(255,255,255,0.65)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            Tomorrow's Schedule
                          </div>
                          {tomorrowAppts.length === 0 ? (
                            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, paddingLeft:4 }}>No appointments tomorrow</div>
                          ) : tomorrowAppts.map(a=><ApptBlock key={a._id} a={a} showActions={false}/>)}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT — Pending requests */}
                    <div style={{ width:320, flexShrink:0, display:'flex', flexDirection:'column', gap:16 }}>
                      <div style={gcard}>
                        <div style={secH}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:'#fbbf24', boxShadow:'0 0 8px rgba(251,191,36,0.7)', flexShrink:0 }}/>
                          Pending Requests
                          {pendingAppts.length > 0 && <span style={{ marginLeft:'auto', background:'rgba(245,158,11,0.2)', color:'#fbbf24', fontSize:11, padding:'3px 10px', borderRadius:50, fontWeight:700 }}>{pendingAppts.length}</span>}
                        </div>
                        {pendingAppts.length === 0 ? (
                          <div style={{ textAlign:'center', padding:'20px 0', color:'rgba(255,255,255,0.38)', fontSize:13 }}>No pending requests</div>
                        ) : pendingAppts.map(a=><ApptBlock key={a._id} a={a}/>)}
                      </div>

                      {/* Quick actions */}
                      <div style={gcard}>
                        <div style={{ ...secH, fontSize:13 }}>Quick Actions</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
                          {[
                            { label:'Write Rx',      tab: TAB.WRITE_RX,      bg:'linear-gradient(135deg,#1976d2,#3FA7A3)' },
                            { label:'Set Schedule',  tab: TAB.SCHEDULE,      bg:'rgba(63,167,163,0.15)', outline:'rgba(63,167,163,0.3)', color:'#3FA7A3' },
                            { label:'Availability',  tab: TAB.AVAILABILITY,  bg:'rgba(25,118,210,0.15)', outline:'rgba(25,118,210,0.3)', color:'#42a5f5' },
                            { label:'Notifications', tab: TAB.NOTIFICATIONS, bg:'rgba(99,102,241,0.15)', outline:'rgba(99,102,241,0.3)', color:'#a5b4fc' },
                          ].map((b,i)=>(
                            <button key={i} onClick={()=>setTab(b.tab)}
                              style={{ padding:'10px 8px', background:b.bg, color:b.color||'#fff', border: b.outline?`1px solid ${b.outline}`:'none', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Poppins',sans-serif", transition:'all .25s' }}>
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════ TAB 1 : ACTIVE APPOINTMENTS ══════ */}
              {tab === TAB.APPOINTMENTS && (
                <div className="fade-up">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>Appointments</div>
                    <button onClick={()=>setTab(TAB.APPT_HISTORY)} style={{background:'rgba(63,167,163,0.12)',border:'1px solid rgba(63,167,163,0.3)',color:'#3FA7A3',padding:'7px 16px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
                      View History →
                    </button>
                  </div>
                  {appointments.filter(a=>['pending','confirmed','expired'].includes(a.status)).length === 0 ? (
                    <div style={{ ...gcard, textAlign:'center', padding:50 }}>
                      <div style={{ color:'rgba(255,255,255,0.3)', fontSize:15 }}>No active appointments</div>
                    </div>
                  ) : [...appointments.filter(a=>['pending','confirmed','expired'].includes(a.status))]
                      .sort((a,b)=>({pending:0,confirmed:1,expired:2}[a.status]||0)-({pending:0,confirmed:1,expired:2}[b.status]||0))
                      .map(a => <ApptBlock key={a._id} a={a}/>)
                  }
                </div>
              )}

              {/* ══════ TAB 9 : APPOINTMENT HISTORY ══════ */}
              {tab === TAB.APPT_HISTORY && (
                <div className="fade-up">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>Appointment History</div>
                    <button onClick={()=>setTab(TAB.APPOINTMENTS)} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.7)',padding:'7px 16px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
                      ← Active
                    </button>
                  </div>
                  {appointments.filter(a=>['completed','cancelled'].includes(a.status)).length === 0 ? (
                    <div style={{ ...gcard, textAlign:'center', padding:50, color:'rgba(255,255,255,0.35)' }}>No appointment history yet</div>
                  ) : [...appointments.filter(a=>['completed','cancelled'].includes(a.status))]
                      .sort((a,b)=>new Date(b.date)-new Date(a.date))
                      .map(a => {
                        const st = ST[a.status] || ST.completed;
                        const pName = a.patientId?.name || 'Patient';
                        const dateStr = new Date(a.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
                        return (
                          <div key={a._id} style={{...gcard, marginBottom:12, display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap'}}>
                            <div style={{flex:1, minWidth:0}}>
                              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                                <div style={{color:'#fff',fontWeight:600,fontSize:14}}>{pName}</div>
                                <span style={{background:st.bg,color:st.color,padding:'2px 10px',borderRadius:50,fontSize:10,fontWeight:700}}>{st.label}</span>
                              </div>
                              {a.reason && <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginBottom:3}}>Reason: {a.reason}</div>}
                              <div style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>{dateStr} · {a.timeSlot} · {a.type?.toUpperCase()}</div>
                              {a.status==='cancelled'&&a.cancellationReason&&<div style={{color:'rgba(252,165,165,0.7)',fontSize:11,marginTop:3}}>Reason: {a.cancellationReason}</div>}
                              {a.rating && <div style={{marginTop:6,display:'flex',alignItems:'center',gap:6}}><span style={{color:'#fbbf24',fontSize:12}}>{'★'.repeat(a.rating)}{'☆'.repeat(5-a.rating)}</span><span style={{color:'rgba(255,255,255,0.4)',fontSize:11}}>Patient rated {a.rating}/5</span></div>}
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              )}

              {/* ══════ TAB 2 : WRITE PRESCRIPTION ══════ */}
              {tab === TAB.WRITE_RX && (
                <div className="fade-up">
                  <div style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:20 }}>Write Prescription</div>
                  <div style={gcard}>
                    {rxMsg && <div style={{ background: rxMsg.includes('sent')?'rgba(34,197,94,0.12)':'rgba(220,38,38,0.12)', border:`1px solid ${rxMsg.includes('sent')?'rgba(34,197,94,0.3)':'rgba(220,38,38,0.3)'}`, borderRadius:10, padding:'10px 14px', color: rxMsg.includes('sent')?'#4ade80':'#fca5a5', fontSize:13, marginBottom:16 }}>{rxMsg.includes('sent')?'✅':''} {rxMsg}</div>}
                    <div style={{ marginBottom:16 }}>
                      <label style={lbl}>Select Confirmed Appointment</label>
                      {confirmedAppts.length === 0 ? (
                        <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:10, padding:'12px 16px', color:'#fbbf24', fontSize:13 }}>
                          ⚠️ No confirmed appointments found. Confirm an appointment first before writing a prescription.
                        </div>
                      ) : (
                        <select className="di" value={rxForm.appointmentId}
                          onChange={e => {
                            const appt = confirmedAppts.find(a => a._id === e.target.value);
                            if (!appt) { setRxForm({...rxForm, appointmentId:'', patientId:''}); return; }
                            // Extract patientId safely - handle populated object or plain ObjectId
                            let pid = '';
                            if (appt.patientId) {
                              if (typeof appt.patientId === 'object' && appt.patientId._id) {
                                pid = appt.patientId._id.toString();
                              } else if (typeof appt.patientId === 'object' && appt.patientId.id) {
                                pid = appt.patientId.id.toString();
                              } else if (typeof appt.patientId === 'string') {
                                pid = appt.patientId;
                              } else {
                                pid = appt.patientId.toString();
                              }
                            }
                            setRxForm({...rxForm, appointmentId: e.target.value, patientId: pid});
                          }}
                          style={inp}>
                          <option value="">-- Choose appointment --</option>
                          {confirmedAppts.map(a => {
                            const pName = a.patientId?.name || 'Patient';
                            const dateStr = new Date(a.date).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
                            return <option key={a._id} value={a._id}>{pName} — {dateStr} at {a.timeSlot}</option>;
                          })}
                        </select>
                      )}
                      {/* Show selected patient name as confirmation */}
                      {rxForm.appointmentId && (() => {
                        const appt = confirmedAppts.find(a => a._id === rxForm.appointmentId);
                        return appt ? (
                          <div style={{ marginTop:10, background:'rgba(63,167,163,0.08)', border:'1px solid rgba(63,167,163,0.25)', borderRadius:9, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#1976d2,#3FA7A3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                              {(appt.patientId?.name||'P').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>Writing for: {appt.patientId?.name || 'Patient'}</div>
                              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{new Date(appt.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} at {appt.timeSlot} · {appt.type?.toUpperCase()}</div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:600, marginBottom:10 }}>Medicines</div>
                    {rxForm.medicines.map((m,i)=>(
                      <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(63,167,163,0.15)', borderRadius:12, padding:14, marginBottom:10 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:8 }}>
                          {[{f:'name',l:'Medicine',ph:'e.g. Paracetamol'},{f:'dosage',l:'Dosage',ph:'e.g. 500mg'},{f:'duration',l:'Duration',ph:'e.g. 5 days'},{f:'instructions',l:'Instructions',ph:'e.g. After food'}].map(x=>(
                            <div key={x.f}><label style={lbl}>{x.l}</label><input className="di" value={m[x.f]} onChange={e=>updateMed(i,x.f,e.target.value)} placeholder={x.ph} style={inp}/></div>
                          ))}
                        </div>
                        {rxForm.medicines.length>1&&<button onClick={()=>removeMed(i)} style={{background:'rgba(220,38,38,0.12)',border:'1px solid rgba(220,38,38,0.25)',color:'#fca5a5',padding:'5px 14px',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>✕ Remove</button>}
                      </div>
                    ))}
                    <button onClick={addMed} style={{width:'100%',padding:'10px 0',background:'rgba(63,167,163,0.1)',border:'1px dashed rgba(63,167,163,0.35)',color:'#3FA7A3',borderRadius:10,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'Poppins',sans-serif",marginBottom:14}}>+ Add Medicine</button>
                    <div style={{ marginBottom:16 }}><label style={lbl}>Notes</label><textarea className="di" value={rxForm.notes} onChange={e=>setRxForm({...rxForm,notes:e.target.value})} rows={3} placeholder="Additional notes..." style={{...inp,resize:'vertical'}}/></div>
                    {rxForm.appointmentId && sentRx[rxForm.appointmentId] ? (
                      <div style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:10,padding:'12px 16px',color:'#4ade80',fontSize:13,textAlign:'center'}}>
                        ✅ Prescription already sent to this patient
                      </div>
                    ) : (
                      <button onClick={handleSendRx} style={{width:'100%',padding:13,background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 8px 22px rgba(63,167,163,0.35)'}}>Send Prescription</button>
                    )}
                  </div>
                </div>
              )}

              {/* ══════ TAB 3 : SCHEDULE ══════ */}
              {tab === TAB.SCHEDULE && (
                <div className="fade-up">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>Daily Schedule</div>
                    <div style={{ display:'flex', gap:10 }}>
                      <input type="date" value={schedDate} onChange={e=>{setSchedDate(e.target.value);fetchSchedule(e.target.value);}} style={{...inp,width:'auto',colorScheme:'dark'}}/>
                      <button onClick={()=>fetchSchedule(schedDate)} style={{background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',padding:'9px 18px',borderRadius:9,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Refresh</button>
                    </div>
                  </div>
                  {schedLoad ? <div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.4)'}}>Loading schedule...</div>
                  : schedule.length===0 ? <div style={{...gcard,textAlign:'center',padding:40,color:'rgba(255,255,255,0.4)'}}>No appointments for this date</div>
                  : schedule.map((a,i)=>{
                    const st=ST[a.status]||ST.pending;
                    return (
                      <div key={a._id} style={{...gcard,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:12}}>
                        <div style={{width:54,textAlign:'center',background:'rgba(63,167,163,0.12)',border:'1px solid rgba(63,167,163,0.28)',borderRadius:10,padding:'8px 4px',flexShrink:0}}>
                          <div style={{color:'#3FA7A3',fontWeight:700,fontSize:14}}>{a.timeSlot||'—'}</div>
                          <div style={{color:'rgba(255,255,255,0.3)',fontSize:9}}>SLOT #{i+1}</div>
                        </div>
                        <div style={{flex:1}}><div style={{color:'#fff',fontWeight:600,fontSize:14}}>{a.patientId?.name||'Patient'}</div><div style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>{a.type?.toUpperCase()}</div></div>
                        <span style={{background:st.bg,color:st.color,padding:'4px 12px',borderRadius:50,fontSize:11,fontWeight:700}}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ══════ TAB 4 : AVAILABILITY ══════ */}
              {tab === TAB.AVAILABILITY && (
                <div className="fade-up">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, flexWrap:'wrap', gap:12 }}>
                    <div>
                      <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>Set Availability</div>
                      <div style={{ color:'rgba(255,255,255,0.45)', fontSize:13, marginTop:2 }}>Toggle working days and select time slots</div>
                    </div>
                    <button onClick={handleSaveAvailability} disabled={availSaving} style={{background:availSaving?'rgba(63,167,163,0.3)':'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',padding:'10px 24px',borderRadius:10,fontSize:14,fontWeight:600,cursor:availSaving?'not-allowed':'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 6px 18px rgba(63,167,163,0.35)'}}>
                      {availSaving?'Saving...':'Save Availability'}
                    </button>
                  </div>
                  {availMsg && <div style={{background:availMsg.includes('saved')?'rgba(34,197,94,0.12)':'rgba(220,38,38,0.12)',border:`1px solid ${availMsg.includes('saved')?'rgba(34,197,94,0.3)':'rgba(220,38,38,0.3)'}`,borderRadius:10,padding:'10px 14px',color:availMsg.includes('saved')?'#4ade80':'#fca5a5',fontSize:13,marginBottom:16}}>{availMsg.includes('saved')?'✅':''} {availMsg}</div>}
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:12 }}>
                    {ALL_DAYS.map(day=>{
                      const isOn = !!availDays[day]; const daySlots = availDays[day]||[];
                      return (
                        <div key={day} style={{...gcard,padding:0,overflow:'hidden'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',cursor:'pointer',background:isOn?'rgba(63,167,163,0.06)':'transparent'}} onClick={()=>toggleDay(day)}>
                            <div style={{display:'flex',alignItems:'center',gap:12}}>
                              <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${isOn?'#3FA7A3':'rgba(255,255,255,0.25)'}`,background:isOn?'rgba(63,167,163,0.25)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}>
                                {isOn&&<span style={{color:'#3FA7A3',fontSize:13,fontWeight:700}}>✓</span>}
                              </div>
                              <span style={{color:isOn?'#e3f2fd':'rgba(255,255,255,0.5)',fontWeight:600,fontSize:14}}>{day}</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              {isOn&&<span style={{color:'#3FA7A3',fontSize:12}}>{daySlots.length} slot{daySlots.length!==1?'s':''}</span>}
                              <span style={{color:'rgba(255,255,255,0.3)',fontSize:16}}>{isOn?'▾':'▸'}</span>
                            </div>
                          </div>
                          {isOn&&(
                            <div style={{padding:'0 20px 16px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
                              <div style={{color:'rgba(255,255,255,0.38)',fontSize:11,margin:'10px 0 8px'}}>Click to toggle slots:</div>
                              <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                                {ALL_SLOTS.map(slot=>{
                                  const active=daySlots.includes(slot);
                                  return <div key={slot} className="slot-pill" onClick={()=>toggleSlot(day,slot)} style={{padding:'6px 13px',borderRadius:9,cursor:'pointer',fontSize:12,fontWeight:600,transition:'all .2s',background:active?'linear-gradient(135deg,#1976d2,#3FA7A3)':'rgba(255,255,255,0.06)',border:`2px solid ${active?'transparent':'rgba(255,255,255,0.12)'}`,color:active?'#fff':'rgba(255,255,255,0.6)'}}>{slot}</div>;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══════ TAB 5 : MESSAGES ══════ */}
              {tab === TAB.MESSAGES && (
                <div className="fade-up">
                  <div style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:20 }}>Messages</div>
                  <div style={gcard}>
                    {confirmedAppts.length === 0 ? (
                      <div style={{ textAlign:'center', padding:40, color:'rgba(255,255,255,0.35)', fontSize:14 }}>No active chats</div>
                    ) : confirmedAppts.map(a=>(
                      <div key={a._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.07)', cursor:'pointer' }} onClick={()=>handleCheckChat(a._id)}>
                        <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#1976d2,#3FA7A3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16, flexShrink:0 }}>{a.patientId?.name?.charAt(0)||'P'}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ color:'#fff', fontWeight:600, fontSize:14 }}>{a.patientId?.name||'Patient'}</div>
                          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>{a.timeSlot} · {a.type?.toUpperCase()}</div>
                        </div>
                        <button style={{ background:'linear-gradient(135deg,#1976d2,#3FA7A3)', color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>Chat</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════ TAB 6 : NOTIFICATIONS ══════ */}
              {tab === TAB.NOTIFICATIONS && (
                <div className="fade-up">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>Notifications</div>
                    {unread>0&&<button onClick={handleMarkRead} style={{background:'rgba(63,167,163,0.12)',border:'1px solid rgba(63,167,163,0.3)',color:'#3FA7A3',padding:'7px 16px',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Mark all read</button>}
                  </div>
                  {notifications.length===0 ? <div style={{...gcard,textAlign:'center',padding:50,color:'rgba(255,255,255,0.35)'}}>No notifications</div>
                  : notifications.map(n=>{
                    const dc={appointment:'#3b82f6',confirmation:'#22c55e',cancellation:'#ef4444',reschedule:'#f59e0b',payment:'#22c55e',reminder:'#f59e0b',system:'#3FA7A3'};
                    return (
                      <div key={n._id} style={{...gcard,background:n.isRead?'rgba(255,255,255,0.04)':'rgba(63,167,163,0.06)',borderLeft:`4px solid ${n.isRead?'rgba(255,255,255,0.08)':'#3FA7A3'}`,marginBottom:10,padding:'14px 18px'}}>
                        <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                          <div style={{width:10,height:10,borderRadius:'50%',background:dc[n.type]||'#3FA7A3',marginTop:4,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <div style={{color:'#fff',fontWeight:600,fontSize:13}}>{n.title}</div>
                            <div style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginTop:3}}>{n.message}</div>
                            <div style={{color:'rgba(255,255,255,0.25)',fontSize:11,marginTop:4}}>{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                          {!n.isRead&&<div style={{width:8,height:8,borderRadius:'50%',background:'#3FA7A3',flexShrink:0,marginTop:4}}/>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ══════ TAB 7 : PAYMENTS ══════ */}
              {tab === TAB.PAYMENTS && (
                <div className="fade-up">
                  <div style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:20 }}>Payments</div>
                  <div style={{ display:'flex', gap:14, marginBottom:20, flexWrap:'wrap' }}>
                    <StatCard label="Total Earned"   value={`₹${totalEarnings}`}            sub="All time"       accentColor="#4ade80"/>
                    <StatCard label="Paid Consults"  value={appointments.filter(a=>a.paymentDone).length} sub="Completed" accentColor="#3FA7A3"/>
                    <StatCard label="Fee per Visit"  value={`₹${doctor?.fees||0}`}           sub="Current rate"   accentColor="#42a5f5"/>
                  </div>
                  <div style={gcard}>
                    <div style={secH}>Transaction History</div>
                    {appointments.filter(a=>a.paymentDone).length===0 ? (
                      <div style={{textAlign:'center',padding:30,color:'rgba(255,255,255,0.35)'}}>No transactions yet</div>
                    ) : appointments.filter(a=>a.paymentDone).map(a=>(
                      <div key={a._id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                        <div style={{width:36,height:36,borderRadius:10,background:'rgba(74,222,128,0.15)',border:'1px solid rgba(74,222,128,0.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{color:'#fff',fontWeight:600,fontSize:13}}>{a.patientId?.name||'Patient'}</div>
                          <div style={{color:'rgba(255,255,255,0.4)',fontSize:11}}>{new Date(a.date).toLocaleDateString()}</div>
                        </div>
                        <div style={{color:'#4ade80',fontWeight:700,fontSize:14}}>+₹{doctor?.fees||0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════ TAB 8 : PROFILE ══════ */}
              {tab === TAB.PROFILE && doctor && (
                <div className="fade-up">
                  <div style={{ background:'linear-gradient(135deg,rgba(25,118,210,0.35),rgba(63,167,163,0.25))', border:'1px solid rgba(63,167,163,0.28)', borderRadius:18, padding:'28px 28px', marginBottom:22, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                    <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#1976d2,#3FA7A3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:28, border:'3px solid rgba(255,255,255,0.2)', flexShrink:0, boxShadow:'0 0 20px rgba(63,167,163,0.4)' }}>
                      {user?.name?.replace(/^Dr\.?\s*/i,'').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ color:'#fff', fontWeight:700, fontSize:22 }}>{formatDoctorName(user?.name)}</div>
                      <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginTop:3 }}>{doctor.specialization} · {user?.email}</div>
                    </div>
                    <button onClick={()=>setProfileEdit(!profileEdit)} style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', padding:'9px 22px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
                      {profileEdit ? '✕ Cancel' : '✏️ Edit Profile'}
                    </button>
                  </div>

                  {!profileEdit && (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:20 }}>
                      {[
                        { l:'Specialization', v: doctor.specialization||'—' },
                        { l:'Experience',     v: `${doctor.experience||0} years` },
                        { l:'Fees',           v: `₹${doctor.fees||0} per visit` },
                        { l:'Rating',         v: `${doctor.rating||4.5} ★` },
                        { l:'Phone',          v: profile?.phone||'—' },
                      ].map((item,i)=>(
                        <div key={i} style={{...gcard,padding:'16px 18px'}}>
                          <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginBottom:4}}>{item.l}</div>
                          <div style={{color:'#fff',fontWeight:600,fontSize:15}}>{item.v}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {profileEdit && (
                    <div style={gcard}>
                      {profileMsg&&<div style={{background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:10,padding:'10px 14px',color:'#4ade80',fontSize:13,marginBottom:14}}>✅ {profileMsg}</div>}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                        {[{n:'name',l:'Full Name'},{n:'specialization',l:'Specialization'},{n:'experience',l:'Experience (years)',t:'number'},{n:'fees',l:'Fees (₹)',t:'number'},{n:'bio',l:'Professional Bio'}].map(f=>(
                          <div key={f.n}><label style={lbl}>{f.l}</label><input className="di" type={f.t||'text'} value={profileForm[f.n]||''} onChange={e=>setProfileForm({...profileForm,[f.n]:e.target.value})} style={inp}/></div>
                        ))}
                      </div>
                      <button onClick={handleSaveProfile} style={{marginTop:18,width:'100%',padding:13,background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 8px 22px rgba(63,167,163,0.35)'}}>Save Changes</button>
                    </div>
                  )}

                  {doctor.bio && !profileEdit && (
                    <div style={{...gcard,marginTop:16}}>
                      <div style={secH}>Professional Bio</div>
                      <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,lineHeight:1.7}}>{doctor.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}