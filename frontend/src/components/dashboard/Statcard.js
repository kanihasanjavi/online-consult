import React from 'react';

export default function StatCard({ label, value, sub, subColor = '#3FA7A3', icon, accentColor = '#3FA7A3' }) {
  return (
    <>
      <style>{`
        .mc-stat-card { background:rgba(255,255,255,0.06); border:1px solid rgba(63,167,163,0.18); border-radius:14px; padding:18px 20px; flex:1; min-width:120px; transition:all .3s; position:relative; overflow:hidden; }
        .mc-stat-card:hover { transform:translateY(-3px); border-color:rgba(63,167,163,0.4); box-shadow:0 8px 24px rgba(63,167,163,0.15); }
        .mc-stat-card::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--accent,#3FA7A3),transparent); }
      `}</style>
      <div className="mc-stat-card" style={{ '--accent': accentColor }}>
        {icon && (
          <div style={{ width:36, height:36, borderRadius:10, background:`${accentColor}22`, border:`1px solid ${accentColor}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            {icon}
          </div>
        )}
        <div style={{ color:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:500, marginBottom:4, letterSpacing:.3 }}>{label}</div>
        <div style={{ color:'#fff', fontWeight:700, fontSize:22, lineHeight:1.1, marginBottom:4 }}>{value}</div>
        {sub && <div style={{ color: subColor, fontSize:11, marginTop:2 }}>{sub}</div>}
      </div>
    </>
  );
}