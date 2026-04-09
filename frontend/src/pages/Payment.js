import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { payAppointment, getDoctorById } from '../services/api';

const formatDoctorName = n => !n ? 'Doctor' : /^Dr\.?\s*/i.test(n) ? n : `Dr. ${n}`;

export default function Payment() {
  const navigate = useNavigate();
  const { appointmentId, doctorId, amount } = useParams();
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txnId, setTxnId] = useState('');
  const [doctor, setDoctor] = useState(null);
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upi, setUpi] = useState('');
  const [bank, setBank] = useState('');

  const fee = Number(amount) || 500;
  const platform = 20;
  const gst = Math.round((fee + platform) * 0.18);
  const total = fee + platform + gst;

  useEffect(() => {
    if (doctorId) getDoctorById(doctorId).then(r => setDoctor(r.data)).catch(() => {});
  }, []);

  const formatCard = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = v => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handlePay = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    try {
      await payAppointment(appointmentId);
      setTxnId('TXN' + Date.now());
      setSuccess(true);
    } catch (e) {
      alert('Payment failed: ' + (e.response?.data?.message || 'Try again'));
    } finally {
      setLoading(false);
    }
  };

  const dName = doctor?.userId?.name || 'Doctor';

  /* ─── shared style tokens ─── */
  const S = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#040c1e 0%,#071428 50%,#060f25 100%)',
      fontFamily: 'Poppins,sans-serif',
      padding: '30px 5%',
    },
    panel: {
      background: 'rgba(255,255,255,.05)',
      border: '1px solid rgba(255,255,255,.1)',
      borderRadius: 16,
      padding: 24,
    },
    panelTitle: {
      color: '#fff',
      fontWeight: 700,
      fontSize: 16,
      marginBottom: 20,
      margin: '0 0 20px',
    },
    lbl: {
      display: 'block',
      color: 'rgba(255,255,255,.55)',
      fontSize: 12,
      fontWeight: 500,
      marginBottom: 6,
    },
    inp: {
      width: '100%',
      padding: '12px 14px',
      background: 'rgba(255,255,255,.07)',
      border: '1px solid rgba(100,181,246,.2)',
      borderRadius: 9,
      color: '#fff',
      fontSize: 14,
      fontFamily: 'Poppins,sans-serif',
      boxSizing: 'border-box',
      outline: 'none',
    },
  };

  /* ─── Success screen ─── */
  if (success) return (
    <div style={{ minHeight: '100vh', background: '#040c1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins,sans-serif', padding: 20 }}>
      <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', backdropFilter: 'blur(20px)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: '#4ade80', fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Payment Successful!</h2>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, margin: '0 0 24px' }}>Your appointment has been confirmed</p>
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
          {[
            { l: 'Transaction ID', v: txnId },
            { l: 'Doctor',         v: formatDoctorName(dName) },
            { l: 'Amount Paid',    v: `₹${total}` },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < 2 ? 8 : 0 }}>
              <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>{r.l}</span>
              <span style={{ color: i === 2 ? '#4ade80' : '#fff', fontSize: 12, fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/dashboard/patient')}
          style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,#1976d2,#42a5f5)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  );

  /* ─── Main payment page ─── */
  return (
    <div style={S.page}>
      <style>{`
        .pi:focus  { border-color: rgba(66,165,245,.6) !important; background: rgba(25,118,210,.08) !important; outline: none; }
        .pi::placeholder { color: rgba(255,255,255,.25); }
        .pi option { background: #0a1628; color: #fff; }
        .mtab:hover { background: rgba(25,118,210,.15) !important; border-color: rgba(100,181,246,.4) !important; }
        .paybtn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(34,197,94,.4) !important; }
        .paybtn { transition: all .3s; }
      `}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#1565c0,#42a5f5)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 700 }}>✚</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>MediConsult</span>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
          {['Order Summary', 'Payment', 'Confirmation'].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,.15)' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i < 2 ? 'linear-gradient(135deg,#1976d2,#42a5f5)' : 'rgba(255,255,255,.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 700,
                }}>{i + 1}</div>
                <span style={{ color: i < 2 ? '#fff' : 'rgba(255,255,255,.35)', fontSize: 13, fontWeight: i < 2 ? 600 : 400 }}>{s}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>

          {/* ── Left: Order Summary ── */}
          <div style={S.panel}>
            <p style={S.panelTitle}>Order Summary</p>

            {/* Doctor row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#1976d2,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                {dName.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{formatDoctorName(dName)}</div>
                <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 12, marginTop: 2 }}>{doctor?.specialization}</div>
              </div>
            </div>

            {/* Fee breakdown */}
            {[
              { l: 'Consultation Fee', v: `₹${fee}` },
              { l: 'Platform Fee',     v: '₹20' },
              { l: 'GST (18%)',        v: `₹${gst}` },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 13 }}>{r.l}</span>
                <span style={{ color: '#e3f2fd', fontSize: 13 }}>{r.v}</span>
              </div>
            ))}

            <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Total</span>
              <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 18 }}>₹{total}</span>
            </div>
          </div>

          {/* ── Right: Payment form ── */}
          <div style={S.panel}>
            <p style={S.panelTitle}>Payment Method</p>

            {/* Method tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[{ v: 'card', l: '💳 Card' }, { v: 'upi', l: '📱 UPI' }, { v: 'netbanking', l: '🏦 Net Banking' }].map(m => (
                <button
                  key={m.v}
                  className="mtab"
                  onClick={() => setMethod(m.v)}
                  style={{
                    flex: 1,
                    padding: '9px 8px',
                    background: method === m.v ? 'rgba(25,118,210,.25)' : 'rgba(255,255,255,.05)',
                    border: `2px solid ${method === m.v ? 'rgba(66,165,245,.7)' : 'rgba(255,255,255,.12)'}`,
                    borderRadius: 9,
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Poppins,sans-serif',
                  }}
                >{m.l}</button>
              ))}
            </div>

            {/* Card fields */}
            {method === 'card' && (
              <div>
                <div style={{ background: 'rgba(25,118,210,.08)', border: '1px solid rgba(25,118,210,.2)', borderRadius: 9, padding: '10px 14px', color: 'rgba(255,255,255,.55)', fontSize: 11, marginBottom: 16 }}>
                  🧪 Test card: 4444 4444 4444 4444 &nbsp;|&nbsp; Expiry: 12/28 &nbsp;|&nbsp; CVV: 123
                </div>
                {[
                  { n: 'number', l: 'Card Number',      ph: '4444 4444 4444 4444' },
                  { n: 'expiry', l: 'Expiry',            ph: 'MM/YY' },
                  { n: 'cvv',    l: 'CVV',               ph: '123' },
                  { n: 'name',   l: 'Cardholder Name',   ph: 'Your Name' },
                ].map(f => (
                  <div key={f.n} style={{ marginBottom: 14 }}>
                    <label style={S.lbl}>{f.l}</label>
                    <input
                      className="pi"
                      value={card[f.n]}
                      onChange={e => {
                        let v = e.target.value;
                        if (f.n === 'number') v = formatCard(v);
                        if (f.n === 'expiry') v = formatExpiry(v);
                        if (f.n === 'cvv')    v = v.replace(/\D/g, '').slice(0, 3);
                        setCard({ ...card, [f.n]: v });
                      }}
                      placeholder={f.ph}
                      style={S.inp}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* UPI field */}
            {method === 'upi' && (
              <div>
                <div style={{ background: 'rgba(25,118,210,.08)', border: '1px solid rgba(25,118,210,.2)', borderRadius: 9, padding: '10px 14px', color: 'rgba(255,255,255,.55)', fontSize: 11, marginBottom: 16 }}>
                  📱 Enter any UPI ID for demo (e.g. test@upi)
                </div>
                <label style={S.lbl}>UPI ID</label>
                <input className="pi" value={upi} onChange={e => setUpi(e.target.value)} placeholder="yourname@upi" style={S.inp} />
              </div>
            )}

            {/* Net banking */}
            {method === 'netbanking' && (
              <div>
                <label style={S.lbl}>Select Bank</label>
                <select className="pi" value={bank} onChange={e => setBank(e.target.value)} style={S.inp}>
                  <option value="">Choose your bank</option>
                  {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Pay button */}
            <button
              className="paybtn"
              onClick={handlePay}
              disabled={loading}
              style={{
                width: '100%',
                padding: 14,
                background: loading ? 'rgba(22,163,74,.5)' : 'linear-gradient(135deg,#16a34a,#22c55e)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'Poppins,sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 20,
                boxShadow: loading ? 'none' : '0 8px 24px rgba(34,197,94,.35)',
              }}
            >
              {loading ? '⏳ Processing...' : `💳 Pay ₹${total}`}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
