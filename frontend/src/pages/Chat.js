import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChatHistory, updateAppointmentStatus } from '../services/api';
import { io } from 'socket.io-client';

export default function Chat() {
  const { appointmentId } = useParams();
  const navigate           = useNavigate();
  const { user }           = useAuth();

  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [connected,   setConnected]   = useState(false);
  const [typing,      setTyping]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [sessionEnded,setSessionEnded]= useState(false);
  const [endConfirm,  setEndConfirm]  = useState(false);
  const [imagePreview,setImagePreview]= useState(null);   // { file, dataUrl }
  const [uploading,   setUploading]   = useState(false);
  const [absentBanner,setAbsentBanner]= useState('');

  const socketRef       = useRef(null);
  const messagesEndRef  = useRef(null);
  const typingTimeoutRef= useRef(null);
  const fileInputRef    = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    // Load chat history
    (async () => {
      try { const r = await getChatHistory(appointmentId); setMessages(r.data); setTimeout(scrollToBottom, 200); }
      catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();

    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    socket.on('connect',    () => { setConnected(true);  socket.emit('join_room', { appointmentId, userId: user.id, userName: user.name, role: user.role }); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('receive_message', msg => { setMessages(prev => [...prev, msg]); setTimeout(scrollToBottom, 100); });
    socket.on('user_typing', data => {
      if (data.userId !== user.id) {
        setTyping(data.userName);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(null), 2000);
      }
    });
    socket.on('session_ended', () => setSessionEnded(true));
    socket.on('other_absent', (data) => {
      setAbsentBanner(data.message || 'The other party has not joined yet. They have been notified.');
    });
    socket.on('other_arrived', () => {
      setAbsentBanner('');
    });
    return () => { socket.disconnect(); if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  /* ── Send text message ── */
  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || sessionEnded) return;
    socketRef.current.emit('send_message', {
      appointmentId, senderId: user.id, senderName: user.name,
      senderRole: user.role, message: input.trim(), type: 'text'
    });
    setInput('');
  };

  /* ── Send image ── */
  const sendImage = async () => {
    if (!imagePreview || !socketRef.current || sessionEnded) return;
    setUploading(true);
    try {
      // Emit image as base64 via socket
      socketRef.current.emit('send_message', {
        appointmentId, senderId: user.id, senderName: user.name,
        senderRole: user.role, message: imagePreview.dataUrl,
        type: 'image', fileName: imagePreview.file.name
      });
      setImagePreview(null);
    } catch(e) { console.error(e); }
    finally { setUploading(false); }
  };

  /* ── Handle file pick ── */
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Only image files are allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setImagePreview({ file, dataUrl: ev.target.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ── End session ── */
  const handleEndSession = async () => {
    try {
      await updateAppointmentStatus(appointmentId, { status: 'completed' });
      socketRef.current?.emit('end_session', { appointmentId, endedBy: user.name });
      setSessionEnded(true);
      setEndConfirm(false);
    } catch(e) { alert('Failed to end session'); }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTyping = e => {
    setInput(e.target.value);
    if (socketRef.current) socketRef.current.emit('typing', { appointmentId, userId: user.id, userName: user.name });
  };

  const formatTime = d => new Date(d).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const shortId = appointmentId?.slice(-8).toUpperCase();
  const isDoctor = user?.role === 'doctor';

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0B1F3A 0%,#071828 100%)', fontFamily:"'Poppins',sans-serif", display:'flex', flexDirection:'column',overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        .msg-input { transition:all .25s; }
        .msg-input:focus { outline:none; border-color:rgba(63,167,163,0.6)!important; background:rgba(63,167,163,0.08)!important; }
        .msg-input::placeholder { color:rgba(255,255,255,0.28); }
        .send-btn:hover:not(:disabled) { transform:scale(1.06)!important; box-shadow:0 8px 24px rgba(63,167,163,0.5)!important; }
        .action-btn:hover { opacity:.82!important; transform:translateY(-1px)!important; }
        @keyframes typingDot { 0%,80%,100%{opacity:0;transform:translateY(0)} 40%{opacity:1;transform:translateY(-4px)} }
        .tdot:nth-child(1){ animation:typingDot 1.2s ease-in-out 0s infinite }
        .tdot:nth-child(2){ animation:typingDot 1.2s ease-in-out .2s infinite }
        .tdot:nth-child(3){ animation:typingDot 1.2s ease-in-out .4s infinite }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg-bubble { animation:fadeIn .25s ease both; }
        @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(63,167,163,0.25); border-radius:4px; }
      `}</style>

      {/* ── END CONFIRM MODAL ── */}
      {endConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#0d1b3e', border:'1px solid rgba(220,38,38,0.35)', borderRadius:18, padding:'28px 26px', maxWidth:380, width:'100%', textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
            </div>
            <div style={{ color:'#fca5a5', fontWeight:700, fontSize:18, marginBottom:8 }}>End Session?</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, lineHeight:1.6, marginBottom:22 }}>
              This will mark the appointment as <strong style={{color:'#fff'}}>Completed</strong> and close the consultation room. This action cannot be undone.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setEndConfirm(false)} style={{ flex:1, padding:11, background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:10, fontSize:13, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
                Keep Chatting
              </button>
              <button onClick={handleEndSession} style={{ flex:1, padding:11, background:'linear-gradient(135deg,#dc2626,#ef4444)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Poppins',sans-serif", boxShadow:'0 5px 16px rgba(220,38,38,0.4)' }}>
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background:'rgba(5,13,32,0.97)', borderBottom:'1px solid rgba(63,167,163,0.18)', padding:'12px 5%', position:'sticky', top:0, zIndex:100, backdropFilter:'blur(18px)' }}>
        <div style={{ maxWidth:860, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>

          {/* Left: back + room info */}
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <button onClick={() => navigate(-1)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.7)', padding:'7px 15px', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
              ← Back
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, background:'linear-gradient(135deg,#1976d2,#3FA7A3)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 14px rgba(63,167,163,0.35)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div>
                <div style={{ color:'#fff', fontWeight:600, fontSize:14 }}>Consultation #{shortId}</div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{isDoctor ? 'Doctor View' : 'Patient View'} · Appointment Room</div>
              </div>
            </div>
          </div>

          {/* Right: status + end session */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Connection badge */}
            <div style={{ display:'flex', alignItems:'center', gap:6, background: sessionEnded ? 'rgba(107,114,128,0.12)' : connected ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.12)', border:`1px solid ${sessionEnded?'rgba(107,114,128,0.3)':connected?'rgba(34,197,94,0.3)':'rgba(220,38,38,0.3)'}`, borderRadius:50, padding:'5px 13px' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background: sessionEnded?'#9ca3af':connected?'#22c55e':'#ef4444', boxShadow: !sessionEnded&&connected?'0 0 6px rgba(34,197,94,0.7)':'' }}/>
              <span style={{ color: sessionEnded?'#9ca3af':connected?'#4ade80':'#fca5a5', fontSize:12, fontWeight:500 }}>
                {sessionEnded ? 'Session Ended' : connected ? 'Live Session' : 'Connecting...'}
              </span>
            </div>

            {/* End Session button — visible to both, but doctor ends it */}
            {!sessionEnded && (
              <button onClick={()=>setEndConfirm(true)} className="action-btn"
                style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(220,38,38,0.12)', border:'1px solid rgba(220,38,38,0.35)', color:'#fca5a5', padding:'7px 16px', borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Poppins',sans-serif", transition:'all .2s' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
                End Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SESSION ENDED BANNER ── */}
      {sessionEnded && (
        <div style={{ background:'rgba(107,114,128,0.1)', border:'1px solid rgba(107,114,128,0.25)', margin:'16px 5%', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, maxWidth:860, width:'calc(100% - 10%)', alignSelf:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <div style={{ color:'#d1d5db', fontWeight:600, fontSize:13 }}>Consultation Completed</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:1 }}>This session has ended. Chat is now read-only.</div>
            </div>
          </div>
          <button onClick={() => navigate(isDoctor ? '/dashboard/doctor' : '/dashboard/patient')}
            style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.15)', padding:'8px 18px', borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Poppins',sans-serif" }}>
            Go to Dashboard
          </button>
        </div>
      )}

      {/* Absent party banner */}
      {absentBanner && (
        <div style={{ background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:10, padding:'10px 16px', margin:'8px 16px 0', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span>⏳</span>
            <span style={{ color:'#fbbf24', fontSize:13, fontFamily:"'Poppins',sans-serif" }}>{absentBanner}</span>
          </div>
          <button onClick={()=>setAbsentBanner('')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:16 }}>✕</button>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div style={{ flex:1, maxWidth:860, width:'100%', margin:'0 auto', padding:'20px 5%', display:'flex', flexDirection:'column', gap:10, overflowY:'auto', overflowX:'hidden', minHeight:300 }}>
        {loading ? (
          <div style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', marginTop:60 }}>
            <div style={{ width:40, height:40, border:'3px solid rgba(63,167,163,0.2)', borderTop:'3px solid #3FA7A3', borderRadius:'50%', margin:'0 auto 14px', animation:'pulse 1s linear infinite' }}/>
            <div>Loading chat history...</div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', marginTop:60 }}>
            <div style={{ width:60, height:60, background:'rgba(63,167,163,0.1)', border:'1px solid rgba(63,167,163,0.25)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(63,167,163,0.7)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{ fontSize:15, marginBottom:5 }}>No messages yet</div>
            <div style={{ fontSize:12 }}>Start the consultation by sending a message</div>
          </div>
        ) : messages.map((msg, i) => {
          const isMe    = msg.senderId === user.id || (typeof msg.senderId === 'object' && msg.senderId?._id === user.id);
          const isImage = msg.type === 'image';
          return (
            <div key={i} className="msg-bubble" style={{ display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && <div style={{ color:'rgba(255,255,255,0.42)', fontSize:11, marginBottom:3, paddingLeft:4 }}>{msg.senderName}</div>}
              <div style={{ maxWidth:'68%', background: isMe ? 'linear-gradient(135deg,#1976d2,#3FA7A3)' : 'rgba(255,255,255,0.08)', border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: isImage ? '6px' : '11px 15px', boxShadow: isMe ? '0 4px 16px rgba(63,167,163,0.3)' : 'none', overflow:'hidden' }}>
                {isImage ? (
                  <img src={msg.message} alt={msg.fileName||'image'} style={{ maxWidth:'100%', maxHeight:280, borderRadius:12, display:'block', cursor:'pointer' }} onClick={()=>window.open(msg.message,'_blank')}/>
                ) : (
                  <div style={{ color:'#fff', fontSize:14, lineHeight:1.6, wordBreak:'break-word' }}>{msg.message}</div>
                )}
              </div>
              <div style={{ color:'rgba(255,255,255,0.28)', fontSize:10, marginTop:3, paddingLeft:4, paddingRight:4 }}>
                {isImage && '📎 '}{formatTime(msg.createdAt || new Date())}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typing && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}>
            <div style={{ color:'rgba(255,255,255,0.42)', fontSize:11, marginBottom:3, paddingLeft:4 }}>{typing}</div>
            <div style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px 18px 18px 4px', padding:'10px 14px', display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ color:'rgba(255,255,255,0.45)', fontSize:11, marginRight:4 }}>typing</span>
              {[0,1,2].map(j => <div key={j} className="tdot" style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.5)' }}/>)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* ── IMAGE PREVIEW BAR ── */}
      {imagePreview && (
        <div style={{ background:'rgba(5,13,32,0.97)', borderTop:'1px solid rgba(63,167,163,0.18)', padding:'10px 5%' }}>
          <div style={{ maxWidth:860, margin:'0 auto', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <img src={imagePreview.dataUrl} alt="preview" style={{ width:60, height:60, objectFit:'cover', borderRadius:10, border:'2px solid rgba(63,167,163,0.4)' }}/>
              <button onClick={()=>setImagePreview(null)} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, background:'#ef4444', border:'none', borderRadius:'50%', color:'#fff', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>✕</button>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:'#fff', fontSize:13, fontWeight:600 }}>{imagePreview.file.name}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:2 }}>
                {(imagePreview.file.size / 1024).toFixed(0)} KB · Ready to send
              </div>
            </div>
            <button onClick={sendImage} disabled={uploading}
              style={{ background:'linear-gradient(135deg,#1976d2,#3FA7A3)', color:'#fff', border:'none', padding:'9px 20px', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Poppins',sans-serif", boxShadow:'0 5px 16px rgba(63,167,163,0.35)', opacity: uploading?0.6:1 }}>
              {uploading ? 'Sending...' : 'Send Image'}
            </button>
          </div>
        </div>
      )}

      {/* ── INPUT AREA ── */}
      {!sessionEnded && (
        <div style={{ background:'rgba(5,13,32,0.97)', borderTop:'1px solid rgba(63,167,163,0.13)', padding:'14px 5%', position:'sticky', bottom:0, backdropFilter:'blur(18px)' }}>
          <div style={{ maxWidth:860, margin:'0 auto', display:'flex', gap:10, alignItems:'flex-end' }}>

            {/* Image upload button */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display:'none' }}/>
            <button onClick={()=>fileInputRef.current?.click()}
              title="Attach image"
              style={{ width:46, height:46, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(63,167,163,0.25)', borderRadius:11, color:'rgba(255,255,255,0.6)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .2s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>

            {/* Text input */}
            <textarea
              className="msg-input"
              value={input}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              rows={2}
              style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(63,167,163,0.22)', borderRadius:12, color:'#fff', fontSize:14, fontFamily:"'Poppins',sans-serif", padding:'11px 15px', resize:'none' }}
            />

            {/* Send button */}
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
              title="Send message"
              style={{ width:46, height:46, background: input.trim() ? 'linear-gradient(135deg,#1976d2,#3FA7A3)' : 'rgba(255,255,255,0.07)', border:'none', borderRadius:11, color:'#fff', cursor: input.trim() ? 'pointer' : 'default', flexShrink:0, transition:'all .25s', boxShadow: input.trim() ? '0 5px 18px rgba(63,167,163,0.4)' : 'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <div style={{ maxWidth:860, margin:'4px auto 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ color:'rgba(255,255,255,0.2)', fontSize:10 }}>Enter to send · Shift+Enter for new line · 📎 to attach image</div>
            <div style={{ color:'rgba(255,255,255,0.2)', fontSize:10 }}>{input.length} chars</div>
          </div>
        </div>
      )}

      {/* Ended — show read-only note */}
      {sessionEnded && (
        <div style={{ background:'rgba(5,13,32,0.97)', borderTop:'1px solid rgba(107,114,128,0.2)', padding:'14px 5%', textAlign:'center' }}>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:13 }}>
            Session has ended — chat is read-only
          </div>
        </div>
      )}
    </div>
  );
}