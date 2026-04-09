import React from 'react';

const STATUS = {
  pending:   { bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.3)',  badge:'#fef3c7', badgeText:'#d97706',  label:'Pending'   },
  confirmed: { bg:'rgba(34,197,94,0.08)',   border:'rgba(34,197,94,0.25)',  badge:'#dcfce7', badgeText:'#16a34a', label:'Confirmed'  },
  cancelled: { bg:'rgba(220,38,38,0.08)',   border:'rgba(220,38,38,0.22)',  badge:'#fee2e2', badgeText:'#dc2626', label:'Cancelled'  },
  completed: { bg:'rgba(59,130,246,0.08)',  border:'rgba(59,130,246,0.22)', badge:'#dbeafe', badgeText:'#1d4ed8', label:'Completed'  },
  expired:   { bg:'rgba(107,114,128,0.08)', border:'rgba(107,114,128,0.2)', badge:'#f3f4f6', badgeText:'#6b7280', label:'Expired'    },
};

export default function AppointmentCard({
  name, dateStr, timeSlot, type, status, reason,
  avatarColor = 'linear-gradient(135deg,#1976d2,#3FA7A3)',
  children,
}) {
  const st = STATUS[status] || STATUS.pending;
  const initial = name?.replace(/^Dr\.?\s*/i,'').charAt(0).toUpperCase() || '?';

  return (
    <>
      <style>{`
        .mc-appt-card { border-radius:14px; padding:16px 18px; margin-bottom:12px; transition:all .25s; }
        .mc-appt-card:hover { transform:translateY(-2px); }
      `}</style>
      <div className="mc-appt-card" style={{ background: st.bg, border:`1px solid ${st.border}`, borderLeft:`4px solid ${st.badgeText}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom: children ? 12 : 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background: avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:17, flexShrink:0, boxShadow:'0 3px 12px rgba(0,0,0,0.3)', border:'2px solid rgba(255,255,255,0.15)' }}>
              {initial}
            </div>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:14, marginBottom:2 }}>{name}</div>
              <div style={{ color:'rgba(255,255,255,0.45)', fontSize:11 }}>
                {dateStr} {timeSlot ? `· ${timeSlot}` : ''} {type ? `· ${type.toUpperCase()}` : ''}
              </div>
              {reason && <div style={{ color:'rgba(255,255,255,0.38)', fontSize:11, marginTop:2 }}>📋 {reason}</div>}
            </div>
          </div>
          <span style={{ background: st.badge, color: st.badgeText, padding:'4px 13px', borderRadius:50, fontSize:11, fontWeight:700, flexShrink:0 }}>
            {st.label}
          </span>
        </div>
        {children && (
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:12 }}>
            {children}
          </div>
        )}
      </div>
    </>
  );
}