import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfile, getMyAppointments, getMyPrescriptions, getMedicalHistory,
  getNotifications, getDoctors, addMedicalHistory, updateMedicalHistory,
  deleteMedicalHistory, markNotificationsRead, updateProfile, bookAppointment,
  cancelAppointment, rescheduleAppointment, getAvailableSlots, checkChatAccess, rateAppointment
} from '../services/api';
import Sidebar         from '../components/dashboard/Sidebar';
import Topbar          from '../components/dashboard/Topbar';
import StatCard        from '../components/dashboard/Statcard';
import AppointmentCard from '../components/dashboard/Appointmentcard';

/* ─────────────────── constants ─────────────────── */
const formatDoctorName = n => !n ? 'Doctor' : /^Dr\.?\s*/i.test(n) ? n : `Dr. ${n}`;

const BLOOD    = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const DAY_NAMES= ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SPEC_COLORS = { Cardiologist:'#e53935', Dermatologist:'#8e24aa', Neurologist:'#1e88e5', Orthopedist:'#f4511e', Pediatrician:'#43a047', Psychiatrist:'#7c3aed', Gynecologist:'#d81b60', Ophthalmologist:'#00897b', 'ENT Specialist':'#fb8c00', Dentist:'#3949ab', 'General Physician':'#1976d2', Urologist:'#00acc1' };

const TAB = { OVERVIEW:0, APPOINTMENTS:1, BOOK:2, PRESCRIPTIONS:3, HISTORY:4, MESSAGES:5, NOTIFICATIONS:6, PAYMENTS:7, PROFILE:8, APPT_HISTORY:9 };

const SIDEBAR_ITEMS = [
  { label:'Overview',       icon:'overview',      tabIndex:0 },
  { label:'Appointments',   icon:'appointments',  tabIndex:1 },
  { label:'Book Doctor',    icon:'book',          tabIndex:2 },
  { label:'Prescriptions',  icon:'prescription',  tabIndex:3 },
  { label:'Medical History',icon:'history',       tabIndex:4 },
  { label:'Appt History',   icon:'appointments',  tabIndex:9 },
  { label:'Messages',       icon:'messages',      tabIndex:5 },
  { label:'Notifications',  icon:'notifications', tabIndex:6, badge:true },
  { label:'Payments',       icon:'payments',      tabIndex:7 },
  { label:'Profile',        icon:'profile',       tabIndex:8 },
];

function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function buildCalendar() {
  const today = new Date(); today.setHours(0,0,0,0);
  return Array.from({length:35},(_,i)=>{ const d=new Date(today); d.setDate(today.getDate()+i); return d; });
}

/* ═══════════════════════════════════════════════════════════
   PATIENT DASHBOARD
═══════════════════════════════════════════════════════════ */
export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [tab,           setTab]           = useState(TAB.OVERVIEW);
  const [appointments,  setAppointments]  = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [history,       setHistory]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [doctors,       setDoctors]       = useState([]);
  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [bookBanner,    setBookBanner]    = useState(false);
  const [profileMsg,    setProfileMsg]    = useState('');
  const [editMode,      setEditMode]      = useState(false);
  const [profileForm,   setProfileForm]   = useState({});
  const [histForm,      setHistForm]      = useState({ condition:'', diagnosedDate:'', description:'' });
  const [editingHist,   setEditingHist]   = useState(null);

  // Book form
  const [bookForm,        setBookForm]       = useState({ doctorId:'', type:'chat', reason:'' });
  const [selectedDoctor,  setSelectedDoctor] = useState(null);
  const [bookDate,        setBookDate]       = useState('');
  const [bookSlots,       setBookSlots]      = useState([]);
  const [bookSlot,        setBookSlot]       = useState('');
  const [bookSlotsLoad,   setBookSlotsLoad]  = useState(false);
  const [docSearch,       setDocSearch]      = useState('');

  // Cancel modal
  const [cancelId,     setCancelId]     = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Reschedule modal
  const [reschedAppt,      setReschedAppt]      = useState(null);
  const [reschedDate,      setReschedDate]       = useState('');
  const [reschedSlots,     setReschedSlots]      = useState([]);
  const [reschedSlot,      setReschedSlot]       = useState('');
  const [reschedSlotsLoad, setReschedSlotsLoad]  = useState(false);
  const [reschedMsg,       setReschedMsg]        = useState('');

  const [chatAccess, setChatAccess] = useState({});
  const [ratingModal, setRatingModal] = useState(null); // { apptId, doctorName }
  const [ratingVal,   setRatingVal]   = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingMsg,   setRatingMsg]   = useState('');

  const greeting = () => { const h=new Date().getHours(); if(h<12)return'Good Morning'; if(h<17)return'Good Afternoon'; return'Good Evening'; };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if(user) fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prof,appts,rxs,hist,notifs,docs] = await Promise.all([
        getMyProfile(), getMyAppointments(user.id), getMyPrescriptions(user.id),
        getMedicalHistory(user.id), getNotifications(user.id), getDoctors()
      ]);
      setProfile(prof.data); setAppointments(appts.data); setPrescriptions(rxs.data);
      setHistory(hist.data); setNotifications(notifs.data); setDoctors(docs.data);
      setProfileForm({ name:prof.data.name||'', phone:prof.data.phone||'', bloodGroup:prof.data.bloodGroup||'', age:prof.data.age||'', gender:prof.data.gender||'', city:prof.data.city||'', country:prof.data.country||'' });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchBookSlots = useCallback(async (ymd,docId) => {
    if (!ymd||!docId) return; setBookSlotsLoad(true); setBookSlots([]); setBookSlot('');
    try { const r=await getAvailableSlots(docId,ymd); setBookSlots(r.data.availableSlots||[]); }
    catch(e) { setBookSlots([]); } finally { setBookSlotsLoad(false); }
  },[]);

  const fetchReschedSlots = useCallback(async (ymd) => {
    if (!ymd||!reschedAppt) return; setReschedSlotsLoad(true); setReschedSlots([]); setReschedSlot('');
    try { const r=await getAvailableSlots(reschedAppt.doctorId?._id,ymd); setReschedSlots(r.data.availableSlots||[]); }
    catch(e) { setReschedSlots([]); } finally { setReschedSlotsLoad(false); }
  },[reschedAppt]);

  const handleBook = async () => {
    if (!bookForm.doctorId||!bookDate||!bookSlot) { alert('Select doctor, date and slot'); return; }
    try {
      await bookAppointment({...bookForm,date:bookDate,timeSlot:bookSlot,paymentType:'afterconsultation'});
      setBookBanner(true); setBookForm({doctorId:'',type:'chat',reason:''}); setBookDate(''); setBookSlot(''); setBookSlots([]); setSelectedDoctor(null);
      fetchAll(); setTab(TAB.APPOINTMENTS);
    } catch(e) { alert(e.response?.data?.message||'Booking failed'); }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { alert('Please enter a cancellation reason'); return; }
    try { await cancelAppointment(cancelId,{cancellationReason:cancelReason}); setCancelId(null); setCancelReason(''); fetchAll(); }
    catch(e) { alert(e.response?.data?.message||'Cancel failed'); }
  };

  const handleReschedule = async () => {
    if (!reschedDate||!reschedSlot) { setReschedMsg('Select date and slot'); return; }
    try { await rescheduleAppointment(reschedAppt._id,{newDate:reschedDate,newTimeSlot:reschedSlot}); setReschedAppt(null); setReschedDate(''); setReschedSlot(''); setReschedMsg(''); fetchAll(); }
    catch(e) { setReschedMsg(e.response?.data?.message||'Reschedule failed'); }
  };
  
  // ── Check chat access before joining (same logic as doctor side) ──
const handleJoinChat = async (apptId) => {
  try {
    const r = await checkChatAccess(apptId);
    setChatAccess(prev => ({ ...prev, [apptId]: r.data }));
    if (r.data.allowed) {
      navigate(`/chat/${apptId}`);
    } else if (r.data.expired) {
      // Window has passed — mark this appointment as visually expired right now
      // without waiting for the cron job
      setAppointments(prev => prev.map(a => a._id === apptId ? {...a, status:'expired'} : a));
    }
  } catch(e) {
    alert('Unable to check chat access. Please try again.');
  }
};
  const handlePay = (id) => {
  const appt = appointments.find(a => a._id === id);
  const fee     = appt?.doctorId?.fees || 0;
  const docId   = appt?.doctorId?._id;
  navigate(`/payment/${id}/${docId}/${fee}`);
};

  const handleAddHist = async () => {
    if (!histForm.condition) { alert('Enter condition name'); return; }
    try {
      if (editingHist) { await updateMedicalHistory(editingHist,{...histForm,patientId:user.id}); setEditingHist(null); }
      else { await addMedicalHistory({...histForm,patientId:user.id}); }
      setHistForm({condition:'',diagnosedDate:'',description:''});
      const r=await getMedicalHistory(user.id); setHistory(r.data);
    } catch(e) { alert('Failed to save'); }
  };

  const handleDeleteHist = async id => {
    if (!window.confirm('Delete this record?')) return;
    try { await deleteMedicalHistory(id); setHistory(history.filter(h=>h._id!==id)); } catch(e) {}
  };

  const handleSaveProfile = async () => {
    try {
      const r=await updateProfile(profileForm);
      setProfile(r.data.user); updateUser({...user,name:r.data.user.name});
      setEditMode(false); setProfileMsg('Profile updated!'); setTimeout(()=>setProfileMsg(''),3000);
    } catch(e) { setProfileMsg('Update failed'); }
  };

  const downloadPrescriptionPDF = (rx) => {
    const docName = formatDoctorName(rx.doctorId?.userId?.name || 'Doctor');
    const date = new Date(rx.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
    const medicines = rx.medicines?.map((m,i) =>
      `${i+1}. ${m.name}${m.dosage?' — '+m.dosage:''}${m.duration?' | '+m.duration:''}${m.instructions?' ('+m.instructions+')':''}`
    ).join('\n') || 'No medicines listed';
    const content = [
      '╔══════════════════════════════════════╗',
      '║         MEDICONSULT PRESCRIPTION     ║',
      '╚══════════════════════════════════════╝',
      '',
      `Doctor  : ${docName}`,
      `Patient : ${user?.name || 'Patient'}`,
      `Date    : ${date}`,
      '',
      '─────────────────────────────────────',
      'MEDICINES',
      '─────────────────────────────────────',
      medicines,
      '',
      ...(rx.notes ? ['─────────────────────────────────────','NOTES','─────────────────────────────────────', rx.notes, ''] : []),
      '─────────────────────────────────────',
      'MediConsult Online Consultation Platform',
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prescription_${docName.replace(/\s+/g,'_')}_${date.replace(/\s+/g,'_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRate = async () => {
    if (!ratingVal) { setRatingMsg('Please select a star rating'); return; }
    try {
      await rateAppointment(ratingModal.apptId, { rating: ratingVal, ratingComment });
      setAppointments(prev => prev.map(a => a._id === ratingModal.apptId ? {...a, rating: ratingVal} : a));
      setRatingModal(null); setRatingVal(0); setRatingComment(''); setRatingMsg('');
    } catch(e) { setRatingMsg(e.response?.data?.message || 'Failed to submit rating'); }
  };

  const handleMarkRead = async () => {
    try { await markNotificationsRead(user.id); setNotifications(notifications.map(n=>({...n,isRead:true}))); } catch(e) {}
  };

  if (!user) { navigate('/login'); return null; }

  const unread   = notifications.filter(n=>!n.isRead).length;
  const pending  = appointments.filter(a=>a.status==='pending').length;
  const upcoming = appointments.filter(a=>['pending','confirmed','expired'].includes(a.status));
  // Completed but not yet rated — show in overview so patient sees the Rate button
  const unratedCompleted = appointments.filter(a => a.status === 'completed' && !a.rating);

  /* ── shared styles ── */
  const gcard = { background:'rgba(10,26,58,0.85)', border:'1px solid rgba(63,167,163,0.2)', borderRadius:16, padding:'20px 22px', backdropFilter:'blur(14px)' };
  const inp   = { width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(63,167,163,0.22)', borderRadius:10, color:'#fff', fontSize:13, fontFamily:"'Poppins',sans-serif", boxSizing:'border-box', outline:'none', transition:'all .25s' };
  const lbl   = { display:'block', color:'rgba(255,255,255,0.52)', fontSize:11, fontWeight:500, marginBottom:5 };
  const secH  = { color:'#fff', fontWeight:700, fontSize:15, marginBottom:14, display:'flex', alignItems:'center', gap:8 };

  const calDays             = buildCalendar();
  const bookDoctorAvailDays = selectedDoctor?.availability?.map(a=>a.day)||[];
  const isBookDayAvail      = d => bookDoctorAvailDays.includes(DAY_NAMES[d.getDay()]);
  const reschedAvailDays    = reschedAppt?.doctorId?.availability?.map(a=>a.day)||[];
  const isReschedDayAvail   = d => reschedAvailDays.includes(DAY_NAMES[d.getDay()]);

  const filteredDocs = doctors.filter(d => {
    const n = d.userId?.name||'', s = d.specialization||'';
    return n.toLowerCase().includes(docSearch.toLowerCase()) || s.toLowerCase().includes(docSearch.toLowerCase());
  });

  /* ── Appointment display block ── */
  const ApptBlock = ({ a }) => {
    const dName     = a.doctorId?.userId?.name || '';
    const spec      = a.doctorId?.specialization || '';
    const dateStr   = new Date(a.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
    const color     = SPEC_COLORS[spec] || '#1976d2';
    const status    = a.status;
    const isExpired = status === 'expired' || (chatAccess[a._id]?.expired === true);
    const needsPay  = status === 'confirmed' && !a.paymentDone;
    const canResched = !isExpired && ['pending','confirmed'].includes(status);
    const canCancel  = ['pending','confirmed'].includes(status);
    const isCompleted = status === 'completed';
    const isCancelled = status === 'cancelled';

    const renderActions = () => {
      if (isExpired) {
        return (
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span style={{color:'#9ca3af',fontSize:11,background:'rgba(107,114,128,0.15)',border:'1px solid rgba(107,114,128,0.3)',borderRadius:8,padding:'5px 10px'}}>
              ⌛ This appointment has expired
            </span>
            <button onClick={()=>{setReschedAppt(a);setReschedDate('');setReschedSlot('');setReschedMsg('');}}
              style={{background:'rgba(63,167,163,0.12)',color:'#3FA7A3',border:'1px solid rgba(63,167,163,0.3)',padding:'8px 14px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
              🔄 Reschedule
            </button>
          </div>
        );
      }

      if (isCompleted) {
        const hasRating = a.rating && a.rating > 0;
        return (
          <div style={{marginTop:2}}>
            {hasRating ? (
              <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 0'}}>
                <span style={{color:'#fbbf24',fontSize:16}}>{'★'.repeat(a.rating)}{'☆'.repeat(5-a.rating)}</span>
                <span style={{color:'rgba(255,255,255,0.4)',fontSize:11}}>You rated {a.rating}/5</span>
              </div>
            ) : (
              <button
                onClick={()=>{
                  setRatingModal({apptId:a._id, doctorName:formatDoctorName(a.doctorId?.userId?.name||'')});
                  setRatingVal(0); setRatingComment(''); setRatingMsg('');
                }}
                style={{background:'linear-gradient(135deg,#f59e0b,#fbbf24)',color:'#fff',border:'none',padding:'8px 18px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 4px 14px rgba(251,191,36,0.35)'}}>
                ⭐ Rate Doctor
              </button>
            )}
          </div>
        );
      }

      if (isCancelled) {
        return a.cancellationReason ? (
          <div style={{background:'rgba(220,38,38,0.08)',border:'1px solid rgba(220,38,38,0.2)',borderRadius:9,padding:'8px 12px',color:'rgba(252,165,165,0.8)',fontSize:11}}>
            Reason: {a.cancellationReason}
          </div>
        ) : null;
      }

      return (
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {status==='confirmed' && a.paymentDone && (
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <button onClick={()=>handleJoinChat(a._id)}
                style={{background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',padding:'8px 16px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 4px 14px rgba(63,167,163,0.35)'}}>
                {a.type==='video' ? '📹 Join Video' : '💬 Join Chat'}
              </button>
              {chatAccess[a._id] && !chatAccess[a._id].allowed && (
                <span style={{color:'#fbbf24',fontSize:11,background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:8,padding:'5px 10px'}}>
                  ⏰ {chatAccess[a._id].reason}
                </span>
              )}
              <span style={{color:'#4ade80',fontSize:11,background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.25)',borderRadius:8,padding:'5px 10px'}}>✅ Paid</span>
            </div>
          )}
          {needsPay && (
            <button onClick={()=>handlePay(a._id)}
              style={{background:'linear-gradient(135deg,#16a34a,#22c55e)',color:'#fff',border:'none',padding:'8px 16px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
              Pay Now ₹{a.doctorId?.fees||0}
            </button>
          )}
          {canResched && (
            <button onClick={()=>{setReschedAppt(a);setReschedDate('');setReschedSlot('');setReschedMsg('');}}
              style={{background:'rgba(63,167,163,0.12)',color:'#3FA7A3',border:'1px solid rgba(63,167,163,0.3)',padding:'8px 14px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
              Reschedule
            </button>
          )}
          {canCancel && (
            <button onClick={()=>{setCancelId(a._id);setCancelReason('');}}
              style={{background:'rgba(220,38,38,0.1)',color:'#fca5a5',border:'1px solid rgba(220,38,38,0.25)',padding:'8px 14px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
              Cancel
            </button>
          )}
        </div>
      );
    };

    return (
      <AppointmentCard name={formatDoctorName(dName)} dateStr={dateStr} timeSlot={a.timeSlot} type={a.type} status={a.status} reason={a.reason} avatarColor={`linear-gradient(135deg,${color},${color}99)`}>
        {spec && <div style={{color:color,fontSize:11,fontWeight:600,marginBottom:6,marginTop:-4}}>{spec}</div>}
        {renderActions()}
      </AppointmentCard>
    );
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'linear-gradient(135deg,#0B1F3A 0%,#071828 100%)', fontFamily:"'Poppins',sans-serif", overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; }
        .pi:focus { border-color:rgba(63,167,163,0.6)!important; background:rgba(63,167,163,0.08)!important; outline:none; }
        .pi::placeholder { color:rgba(255,255,255,0.25); }
        .pi option { background:#0a1628; color:#fff; }
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
        .day-cell:not(.dis):hover { border-color:rgba(63,167,163,0.5)!important; background:rgba(63,167,163,0.12)!important; }
        .slot-cell:hover { transform:translateY(-2px); box-shadow:0 5px 16px rgba(63,167,163,0.3); }
        .doc-card:hover { transform:translateY(-3px); border-color:rgba(63,167,163,0.45)!important; box-shadow:0 10px 28px rgba(63,167,163,0.18)!important; }
        .mc-content-scroll { flex:1; overflow-y:auto; padding:24px; }
        .mc-content-scroll::-webkit-scrollbar { width:5px; }
        .mc-content-scroll::-webkit-scrollbar-track { background:transparent; }
        .mc-content-scroll::-webkit-scrollbar-thumb { background:rgba(63,167,163,0.3); border-radius:3px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        .fade-up { animation:fadeUp .4s ease both; }
        @media (max-width:768px) {
          .mc-two-col { flex-direction:column!important; }
        }
      `}</style>

      {/* ── CANCEL MODAL ── */}
      {cancelId && (
        <div className="overlay">
          <div style={{ background:'#0d1b3e', border:'1px solid rgba(220,38,38,0.35)', borderRadius:18, padding:'28px 26px', maxWidth:420, width:'100%' }}>
            <div style={{ color:'#fca5a5', fontWeight:700, fontSize:17, marginBottom:8 }}>Cancel Appointment</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginBottom:16 }}>Please provide a reason. The doctor will be notified.</div>
            <textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="Reason for cancellation..." rows={3} style={{...inp,resize:'vertical',border:'1px solid rgba(220,38,38,0.3)',marginBottom:16}}/>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>{setCancelId(null);setCancelReason('');}} style={{flex:1,padding:11,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,fontSize:13,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Go Back</button>
              <button onClick={handleCancel} style={{flex:2,padding:11,background:'linear-gradient(135deg,#dc2626,#ef4444)',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 5px 16px rgba(220,38,38,0.4)'}}>Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESCHEDULE MODAL ── */}
      {reschedAppt && (
        <div className="overlay">
          <div style={{ background:'#0d1b3e', border:'1px solid rgba(63,167,163,0.3)', borderRadius:18, padding:'26px 24px', maxWidth:500, width:'100%', maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ color:'#3FA7A3', fontWeight:700, fontSize:17 }}>Reschedule Appointment</div>
              <button onClick={()=>{setReschedAppt(null);setReschedDate('');setReschedSlot('');setReschedMsg('');}} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            {reschedMsg && <div style={{background:'rgba(220,38,38,0.12)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:9,padding:'10px 14px',color:'#fca5a5',fontSize:12,marginBottom:14}}>{reschedMsg}</div>}
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:10 }}>Select new date:</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:16 }}>
              {calDays.map((d,i)=>{
                const ymd=toYMD(d), avail=isReschedDayAvail(d), sel=reschedDate===ymd;
                return (
                  <div key={i} className={`day-cell${!avail?' dis':''}`}
                    onClick={()=>{if(!avail)return;setReschedDate(ymd);fetchReschedSlots(ymd);}}
                    style={{width:44,textAlign:'center',padding:'6px 2px',borderRadius:8,cursor:avail?'pointer':'not-allowed',border:`2px solid ${sel?'rgba(63,167,163,0.8)':avail?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.04)'}`,background:sel?'rgba(63,167,163,0.25)':avail?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.01)',opacity:avail?1:0.3,transition:'all .2s'}}>
                    <div style={{color:'rgba(255,255,255,0.4)',fontSize:8,textTransform:'uppercase'}}>{DAY_NAMES[d.getDay()].slice(0,2)}</div>
                    <div style={{color:sel?'#3FA7A3':avail?'#fff':'rgba(255,255,255,0.2)',fontWeight:600,fontSize:13}}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>
            {reschedDate && (reschedSlotsLoad
              ? <div style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:14}}>Loading slots...</div>
              : reschedSlots.length===0
                ? <div style={{color:'#fbbf24',fontSize:12,marginBottom:14}}>No slots available. Try another date.</div>
                : <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
                    {reschedSlots.map(s=>(
                      <div key={s} className="slot-cell" onClick={()=>setReschedSlot(s)} style={{padding:'8px 14px',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600,transition:'all .2s',background:reschedSlot===s?'linear-gradient(135deg,#1976d2,#3FA7A3)':'rgba(255,255,255,0.06)',border:`2px solid ${reschedSlot===s?'transparent':'rgba(255,255,255,0.12)'}`,color:reschedSlot===s?'#fff':'rgba(255,255,255,0.8)'}}>
                        {s}
                      </div>
                    ))}
                  </div>
            )}
            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button onClick={()=>{setReschedAppt(null);setReschedDate('');setReschedSlot('');setReschedMsg('');}} style={{flex:1,padding:11,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,fontSize:13,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Cancel</button>
              <button onClick={handleReschedule} style={{flex:2,padding:11,background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 5px 16px rgba(63,167,163,0.4)'}}>Confirm Reschedule</button>
            </div>
          </div>
        </div>
      )}

      {/* ── RATING MODAL ── */}
      {ratingModal && (
        <div className="overlay">
          <div style={{background:'#0d1b3e',border:'1px solid rgba(251,191,36,0.35)',borderRadius:18,padding:'28px 26px',maxWidth:420,width:'100%',textAlign:'center'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(251,191,36,0.12)',border:'1px solid rgba(251,191,36,0.3)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',fontSize:26}}>⭐</div>
            <div style={{color:'#fbbf24',fontWeight:700,fontSize:17,marginBottom:4}}>Rate Your Doctor</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:13,marginBottom:20}}>{ratingModal.doctorName}</div>
            {ratingMsg && <div style={{background:'rgba(220,38,38,0.12)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:9,padding:'8px 14px',color:'#fca5a5',fontSize:12,marginBottom:14}}>{ratingMsg}</div>}
            <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:18}}>
              {[1,2,3,4,5].map(s=>(
                <button key={s} onClick={()=>setRatingVal(s)}
                  style={{fontSize:32,background:'none',border:'none',cursor:'pointer',color:s<=ratingVal?'#fbbf24':'rgba(255,255,255,0.2)',transition:'all .15s',transform:s<=ratingVal?'scale(1.15)':'scale(1)'}}>★</button>
              ))}
            </div>
            <div style={{marginBottom:16}}>
              <textarea value={ratingComment} onChange={e=>setRatingComment(e.target.value)}
                placeholder="Share your experience (optional)..." rows={3}
                style={{width:'100%',padding:'10px 14px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(63,167,163,0.22)',borderRadius:10,color:'#fff',fontSize:13,fontFamily:"'Poppins',sans-serif",boxSizing:'border-box',outline:'none',resize:'vertical'}}/>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{setRatingModal(null);setRatingVal(0);setRatingComment('');setRatingMsg('');}}
                style={{flex:1,padding:11,background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,fontSize:13,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Cancel</button>
              <button onClick={handleRate}
                style={{flex:2,padding:11,background:'linear-gradient(135deg,#f59e0b,#fbbf24)',color:'#fff',border:'none',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 5px 16px rgba(251,191,36,0.4)'}}>Submit Rating</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <Sidebar
        items={SIDEBAR_ITEMS}
        activeTab={tab}
        onTabChange={setTab}
        onLogout={logout}
        unreadCount={unread}
      />

      {/* ── RIGHT ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        <Topbar
          userName={user?.name}
          userInitial={user?.name?.charAt(0).toUpperCase()}
          unreadCount={unread}
          onBellClick={()=>setTab(TAB.NOTIFICATIONS)}
          onAvatarClick={()=>setTab(TAB.PROFILE)}
          placeholder="Search doctors, appointments..."
        />

        <div className="mc-content-scroll">
          {loading ? (
            <div style={{ textAlign:'center', padding:80 }}>
              <div style={{ width:48, height:48, border:'3px solid rgba(63,167,163,0.2)', borderTop:'3px solid #3FA7A3', borderRadius:'50%', margin:'0 auto 18px', animation:'spin 1s linear infinite' }}/>
              <div style={{ color:'rgba(255,255,255,0.45)', fontSize:15 }}>Loading dashboard...</div>
            </div>
          ) : (
            <>
              {/* ══════ TAB 0 : OVERVIEW ══════ */}
              {tab === TAB.OVERVIEW && (
                <div className="fade-up">
                  {/* Greeting */}
                  <div style={{ background:'linear-gradient(135deg,rgba(25,118,210,0.35),rgba(63,167,163,0.25))', border:'1px solid rgba(63,167,163,0.28)', borderRadius:16, padding:'20px 24px', marginBottom:22, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                    <div>
                      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginBottom:4 }}>{greeting()},</div>
                      <div style={{ color:'#fff', fontWeight:700, fontSize:22, marginBottom:4 }}>{user?.name}</div>
                      <div style={{ color: pending>0 ? '#fbbf24' : '#3FA7A3', fontSize:13 }}>
                        {pending>0 ? `${pending} appointment${pending>1?'s':''} awaiting doctor confirmation` : 'All appointments up to date ✅'}
                      </div>
                    </div>
                    <button onClick={()=>setTab(TAB.BOOK)} style={{ background:'linear-gradient(135deg,#1976d2,#3FA7A3)', color:'#fff', border:'none', padding:'11px 22px', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Poppins',sans-serif", boxShadow:'0 5px 18px rgba(63,167,163,0.38)' }}>
                      + Book Appointment
                    </button>
                  </div>

                  {/* Stat cards */}
                  <div style={{ display:'flex', gap:14, marginBottom:22, flexWrap:'wrap' }}>
                    <StatCard label="Total"        value={appointments.length}                                  sub="All appointments"   accentColor="#3FA7A3"/>
                    <StatCard label="Completed"    value={appointments.filter(a=>a.status==='completed').length} sub="Consultations done" accentColor="#4ade80"  subColor="#4ade80"/>
                    <StatCard label="Pending"       value={pending}                                              sub="Awaiting confirm"   accentColor="#f59e0b"  subColor="#fbbf24"/>
                    <StatCard label="Prescriptions" value={prescriptions.length}                                 sub="From doctors"       accentColor="#42a5f5"/>
                  </div>

                  {/* Book banner */}
                  {bookBanner && (
                    <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.28)', borderRadius:14, padding:'14px 18px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px rgba(34,197,94,0.7)' }}/>
                        <div>
                          <div style={{ color:'#4ade80', fontWeight:600, fontSize:14 }}>Appointment Request Sent!</div>
                          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:2 }}>Waiting for doctor confirmation. You'll be notified once confirmed.</div>
                        </div>
                      </div>
                      <button onClick={()=>setBookBanner(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:18,cursor:'pointer'}}>✕</button>
                    </div>
                  )}

                  {/* Two-column */}
                  <div className="mc-two-col" style={{ display:'flex', gap:18 }}>
                    {/* LEFT — Upcoming appointments */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={gcard}>
                        <div style={secH}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3FA7A3" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          Upcoming Appointments
                          <span style={{ marginLeft:'auto', background:'rgba(63,167,163,0.15)', color:'#3FA7A3', fontSize:11, padding:'3px 10px', borderRadius:50, fontWeight:600 }}>{upcoming.length}</span>
                        </div>
                        {upcoming.length === 0 && unratedCompleted.length === 0 ? (
                          <div style={{ textAlign:'center', padding:'24px 0' }}>
                            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:13, marginBottom:12 }}>No upcoming appointments</div>
                            <button onClick={()=>setTab(TAB.BOOK)} style={{background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',padding:'9px 20px',borderRadius:9,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Book Now</button>
                          </div>
                        ) : (
                          <>
                            {upcoming.map(a=><ApptBlock key={a._id} a={a}/>)}
                            {unratedCompleted.length > 0 && (
                              <div style={{marginTop: upcoming.length > 0 ? 12 : 0}}>
                                <div style={{color:'#fbbf24',fontSize:12,fontWeight:600,marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                                  ⭐ Rate your recent consultations
                                </div>
                                {unratedCompleted.map(a=><ApptBlock key={a._id} a={a}/>)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* RIGHT — Notifications */}
                    <div style={{ width:300, flexShrink:0 }}>
                      <div style={gcard}>
                        <div style={{ ...secH, justifyContent:'space-between' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background:'#3FA7A3', boxShadow:'0 0 7px rgba(63,167,163,0.7)' }}/>
                            Notifications
                          </div>
                          {unread>0 && <button onClick={handleMarkRead} style={{background:'none',border:'none',color:'#3FA7A3',fontSize:11,cursor:'pointer',fontFamily:"'Poppins',sans-serif",textDecoration:'underline'}}>Mark all read</button>}
                        </div>
                        {notifications.slice(0,5).map(n=>{
                          const dc={appointment:'#3b82f6',confirmation:'#22c55e',cancellation:'#ef4444',reschedule:'#f59e0b',payment:'#22c55e',reminder:'#f59e0b',system:'#3FA7A3'};
                          return (
                            <div key={n._id} style={{ background:n.isRead?'rgba(255,255,255,0.04)':'rgba(63,167,163,0.07)', border:`1px solid ${n.isRead?'rgba(255,255,255,0.07)':'rgba(63,167,163,0.2)'}`, borderRadius:11, padding:'10px 12px', marginBottom:8 }}>
                              <div style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
                                <div style={{ width:8, height:8, borderRadius:'50%', background:dc[n.type]||'#3FA7A3', marginTop:4, flexShrink:0 }}/>
                                <div>
                                  <div style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{n.title}</div>
                                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:2 }}>{n.message}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {notifications.length===0 && <div style={{color:'rgba(255,255,255,0.35)',fontSize:13,textAlign:'center',padding:'16px 0'}}>No notifications</div>}
                        {notifications.length > 5 && <button onClick={()=>setTab(TAB.NOTIFICATIONS)} style={{width:'100%',padding:'8px 0',background:'rgba(63,167,163,0.1)',border:'1px solid rgba(63,167,163,0.25)',color:'#3FA7A3',borderRadius:9,fontSize:12,cursor:'pointer',fontFamily:"'Poppins',sans-serif",marginTop:4}}>View all</button>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════ TAB 1 : APPOINTMENTS (active only) ══════ */}
              {tab === TAB.APPOINTMENTS && (
                <div className="fade-up">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>Your Appointments</div>
                    <button onClick={()=>setTab(TAB.APPT_HISTORY)} style={{background:'rgba(63,167,163,0.12)',border:'1px solid rgba(63,167,163,0.3)',color:'#3FA7A3',padding:'7px 16px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
                      View History →
                    </button>
                  </div>
                  {appointments.filter(a=>['pending','confirmed','expired'].includes(a.status)).length===0 ? (
                    <div style={{...gcard,textAlign:'center',padding:50}}>
                      <div style={{color:'rgba(255,255,255,0.35)',fontSize:15,marginBottom:14}}>No active appointments</div>
                      <button onClick={()=>setTab(TAB.BOOK)} style={{background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',padding:'10px 24px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Book Now</button>
                    </div>
                  ) : appointments.filter(a=>['pending','confirmed','expired'].includes(a.status)).map(a=><ApptBlock key={a._id} a={a}/>)}
                </div>
              )}

              {/* ══════ TAB 9 : APPOINTMENT HISTORY ══════ */}
              {tab === TAB.APPT_HISTORY && (
                <div className="fade-up">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
                    <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>Appointment History</div>
                    <button onClick={()=>setTab(TAB.APPOINTMENTS)} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.7)',padding:'7px 16px',borderRadius:9,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
                      ← Active Appointments
                    </button>
                  </div>
                  {appointments.filter(a=>['completed','cancelled'].includes(a.status)).length===0 ? (
                    <div style={{...gcard,textAlign:'center',padding:50,color:'rgba(255,255,255,0.35)'}}>No appointment history yet</div>
                  ) : appointments.filter(a=>['completed','cancelled'].includes(a.status)).map(a=><ApptBlock key={a._id} a={a}/>)}
                </div>
              )}

              {/* ══════ TAB 2 : BOOK APPOINTMENT ══════ */}
              {tab === TAB.BOOK && (
                <div className="fade-up">
                  <div style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:20 }}>Book Appointment</div>

                  {!selectedDoctor ? (
                    <div style={gcard}>
                      <div style={{ ...secH, fontSize:14 }}>Choose a Doctor</div>
                      {/* Search */}
                      <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(63,167,163,0.22)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(63,167,163,0.65)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input className="pi" value={docSearch} onChange={e=>setDocSearch(e.target.value)} placeholder="Search doctors or speciality..." style={{flex:1,background:'none',border:'none',color:'#fff',fontSize:13,fontFamily:"'Poppins',sans-serif",outline:'none'}}/>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                        {filteredDocs.map(doc=>{
                          const name = doc.userId?.name||'', spec = doc.specialization||'', color = SPEC_COLORS[spec]||'#1976d2';
                          return (
                            <div key={doc._id} className="doc-card" style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${color}33`, borderRadius:14, padding:'16px 18px', display:'flex', alignItems:'center', gap:16, cursor:'pointer', transition:'all .25s' }}
                              onClick={()=>{ setSelectedDoctor(doc); setBookForm({...bookForm,doctorId:doc._id}); setBookDate(''); setBookSlot(''); setBookSlots([]); }}>
                              <div style={{ width:50, height:50, borderRadius:'50%', background:`linear-gradient(135deg,${color},${color}99)`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:18, flexShrink:0, boxShadow:`0 4px 14px ${color}55` }}>
                                {name.replace(/^Dr\.?\s*/i,'').charAt(0).toUpperCase()||'D'}
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>{formatDoctorName(name)}</div>
                                <div style={{ color:color, fontSize:12, marginTop:2, fontWeight:600 }}>{spec}</div>
                                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:3 }}>{doc.experience||0} yrs exp · ₹{doc.fees||0}</div>
                              </div>
                              <div style={{ color:color, fontSize:12, fontWeight:600, background:`${color}15`, border:`1px solid ${color}33`, borderRadius:8, padding:'5px 12px' }}>Select</div>
                            </div>
                          );
                        })}
                        {filteredDocs.length===0 && <div style={{textAlign:'center',padding:30,color:'rgba(255,255,255,0.35)'}}>No doctors found</div>}
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Selected doctor header */}
                      <div style={{...gcard,marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
                        <div style={{display:'flex',alignItems:'center',gap:14}}>
                          <div style={{width:50,height:50,borderRadius:'50%',background:`linear-gradient(135deg,${SPEC_COLORS[selectedDoctor.specialization]||'#1976d2'},${SPEC_COLORS[selectedDoctor.specialization]||'#1976d2'}99)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:18}}>
                            {(selectedDoctor.userId?.name||'').replace(/^Dr\.?\s*/i,'').charAt(0).toUpperCase()||'D'}
                          </div>
                          <div>
                            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>{formatDoctorName(selectedDoctor.userId?.name)}</div>
                            <div style={{color:SPEC_COLORS[selectedDoctor.specialization]||'#3FA7A3',fontSize:12,fontWeight:600}}>{selectedDoctor.specialization}</div>
                          </div>
                        </div>
                        <button onClick={()=>{setSelectedDoctor(null);setBookForm({...bookForm,doctorId:''});}} style={{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.6)',border:'1px solid rgba(255,255,255,0.15)',padding:'7px 16px',borderRadius:9,fontSize:12,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Change Doctor</button>
                      </div>

                      {/* Consultation type */}
                      <div style={{...gcard,marginBottom:14}}>
                        <label style={lbl}>Consultation Type</label>
                        <div style={{display:'flex',gap:10}}>
                          {['chat','video'].map(t=>(
                            <div key={t} onClick={()=>setBookForm({...bookForm,type:t})} style={{flex:1,textAlign:'center',padding:'12px',borderRadius:10,cursor:'pointer',background:bookForm.type===t?'linear-gradient(135deg,#1976d2,#3FA7A3)':'rgba(255,255,255,0.06)',border:`2px solid ${bookForm.type===t?'transparent':'rgba(255,255,255,0.12)'}`,color:bookForm.type===t?'#fff':'rgba(255,255,255,0.6)',fontWeight:600,fontSize:13,transition:'all .2s'}}>
                              {t==='chat'?'💬 Chat':'📹 Video'}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reason */}
                      <div style={{...gcard,marginBottom:14}}>
                        <label style={lbl}>Reason for Consultation (optional)</label>
                        <textarea className="pi" value={bookForm.reason} onChange={e=>setBookForm({...bookForm,reason:e.target.value})} rows={2} placeholder="Describe your symptoms..." style={{...inp,resize:'vertical'}}/>
                      </div>

                      {/* Date picker */}
                      <div style={{...gcard,marginBottom:14}}>
                        <label style={lbl}>Select Date (green = available)</label>
                        <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:16}}>
                          {calDays.map((d,i)=>{
                            const ymd=toYMD(d), avail=isBookDayAvail(d), sel=bookDate===ymd;
                            return (
                              <div key={i} className={`day-cell${!avail?' dis':''}`}
                                onClick={()=>{if(!avail)return;setBookDate(ymd);fetchBookSlots(ymd,bookForm.doctorId);}}
                                style={{width:46,textAlign:'center',padding:'7px 2px',borderRadius:9,cursor:avail?'pointer':'not-allowed',border:`2px solid ${sel?'rgba(63,167,163,0.8)':avail?'rgba(63,167,163,0.3)':'rgba(255,255,255,0.06)'}`,background:sel?'rgba(63,167,163,0.28)':avail?'rgba(63,167,163,0.08)':'rgba(255,255,255,0.01)',opacity:avail?1:0.3,transition:'all .2s'}}>
                                <div style={{color:'rgba(255,255,255,0.45)',fontSize:8,textTransform:'uppercase'}}>{DAY_NAMES[d.getDay()].slice(0,2)}</div>
                                <div style={{color:sel?'#3FA7A3':avail?'#fff':'rgba(255,255,255,0.2)',fontWeight:600,fontSize:13}}>{d.getDate()}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Slots */}
                        {bookDate && (
                          bookSlotsLoad ? <div style={{color:'rgba(255,255,255,0.4)',fontSize:13}}>Loading slots...</div>
                          : bookSlots.length===0 ? <div style={{color:'#fbbf24',fontSize:12}}>No slots available. Try another date.</div>
                          : <>
                              <label style={{...lbl,marginTop:10}}>Select Time Slot</label>
                              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                                {bookSlots.map(s=>(
                                  <div key={s} className="slot-cell" onClick={()=>setBookSlot(s)} style={{padding:'8px 14px',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:600,transition:'all .2s',background:bookSlot===s?'linear-gradient(135deg,#1976d2,#3FA7A3)':'rgba(255,255,255,0.06)',border:`2px solid ${bookSlot===s?'transparent':'rgba(255,255,255,0.12)'}`,color:bookSlot===s?'#fff':'rgba(255,255,255,0.8)'}}>
                                    {s}
                                  </div>
                                ))}
                              </div>
                            </>
                        )}
                      </div>

                      <button onClick={handleBook} style={{width:'100%',padding:14,background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 8px 24px rgba(63,167,163,0.4)'}}>
                        Confirm Booking
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ══════ TAB 3 : PRESCRIPTIONS ══════ */}
              {tab === TAB.PRESCRIPTIONS && (
                <div className="fade-up">
                  <div style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:20 }}>Prescriptions</div>
                  {prescriptions.length===0 ? (
                    <div style={{...gcard,textAlign:'center',padding:50,color:'rgba(255,255,255,0.35)'}}>No prescriptions received yet</div>
                  ) : prescriptions.map(rx=>(
                    <div key={rx._id} style={{...gcard,marginBottom:14}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,paddingBottom:12,borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
                        <div>
                          <div style={{color:'#fff',fontWeight:700,fontSize:14}}>From: {formatDoctorName(rx.doctorId?.userId?.name)}</div>
                          <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,marginTop:2}}>{new Date(rx.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <button onClick={()=>downloadPrescriptionPDF(rx)}
                            style={{background:'rgba(25,118,210,0.12)',border:'1px solid rgba(25,118,210,0.3)',color:'#42a5f5',padding:'5px 12px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif",display:'flex',alignItems:'center',gap:5}}>
                            ⬇ PDF
                          </button>
                          <span style={{background:'rgba(63,167,163,0.15)',color:'#3FA7A3',border:'1px solid rgba(63,167,163,0.3)',borderRadius:50,padding:'4px 12px',fontSize:11,fontWeight:600}}>Rx</span>
                        </div>
                      </div>
                      {rx.medicines?.map((m,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:'#3FA7A3',flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <span style={{color:'#fff',fontWeight:600,fontSize:13}}>{m.name}</span>
                            <span style={{color:'rgba(255,255,255,0.45)',fontSize:12}}> — {m.dosage} · {m.duration}</span>
                            {m.instructions&&<span style={{color:'rgba(255,255,255,0.35)',fontSize:11}}> ({m.instructions})</span>}
                          </div>
                        </div>
                      ))}
                      {rx.notes&&<div style={{marginTop:10,color:'rgba(255,255,255,0.4)',fontSize:12,fontStyle:'italic'}}>Notes: {rx.notes}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* ══════ TAB 4 : MEDICAL HISTORY ══════ */}
              {tab === TAB.HISTORY && (
                <div className="fade-up">
                  <div style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:20 }}>Medical History</div>
                  <div style={{...gcard,marginBottom:18}}>
                    <div style={secH}>{editingHist?'Edit Condition':'Add Condition'}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                      <div><label style={lbl}>Condition Name *</label><input className="pi" value={histForm.condition} onChange={e=>setHistForm({...histForm,condition:e.target.value})} placeholder="e.g. Diabetes" style={inp}/></div>
                      <div><label style={lbl}>Diagnosed Date</label><input className="pi" type="date" value={histForm.diagnosedDate} onChange={e=>setHistForm({...histForm,diagnosedDate:e.target.value})} style={{...inp,colorScheme:'dark'}}/></div>
                    </div>
                    <div style={{marginBottom:14}}><label style={lbl}>Description</label><textarea className="pi" value={histForm.description} onChange={e=>setHistForm({...histForm,description:e.target.value})} rows={2} placeholder="Additional details..." style={{...inp,resize:'vertical'}}/></div>
                    <div style={{display:'flex',gap:10}}>
                      {editingHist&&<button onClick={()=>{setEditingHist(null);setHistForm({condition:'',diagnosedDate:'',description:''}); }} style={{padding:'10px 18px',background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.6)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:9,fontSize:13,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Cancel</button>}
                      <button onClick={handleAddHist} style={{flex:1,padding:'10px 0',background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 5px 16px rgba(63,167,163,0.35)'}}>
                        {editingHist?'Update':'Add Record'}
                      </button>
                    </div>
                  </div>
                  {history.length===0 ? <div style={{...gcard,textAlign:'center',padding:40,color:'rgba(255,255,255,0.35)'}}>No medical history added yet</div>
                  : history.map(h=>(
                    <div key={h._id} style={{...gcard,display:'flex',gap:14,alignItems:'flex-start',marginBottom:12}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:'#3FA7A3',marginTop:5,flexShrink:0,boxShadow:'0 0 7px rgba(63,167,163,0.6)'}}/>
                      <div style={{flex:1}}>
                        <div style={{color:'#fff',fontWeight:700,fontSize:14}}>{h.condition}</div>
                        {h.description&&<div style={{color:'rgba(255,255,255,0.45)',fontSize:12,marginTop:3}}>{h.description}</div>}
                        {h.diagnosedDate&&<div style={{color:'rgba(255,255,255,0.3)',fontSize:11,marginTop:4}}>Diagnosed: {new Date(h.diagnosedDate).toLocaleDateString()}</div>}
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <button onClick={()=>{setEditingHist(h._id);setHistForm({condition:h.condition,diagnosedDate:h.diagnosedDate?.split('T')[0]||'',description:h.description||''}); }} style={{background:'rgba(63,167,163,0.1)',border:'1px solid rgba(63,167,163,0.3)',color:'#3FA7A3',padding:'5px 12px',borderRadius:8,fontSize:11,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Edit</button>
                        <button onClick={()=>handleDeleteHist(h._id)} style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.25)',color:'#fca5a5',padding:'5px 12px',borderRadius:8,fontSize:11,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ══════ TAB 5 : MESSAGES ══════ */}
              {tab === TAB.MESSAGES && (
                <div className="fade-up">
                  <div style={{ color:'#fff', fontWeight:700, fontSize:18, marginBottom:20 }}>Messages</div>
                  <div style={gcard}>
                    {appointments.filter(a=>a.status==='confirmed').length===0 ? (
                      <div style={{textAlign:'center',padding:40,color:'rgba(255,255,255,0.35)',fontSize:14}}>No active chats. Book and confirm an appointment first.</div>
                    ) : appointments.filter(a=>a.status==='confirmed').map(a=>{
                      const dName = a.doctorId?.userId?.name||'Doctor';
                      const color = SPEC_COLORS[a.doctorId?.specialization]||'#1976d2';
                      return (
                        <div key={a._id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,0.07)',cursor:'pointer'}} onClick={()=>navigate(`/chat/${a._id}`)}>
                          <div style={{width:44,height:44,borderRadius:'50%',background:`linear-gradient(135deg,${color},${color}99)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16,flexShrink:0}}>
                            {dName.replace(/^Dr\.?\s*/i,'').charAt(0).toUpperCase()}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{color:'#fff',fontWeight:600,fontSize:14}}>{formatDoctorName(dName)}</div>
                            <div style={{color:'rgba(255,255,255,0.4)',fontSize:12}}>{a.timeSlot} · {a.type?.toUpperCase()}</div>
                          </div>
                          <button style={{background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',padding:'7px 16px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Open</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══════ TAB 6 : NOTIFICATIONS ══════ */}
              {tab === TAB.NOTIFICATIONS && (
                <div className="fade-up">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                    <div style={{color:'#fff',fontWeight:700,fontSize:18}}>Notifications</div>
                    {unread>0&&<button onClick={handleMarkRead} style={{background:'rgba(63,167,163,0.12)',border:'1px solid rgba(63,167,163,0.3)',color:'#3FA7A3',padding:'7px 16px',borderRadius:8,fontSize:12,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>Mark all read</button>}
                  </div>
                  {notifications.length===0 ? <div style={{...gcard,textAlign:'center',padding:50,color:'rgba(255,255,255,0.35)'}}>No notifications yet</div>
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
                  <div style={{color:'#fff',fontWeight:700,fontSize:18,marginBottom:20}}>Payments</div>
                  <div style={{display:'flex',gap:14,marginBottom:20,flexWrap:'wrap'}}>
                    <StatCard label="Total Paid"    value={`₹${appointments.filter(a=>a.paymentDone).reduce((s,a)=>s+(a.doctorId?.fees||0),0)}`} sub="All time"    accentColor="#4ade80"/>
                    <StatCard label="Pending Bills" value={appointments.filter(a=>a.status==='confirmed'&&!a.paymentDone).length} sub="Need payment" accentColor="#f59e0b" subColor="#fbbf24"/>
                  </div>
                  <div style={gcard}>
                    <div style={secH}>Payment History</div>
                    {appointments.filter(a=>a.paymentDone).length===0 ? (
                      <div style={{textAlign:'center',padding:30,color:'rgba(255,255,255,0.35)'}}>No payments made yet</div>
                    ) : appointments.filter(a=>a.paymentDone).map(a=>(
                      <div key={a._id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                        <div style={{width:36,height:36,borderRadius:10,background:'rgba(74,222,128,0.12)',border:'1px solid rgba(74,222,128,0.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{color:'#fff',fontWeight:600,fontSize:13}}>{formatDoctorName(a.doctorId?.userId?.name)}</div>
                          <div style={{color:'rgba(255,255,255,0.4)',fontSize:11}}>{new Date(a.date).toLocaleDateString()}</div>
                        </div>
                        <div style={{color:'#4ade80',fontWeight:700,fontSize:14}}>₹{a.doctorId?.fees||0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════ TAB 8 : PROFILE ══════ */}
              {tab === TAB.PROFILE && profile && (
                <div className="fade-up">
                  <div style={{background:'linear-gradient(135deg,rgba(25,118,210,0.35),rgba(63,167,163,0.25))',border:'1px solid rgba(63,167,163,0.28)',borderRadius:18,padding:'26px 28px',marginBottom:22,display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}}>
                    <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#1976d2,#3FA7A3)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:28,border:'3px solid rgba(255,255,255,0.2)',flexShrink:0,boxShadow:'0 0 20px rgba(63,167,163,0.4)'}}>
                      {profile.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{color:'#fff',fontWeight:700,fontSize:22}}>{profile.name}</div>
                      <div style={{color:'rgba(255,255,255,0.55)',fontSize:13,marginTop:3}}>Patient · {profile.email}</div>
                    </div>
                    <button onClick={()=>setEditMode(!editMode)} style={{background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.2)',padding:'9px 22px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif"}}>
                      {editMode?'✕ Cancel':'✏️ Edit Profile'}
                    </button>
                  </div>

                  {!editMode && (
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14,marginBottom:20}}>
                      {[{l:'Blood Group',v:profile.bloodGroup||'—'},{l:'Age',v:profile.age?`${profile.age} yrs`:'—'},{l:'Gender',v:profile.gender||'—'},{l:'City',v:profile.city||'—'},{l:'Country',v:profile.country||'—'},{l:'Phone',v:profile.phone||'—'}].map((item,i)=>(
                        <div key={i} style={{...gcard,padding:'16px 18px'}}>
                          <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginBottom:4}}>{item.l}</div>
                          <div style={{color:'#fff',fontWeight:600,fontSize:15}}>{item.v}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {editMode && (
                    <div style={gcard}>
                      {profileMsg&&<div style={{background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:10,padding:'10px 14px',color:'#4ade80',fontSize:13,marginBottom:14}}>✅ {profileMsg}</div>}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                        {[{n:'name',l:'Full Name'},{n:'phone',l:'Phone'},{n:'age',l:'Age',t:'number'},{n:'city',l:'City'},{n:'country',l:'Country'}].map(f=>(
                          <div key={f.n}><label style={lbl}>{f.l}</label><input className="pi" type={f.t||'text'} value={profileForm[f.n]||''} onChange={e=>setProfileForm({...profileForm,[f.n]:e.target.value})} style={inp}/></div>
                        ))}
                        <div><label style={lbl}>Gender</label><select className="pi" value={profileForm.gender||''} onChange={e=>setProfileForm({...profileForm,gender:e.target.value})} style={inp}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                        <div><label style={lbl}>Blood Group</label><select className="pi" value={profileForm.bloodGroup||''} onChange={e=>setProfileForm({...profileForm,bloodGroup:e.target.value})} style={inp}><option value="">Select</option>{BLOOD.map(b=><option key={b} value={b}>{b}</option>)}</select></div>
                      </div>
                      <button onClick={handleSaveProfile} style={{marginTop:18,width:'100%',padding:13,background:'linear-gradient(135deg,#1976d2,#3FA7A3)',color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'Poppins',sans-serif",boxShadow:'0 8px 22px rgba(63,167,163,0.35)'}}>Save Changes</button>
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