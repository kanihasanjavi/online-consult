import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDoctorById } from '../services/api';

const formatDoctorName = n => !n?'Doctor':/^Dr\.?\s*/i.test(n)?n:`Dr. ${n}`;
const SPEC_COLORS = {'Cardiologist':'#e53935','Dermatologist':'#8e24aa','Neurologist':'#1e88e5','Orthopedist':'#f4511e','Pediatrician':'#43a047','Psychiatrist':'#6d4c41','Gynecologist':'#d81b60','Ophthalmologist':'#00897b','ENT Specialist':'#fb8c00','Dentist':'#3949ab','General Physician':'#1976d2','Urologist':'#00acc1'};
const HEX = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='140'%3E%3Cpolygon points='60,5 115,35 115,105 60,135 5,105 5,35' fill='none' stroke='rgba(100,180,255,0.1)' stroke-width='1.2'/%3E%3C/svg%3E")`;

export default function DoctorViewProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{ fetchDoctor(); },[]);
  const fetchDoctor = async()=>{ try{const r=await getDoctorById(id);setDoctor(r.data);}catch(e){console.error(e);}finally{setLoading(false);} };

  const handleBook = ()=>{
    if(!user){navigate('/register');return;}
    if(user.role==='doctor'){alert('Doctors cannot book appointments.');return;}
    navigate(`/book/${id}`);
  };

  if(loading) return <div style={{ minHeight:'100vh',background:'#040c1e',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Poppins,sans-serif',color:'rgba(255,255,255,.4)' }}><div style={{ textAlign:'center' }}><div style={{ fontSize:48,marginBottom:16 }}>⏳</div><div>Loading...</div></div></div>;
  if(!doctor) return <div style={{ minHeight:'100vh',background:'#040c1e',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Poppins,sans-serif' }}><div style={{ textAlign:'center',color:'rgba(255,255,255,.5)' }}><div style={{ fontSize:48,marginBottom:16 }}>😕</div><div>Doctor not found</div><button onClick={()=>navigate('/doctors')} style={{ marginTop:16,background:'linear-gradient(135deg,#1976d2,#42a5f5)',color:'#fff',border:'none',padding:'10px 24px',borderRadius:8,cursor:'pointer',fontFamily:'Poppins,sans-serif' }}>Back to Doctors</button></div></div>;

  const name=doctor.userId?.name||'',spec=doctor.specialization||'',color=SPEC_COLORS[spec]||'#1976d2';
  const initial=name.replace(/^Dr\.?\s*/i,'').charAt(0).toUpperCase()||'D';
  const days=doctor.availability?.map(a=>a.day)||[];
  const today=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(160deg,#040c1e 0%,#071428 40%,#060f25 100%)',fontFamily:'Poppins,sans-serif',position:'relative',overflow:'hidden' }}>
      <div style={{ position:'fixed',inset:0,backgroundImage:HEX,backgroundSize:'120px 140px',opacity:.55,pointerEvents:'none',zIndex:0 }}/>

      <nav style={{ position:'sticky',top:0,zIndex:100,background:'rgba(4,12,30,.97)',backdropFilter:'blur(18px)',borderBottom:'1px solid rgba(100,181,246,.15)',padding:'0 5%' }}>
        <div style={{ maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:68 }}>
          <div style={{ display:'flex',alignItems:'center',gap:12,cursor:'pointer' }} onClick={()=>navigate('/')}>
            <div style={{ width:40,height:40,background:'linear-gradient(135deg,#1565c0,#42a5f5)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#fff',fontWeight:700 }}>✚</div>
            <div style={{ color:'#fff',fontWeight:700,fontSize:18 }}>MediConsult</div>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>navigate('/doctors')} style={{ background:'rgba(255,255,255,.07)',color:'rgba(255,255,255,.75)',border:'1px solid rgba(255,255,255,.15)',padding:'9px 20px',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'Poppins,sans-serif' }}>← All Doctors</button>
            <button onClick={handleBook} style={{ background:`linear-gradient(135deg,${color},${color}cc)`,color:'#fff',border:'none',padding:'9px 22px',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Poppins,sans-serif',boxShadow:`0 4px 16px ${color}44` }}>Book Appointment</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:900,margin:'0 auto',padding:'32px 5%',position:'relative',zIndex:1 }}>
        {/* Hero card */}
        <div style={{ background:`linear-gradient(135deg,${color}22,rgba(10,22,50,.95))`,border:`1px solid ${color}33`,borderRadius:20,padding:'32px',marginBottom:24,backdropFilter:'blur(14px)',position:'relative',overflow:'hidden' }}>
          <div style={{ position:'absolute',top:-40,right:-40,width:200,height:200,background:`radial-gradient(circle,${color}22 0%,transparent 70%)`,pointerEvents:'none' }}/>
          <div style={{ display:'flex',alignItems:'center',gap:24,flexWrap:'wrap',position:'relative',zIndex:1 }}>
            <div style={{ width:80,height:80,borderRadius:'50%',background:`linear-gradient(135deg,${color},${color}99)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:32,flexShrink:0,boxShadow:`0 8px 28px ${color}55`,border:'3px solid rgba(255,255,255,.2)' }}>{initial}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:8 }}>
                <div style={{ color:'#e3f2fd',fontWeight:700,fontSize:24 }}>{formatDoctorName(name)}</div>
                <div style={{ background:`${color}28`,color:color,border:`1px solid ${color}55`,borderRadius:50,padding:'4px 16px',fontSize:13,fontWeight:600 }}>{spec}</div>
                {doctor.isAvailable&&<div style={{ background:'rgba(34,197,94,.15)',color:'#4ade80',border:'1px solid rgba(34,197,94,.3)',borderRadius:50,padding:'4px 14px',fontSize:12,fontWeight:500 }}>✅ Available</div>}
              </div>
              <div style={{ color:'rgba(255,255,255,.55)',fontSize:13 }}>{doctor.userId?.email}</div>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16 }}>
              {[{l:'Experience',v:`${doctor.experience} yrs`},{l:'Rating',v:`⭐ ${doctor.rating||4.5}`},{l:'Fees',v:`₹${doctor.fees}`}].map((s,i)=>(
                <div key={i} style={{ textAlign:'center',background:'rgba(255,255,255,.06)',borderRadius:10,padding:'12px 16px' }}>
                  <div style={{ color:'rgba(255,255,255,.45)',fontSize:11,marginBottom:4 }}>{s.l}</div>
                  <div style={{ color:'#e3f2fd',fontWeight:700,fontSize:16 }}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20 }}>
          {/* Bio */}
          {doctor.bio&&(
            <div style={{ background:'rgba(10,22,50,.8)',border:'1px solid rgba(100,181,246,.15)',borderRadius:16,padding:'24px',backdropFilter:'blur(10px)' }}>
              <div style={{ color:'rgba(255,255,255,.6)',fontSize:12,fontWeight:600,letterSpacing:1,textTransform:'uppercase',marginBottom:14 }}>About</div>
              <p style={{ color:'rgba(255,255,255,.7)',fontSize:14,lineHeight:1.7 }}>{doctor.bio}</p>
            </div>
          )}

          {/* Availability */}
          <div style={{ background:'rgba(10,22,50,.8)',border:'1px solid rgba(100,181,246,.15)',borderRadius:16,padding:'24px',backdropFilter:'blur(10px)' }}>
            <div style={{ color:'rgba(255,255,255,.6)',fontSize:12,fontWeight:600,letterSpacing:1,textTransform:'uppercase',marginBottom:14 }}>Availability</div>
            {days.length>0?(
              <div style={{ display:'flex',flexWrap:'wrap',gap:10 }}>
                {days.map(d=>(
                  <div key={d} style={{ background:d===today?'rgba(34,197,94,.15)':'rgba(25,118,210,.15)',color:d===today?'#4ade80':'#64b5f6',border:`1px solid ${d===today?'rgba(34,197,94,.3)':'rgba(25,118,210,.3)'}`,borderRadius:50,padding:'6px 18px',fontSize:13,fontWeight:500 }}>
                    {d===today?`✅ ${d} (Today)`:d}
                  </div>
                ))}
              </div>
            ):(
              <p style={{ color:'rgba(255,255,255,.4)',fontSize:13 }}>Contact doctor for availability</p>
            )}
          </div>
        </div>

        {/* Book CTA */}
        <div style={{ background:`linear-gradient(135deg,${color}22,rgba(10,22,50,.9))`,border:`1px solid ${color}33`,borderRadius:16,padding:'24px',marginTop:20,textAlign:'center',backdropFilter:'blur(10px)' }}>
          <div style={{ color:'#e3f2fd',fontWeight:700,fontSize:18,marginBottom:8 }}>Ready to consult {formatDoctorName(name)}?</div>
          <div style={{ color:'rgba(255,255,255,.5)',fontSize:13,marginBottom:18 }}>Consultation fee: ₹{doctor.fees}</div>
          <button onClick={handleBook} style={{ background:`linear-gradient(135deg,${color},${color}cc)`,color:'#fff',border:'none',padding:'14px 40px',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'Poppins,sans-serif',boxShadow:`0 8px 24px ${color}44`,transition:'all .3s' }}>Book Appointment →</button>
        </div>
      </div>
    </div>
  );
}
