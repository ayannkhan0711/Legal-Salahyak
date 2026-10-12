import React, { useState } from 'react';
import { 
  Briefcase, IndianRupee, Calendar, CheckCircle, Clock, Video, 
  MessageSquare, FileText, ArrowRight, ShieldCheck, User 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdvocateDashboardPage({ setActivePage, setBookingContext }) {
  const { user } = useAuth();

  const [activeSlots, setActiveSlots] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
  });

  const upcomingBookings = [
    {
      id: 'BK-891042',
      clientName: 'Rahul Verma',
      issue: 'Section 138 Cheque Bounce Demand Notice reply',
      slot: 'Today, 04:30 PM IST',
      mode: 'video',
      fee: 1200,
      documentName: 'statutory_demand_notice_sec138.pdf',
    },
    {
      id: 'BK-761234',
      clientName: 'Sunita Mehra',
      issue: 'Tenant Security Deposit Recovery Notice',
      slot: 'Tomorrow, 11:30 AM IST',
      mode: 'chat',
      fee: 500,
      documentName: 'rental_agreement_clause_breach.pdf',
    },
  ];

  const handleJoinCall = (booking) => {
    if (setBookingContext) {
      setBookingContext({
        bookingId: booking.id,
        advocateName: user?.name || 'Adv. Rajesh Sharma',
        mode: booking.mode,
        slot: booking.slot,
      });
    }
    setActivePage('consultation');
  };

  return (
    <div style={{ padding: '40px 0 80px 0' }}>
      <div className="container">
        {/* Header Profile Bar */}
        <div className="glass-panel" style={{
          padding: '28px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              border: '2px solid var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#D4AF37',
            }}>
              {user?.name?.[0] || 'A'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.5rem', color: '#F8FAFC', margin: 0 }}>
                  {user?.name || 'Adv. Rajesh Sharma'}
                </h1>
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle size={12} /> Bar Council Verified
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '4px' }}>
                Enrollment: <strong>D/1420/2012</strong> • Bar Council of Delhi • Delhi High Court
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setActivePage('consultation')}
              className="btn btn-primary"
              style={{ fontSize: '0.9rem', padding: '10px 20px' }}
            >
              <Video size={16} /> Enter Waiting Room
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          marginBottom: '36px',
        }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              TOTAL REVENUE EARNED
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#D4AF37', fontFamily: 'var(--font-serif)' }}>
              ₹48,200
            </div>
            <div style={{ fontSize: '0.78rem', color: '#10B981', marginTop: '6px' }}>
              + ₹3,600 this week (85% net payout)
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              CONSULTATIONS COMPLETED
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-serif)' }}>
              38 Sessions
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Average client satisfaction: 4.9 ★
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              SETTLEMENT STATUS
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-serif)' }}>
              Linked Active
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              HDFC Bank • A/C ending in 4019
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '28px',
        }}>
          {/* Upcoming Consultations */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#F8FAFC', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={20} color="#D4AF37" />
              Upcoming Client Consultations
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {upcomingBookings.map((b) => (
                <div key={b.id} style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#F8FAFC' }}>
                        {b.clientName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#D4AF37', marginTop: '2px' }}>
                        {b.slot} • {b.mode.toUpperCase()} Call
                      </div>
                    </div>
                    <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                      ₹{b.fee}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Issue: {b.issue}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <FileText size={14} color="#D4AF37" />
                      <span>{b.documentName}</span>
                    </div>

                    <button
                      onClick={() => handleJoinCall(b)}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                    >
                      <Video size={14} /> Join Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Availability Schedule Manager */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#F8FAFC', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="#D4AF37" />
              Weekly Consultation Availability
            </h2>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Toggle your working days to open 30-minute booking slots automatically:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(activeSlots).map(([day, enabled]) => (
                <div key={day} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <span style={{ fontSize: '0.9rem', color: '#F8FAFC', textTransform: 'capitalize' }}>
                    {day}
                  </span>
                  <button
                    onClick={() => setActiveSlots({ ...activeSlots, [day]: !enabled })}
                    className={`btn ${enabled ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '4px 14px', fontSize: '0.78rem' }}
                  >
                    {enabled ? 'Active (10 AM - 6 PM)' : 'Off Day'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
