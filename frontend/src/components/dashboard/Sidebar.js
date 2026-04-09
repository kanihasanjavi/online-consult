import React from 'react';
import { useNavigate } from 'react-router-dom';

const Icon = ({ name, size = 17 }) => {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'overview':      return <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
    case 'appointments':  return <svg style={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'messages':      return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'notifications': return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
    case 'payments':      return <svg style={s} viewBox="0 0 24 24" {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case 'profile':       return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'logout':        return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
    case 'prescription':  return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>;
    case 'history':       return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
    case 'book':          return <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case 'rx':            return <svg style={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'schedule':      return <svg style={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case 'availability':  return <svg style={s} viewBox="0 0 24 24" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    default:              return null;
  }
};

const LogoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
    <circle cx="12" cy="12" r="4" fill="rgba(255,255,255,0.2)" stroke="none"/>
  </svg>
);

export default function Sidebar({ items, activeTab, onTabChange, onLogout, unreadCount = 0, collapsed = false }) {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        .mc-sidebar-item { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; cursor:pointer; transition:all .22s; color:rgba(255,255,255,0.6); font-size:13px; font-weight:500; border:1px solid transparent; position:relative; white-space:nowrap; }
        .mc-sidebar-item:hover { background:rgba(255,255,255,0.07); color:#fff; }
        .mc-sidebar-item.active { background:linear-gradient(135deg,rgba(25,118,210,0.3),rgba(63,167,163,0.18)); color:#fff; border-color:rgba(63,167,163,0.3); font-weight:600; }
        .mc-sidebar-item.active::before { content:''; position:absolute; left:0; top:20%; bottom:20%; width:3px; background:linear-gradient(180deg,#1976d2,#3FA7A3); border-radius:0 3px 3px 0; }
        .mc-sidebar-logout { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; cursor:pointer; transition:all .22s; color:rgba(252,165,165,0.8); font-size:13px; font-weight:500; border:1px solid rgba(220,38,38,0.2); }
        .mc-sidebar-logout:hover { background:rgba(220,38,38,0.12); color:#fca5a5; border-color:rgba(220,38,38,0.4); }
        .mc-badge { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:#3FA7A3; color:#fff; font-size:9px; font-weight:700; border-radius:50%; width:17px; height:17px; display:flex; align-items:center; justify-content:center; }
        @media (max-width:768px) { .mc-sidebar-label { display:none; } .mc-sidebar-item { justify-content:center; padding:10px; } .mc-sidebar-logout { justify-content:center; padding:10px; } }
      `}</style>

      <aside style={{
        width: collapsed ? 60 : 240,
        flexShrink: 0,
        background: 'rgba(5,13,32,0.95)',
        borderRight: '1px solid rgba(63,167,163,0.15)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 10px',
        gap: 4,
        transition: 'width .3s',
        overflowX: 'hidden',
        minHeight: '100vh',
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 8px 18px', borderBottom:'1px solid rgba(63,167,163,0.15)', marginBottom:8, cursor:'pointer' }}
        >
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#1976d2,#3FA7A3)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 14px rgba(63,167,163,0.4)' }}>
            <LogoIcon/>
          </div>
          {!collapsed && (
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:15, lineHeight:1.1 }}>
                Medi<span style={{ color:'#3FA7A3' }}>Consult</span>
              </div>
              <div style={{ color:'rgba(255,255,255,0.35)', fontSize:7, letterSpacing:2, textTransform:'uppercase', marginTop:1 }}>Online Doctor Portal</div>
            </div>
          )}
        </div>

        {/* Menu items — use item.tabIndex if provided, else fall back to position i */}
        {items.map((item, i) => {
          const tabValue = item.tabIndex !== undefined ? item.tabIndex : i;
          return (
            <div
              key={i}
              className={`mc-sidebar-item${activeTab === tabValue ? ' active' : ''}`}
              onClick={() => onTabChange(tabValue)}
            >
              <Icon name={item.icon} size={17}/>
              {!collapsed && <span className="mc-sidebar-label">{item.label}</span>}
              {item.badge && unreadCount > 0 && !collapsed && (
                <div className="mc-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>
              )}
            </div>
          );
        })}

        <div style={{ flex: 1 }}/>

        {/* Logout */}
        <div className="mc-sidebar-logout" onClick={onLogout}>
          <Icon name="logout" size={17}/>
          {!collapsed && <span className="mc-sidebar-label">Logout</span>}
        </div>
      </aside>
    </>
  );
}
