import React from 'react';

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(63,167,163,0.65)" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

export default function Topbar({ userName, userInitial, unreadCount = 0, onBellClick, onAvatarClick, placeholder = 'Search...' }) {
  return (
    <>
      <style>{`
        .mc-topbar-search::placeholder { color:rgba(255,255,255,0.28); }
        .mc-topbar-search:focus { outline:none; border-color:rgba(63,167,163,0.5)!important; background:rgba(63,167,163,0.08)!important; }
        .mc-topbar-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#1976d2,#3FA7A3); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 0 12px rgba(63,167,163,0.35); flex-shrink:0; transition:transform .2s; }
        .mc-topbar-avatar:hover { transform:scale(1.08); }
        .mc-bell-wrap { position:relative; cursor:pointer; display:flex; align-items:center; }
        .mc-bell-wrap:hover svg { stroke:rgba(255,255,255,0.9); }
      `}</style>

      <header style={{
        height: 62,
        background: 'rgba(5,13,32,0.9)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(63,167,163,0.13)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 14,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Search */}
        <div style={{ flex: 1, maxWidth: 400, display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(63,167,163,0.22)', borderRadius:10, padding:'8px 14px', transition:'all .25s' }}>
          <SearchIcon/>
          <input
            className="mc-topbar-search"
            placeholder={placeholder}
            style={{ flex:1, background:'none', border:'none', color:'#fff', fontSize:13, fontFamily:"'Poppins',sans-serif" }}
          />
        </div>

        <div style={{ flex:1 }}/>

        {/* Bell */}
        <div className="mc-bell-wrap" onClick={onBellClick}>
          <BellIcon/>
          {unreadCount > 0 && (
            <div style={{ position:'absolute', top:-3, right:-3, width:16, height:16, background:'#3FA7A3', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:9, fontWeight:700, border:'2px solid rgba(5,13,32,0.9)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width:1, height:28, background:'rgba(255,255,255,0.1)' }}/>

        {/* Avatar + name */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="mc-topbar-avatar" onClick={onAvatarClick}>
            {userInitial}
          </div>
          <div>
            <div style={{ color:'#fff', fontWeight:600, fontSize:13, lineHeight:1.2 }}>{userName}</div>
            <div style={{ color:'rgba(255,255,255,0.38)', fontSize:10 }}>Online</div>
          </div>
        </div>
      </header>
    </>
  );
}