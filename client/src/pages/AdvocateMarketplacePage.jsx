import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Star, CheckCircle, ShieldCheck, MapPin, 
  Calendar, Clock, Video, MessageSquare, ArrowRight, X, Lock, Check 
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export function AdvocateMarketplacePage({ setActivePage, selectedDocumentForBooking, setBookingContext }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [advocates, setAdvocates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPractice, setSelectedPractice] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');

  // Booking Modal State
  const [bookingModalAdvocate, setBookingModalAdvocate] = useState(null);
  const [consultationMode, setConsultationMode] = useState('video'); // 'chat' | 'video'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [shareDocConsent, setShareDocConsent] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Sample Advocates for offline/immediate preview
  const defaultAdvocates = [
    {
      _id: 'adv_1',
      name: 'Adv. Rajesh Sharma',
      enrollmentNumber: 'D/1420/2012',
      barCouncil: 'Bar Council of Delhi',
      verificationStatus: 'verified',
      practiceAreas: ['Criminal Law', 'Cyber Crime', 'Bail & Summons'],
      courts: ['Delhi High Court', 'Tis Hazari District Court'],
      experienceYears: 12,
      city: 'New Delhi',
      state: 'Delhi',
      languages: ['English', 'Hindi'],
      bio: 'Practicing defense advocate specializing in economic offences, cyber fraud recovery, FIR quashing, and anticipatory bail under BNSS/BNS 2023.',
      rating: 4.9,
      reviewCount: 38,
      fees: { chat: 50000, video: 120000 }, // in paise -> ₹500, ₹1,200
      slots: [
        { time: 'Today, 04:30 PM IST', duration: 30 },
        { time: 'Today, 06:00 PM IST', duration: 30 },
        { time: 'Tomorrow, 11:30 AM IST', duration: 30 },
        { time: 'Tomorrow, 03:00 PM IST', duration: 30 },
      ],
    },
    {
      _id: 'adv_2',
      name: 'Adv. Priya Deshmukh',
      enrollmentNumber: 'MAH/3421/2015',
      barCouncil: 'Bar Council of Maharashtra & Goa',
      verificationStatus: 'verified',
      practiceAreas: ['Family Law', 'Domestic Violence', 'Matrimonial Mediation'],
      courts: ['Bombay High Court', 'Family Court Bandra'],
      experienceYears: 9,
      city: 'Mumbai',
      state: 'Maharashtra',
      languages: ['English', 'Hindi', 'Marathi'],
      bio: 'Advocate specializing in family dispute resolution, domestic violence protection orders, child custody, and maintenance under statutory frameworks.',
      rating: 4.8,
      reviewCount: 42,
      fees: { chat: 45000, video: 100000 }, // ₹450, ₹1,000
      slots: [
        { time: 'Today, 05:00 PM IST', duration: 30 },
        { time: 'Tomorrow, 10:00 AM IST', duration: 30 },
        { time: 'Tomorrow, 04:00 PM IST', duration: 30 },
      ],
    },
    {
      _id: 'adv_3',
      name: 'Adv. Vikramaditya Reddy',
      enrollmentNumber: 'KAR/8912/2010',
      barCouncil: 'Bar Council of Karnataka',
      verificationStatus: 'verified',
      practiceAreas: ['Cheque Bounce (Sec 138)', 'Consumer Disputes', 'Contracts & Real Estate'],
      courts: ['Karnataka High Court', 'Consumer Disputes Forum Bengaluru'],
      experienceYears: 14,
      city: 'Bengaluru',
      state: 'Karnataka',
      languages: ['English', 'Hindi', 'Kannada'],
      bio: 'Commercial litigation specialist focusing on Section 138 cheque dishonour notice replies, real estate builder delay disputes, and tech contract advisory.',
      rating: 5.0,
      reviewCount: 29,
      fees: { chat: 60000, video: 150000 }, // ₹600, ₹1,500
      slots: [
        { time: 'Today, 07:00 PM IST', duration: 30 },
        { time: 'Tomorrow, 02:30 PM IST', duration: 30 },
        { time: 'Tomorrow, 05:30 PM IST', duration: 30 },
      ],
    },
    {
      _id: 'adv_4',
      name: 'Adv. Aradhana Mukherjee',
      enrollmentNumber: 'WB/5512/2018',
      barCouncil: 'Bar Council of West Bengal',
      verificationStatus: 'verified',
      practiceAreas: ['Labour Law', 'Employment Disputes', 'Civil Writs'],
      courts: ['Calcutta High Court', 'Central Administrative Tribunal'],
      experienceYears: 6,
      city: 'Kolkata',
      state: 'West Bengal',
      languages: ['English', 'Hindi', 'Bengali'],
      bio: 'Dedicated counsel advising on wrongful termination, severance agreement disputes, POSH compliance, and civil fundamental rights writ petitions.',
      rating: 4.7,
      reviewCount: 19,
      fees: { chat: 35000, video: 80000 }, // ₹350, ₹800
      slots: [
        { time: 'Tomorrow, 11:00 AM IST', duration: 30 },
        { time: 'Tomorrow, 03:00 PM IST', duration: 30 },
      ],
    },
  ];

  useEffect(() => {
    fetchAdvocates();
  }, []);

  const fetchAdvocates = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/advocates');
      if (res.data.data?.advocates?.length > 0) {
        setAdvocates(res.data.data.advocates);
      } else {
        setAdvocates(defaultAdvocates);
      }
    } catch {
      setAdvocates(defaultAdvocates);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdvocates = advocates.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPractice =
      selectedPractice === 'All' ||
      a.practiceAreas?.some((p) => p.toLowerCase().includes(selectedPractice.toLowerCase()));

    const matchesCity = selectedCity === 'All' || a.city === selectedCity;

    return matchesSearch && matchesPractice && matchesCity;
  });

  const openBookingModal = (advocate) => {
    setBookingModalAdvocate(advocate);
    setSelectedSlot(advocate.slots?.[0]?.time || 'Today, 05:00 PM IST');
    setBookingSuccess(null);
  };

  const confirmBookingAndPay = async () => {
    setIsProcessingPayment(true);
    const feeAmount =
      consultationMode === 'video'
        ? (bookingModalAdvocate.fees?.video || 120000) / 100
        : (bookingModalAdvocate.fees?.chat || 50000) / 100;

    // Simulate Razorpay Gateway and database booking record
    setTimeout(() => {
      setIsProcessingPayment(false);
      const newBooking = {
        bookingId: 'BK-' + Math.floor(100000 + Math.random() * 900000),
        advocateName: bookingModalAdvocate.name,
        mode: consultationMode,
        slot: selectedSlot,
        amount: feeAmount,
        documentAttached: selectedDocumentForBooking ? selectedDocumentForBooking.originalName : null,
      };
      setBookingSuccess(newBooking);
      if (setBookingContext) {
        setBookingContext(newBooking);
      }
    }, 1200);
  };

  return (
    <div style={{ padding: '40px 0 80px 0' }}>
      <div className="container">
        {/* Banner */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="badge badge-gold" style={{ marginBottom: '10px' }}>
            VERIFIED ADVOCATE MARKETPLACE
          </span>
          <h1 style={{ fontSize: '2.5rem', color: '#F8FAFC', marginBottom: '12px' }}>
            Consult Licensed Advocates Directly
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto', fontSize: '1rem' }}>
            Every advocate is manually verified against Bar Council of India records. Transparent fixed pricing, zero hidden consultation fees.
          </p>
        </div>

        {/* Selected Document Attachment Pill */}
        {selectedDocumentForBooking && (
          <div style={{
            maxWidth: '820px',
            margin: '0 auto 24px auto',
            padding: '12px 20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color="#D4AF37" />
              <span style={{ fontSize: '0.88rem', color: '#F8FAFC' }}>
                Document Attached: <strong>{selectedDocumentForBooking.originalName}</strong> (Analysis Summary Ready)
              </span>
            </div>
            <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
              Auto-shared upon booking
            </span>
          </div>
        )}

        {/* Filters Bar */}
        <div className="glass-panel" style={{
          padding: '20px',
          marginBottom: '32px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
            <input
              type="text"
              placeholder="Search by advocate name, legal issue, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-control"
              style={{ paddingLeft: '42px' }}
            />
          </div>

          {/* Practice Area Filter */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {['All', 'Criminal', 'Family', 'Cyber', 'Consumer', 'Labour'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPractice(p)}
                className={`btn ${selectedPractice === p ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.82rem', padding: '8px 14px', whiteSpace: 'nowrap' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Advocate Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}>
          {filteredAdvocates.map((adv) => (
            <div key={adv._id} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Header Profile Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid var(--accent-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-serif)',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: '#D4AF37',
                    }}>
                      {adv.name.split(' ')[1]?.[0] || 'A'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: '#F8FAFC', marginBottom: '4px' }}>
                        {adv.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                          <CheckCircle size={10} /> Verified
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {adv.enrollmentNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '4px 8px', borderRadius: '8px' }}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#F59E0B' }}>
                      {adv.rating}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      ({adv.reviewCount})
                    </span>
                  </div>
                </div>

                {/* Bar Council & Location */}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} color="#D4AF37" /> {adv.city}, {adv.state}
                  </span>
                  <span>•</span>
                  <span>{adv.experienceYears}+ yrs exp</span>
                </div>

                {/* Practice Area Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {adv.practiceAreas?.map((area, i) => (
                    <span key={i} className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                      {area}
                    </span>
                  ))}
                </div>

                {/* Bio */}
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '20px' }}>
                  {adv.bio}
                </p>
              </div>

              {/* Bottom Fees & Action */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    CONSULTATION FEE
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#D4AF37' }}>
                      ₹{((adv.fees?.chat || 50000) / 100).toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      (Chat) / ₹{((adv.fees?.video || 120000) / 100).toLocaleString('en-IN')} (Video)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openBookingModal(adv)}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                >
                  <Calendar size={15} /> Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Booking & Razorpay Modal ─────────────────────────────── */}
        {bookingModalAdvocate && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(5, 8, 17, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}>
            <div className="glass-panel" style={{
              maxWidth: '520px',
              width: '100%',
              padding: '32px',
              borderRadius: '20px',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            }}>
              {/* Close button */}
              <button
                onClick={() => setBookingModalAdvocate(null)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              {!bookingSuccess ? (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <span className="badge badge-gold" style={{ marginBottom: '8px' }}>
                      CONFIRM CONSULTATION
                    </span>
                    <h2 style={{ fontSize: '1.4rem', color: '#F8FAFC' }}>
                      Book with {bookingModalAdvocate.name}
                    </h2>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      {bookingModalAdvocate.enrollmentNumber} • {bookingModalAdvocate.barCouncil}
                    </p>
                  </div>

                  {/* Mode Selector */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                    <button
                      type="button"
                      onClick={() => setConsultationMode('chat')}
                      className={`btn ${consultationMode === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '10px' }}
                    >
                      <MessageSquare size={16} /> Live Chat (₹{((bookingModalAdvocate.fees?.chat || 50000) / 100).toLocaleString('en-IN')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsultationMode('video')}
                      className={`btn ${consultationMode === 'video' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '10px' }}
                    >
                      <Video size={16} /> WebRTC Video (₹{((bookingModalAdvocate.fees?.video || 120000) / 100).toLocaleString('en-IN')})
                    </button>
                  </div>

                  {/* Slot Selector */}
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                      Choose Available Time Slot:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(bookingModalAdvocate.slots || [
                        { time: 'Today, 04:30 PM IST', duration: 30 },
                        { time: 'Tomorrow, 11:30 AM IST', duration: 30 },
                      ]).map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedSlot(s.time)}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: selectedSlot === s.time ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                            border: selectedSlot === s.time ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                          }}
                        >
                          <span style={{ fontSize: '0.88rem', color: selectedSlot === s.time ? '#F8FAFC' : 'var(--text-secondary)' }}>
                            {s.time}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {s.duration} mins session
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document Sharing Consent */}
                  {selectedDocumentForBooking && (
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '20px',
                      cursor: 'pointer',
                    }}>
                      <input
                        type="checkbox"
                        checked={shareDocConsent}
                        onChange={(e) => setShareDocConsent(e.target.checked)}
                        style={{ marginTop: '3px' }}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Share encrypted analysis summary of <strong>{selectedDocumentForBooking.originalName}</strong> with advocate under client-attorney confidentiality.
                      </span>
                    </label>
                  )}

                  {/* Payment Button */}
                  <button
                    onClick={confirmBookingAndPay}
                    disabled={isProcessingPayment}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                  >
                    <Lock size={16} />
                    {isProcessingPayment
                      ? 'Contacting Razorpay Secure Gateway...'
                      : `Pay ₹${(consultationMode === 'video' ? (bookingModalAdvocate.fees?.video || 120000) : (bookingModalAdvocate.fees?.chat || 50000)) / 100} & Confirm Slot`}
                  </button>
                </>
              ) : (
                /* Success View */
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                  }}>
                    <Check size={32} color="#10B981" />
                  </div>

                  <h2 style={{ fontSize: '1.5rem', color: '#F8FAFC', marginBottom: '8px' }}>
                    Consultation Confirmed!
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Booking ID: <strong style={{ color: '#D4AF37' }}>{bookingSuccess.bookingId}</strong>
                  </p>

                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'left',
                    marginBottom: '24px',
                    fontSize: '0.86rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    <div><strong>Advocate:</strong> {bookingSuccess.advocateName}</div>
                    <div><strong>Mode:</strong> {bookingSuccess.mode.toUpperCase()} Consultation</div>
                    <div><strong>Scheduled Time:</strong> {bookingSuccess.slot}</div>
                    <div><strong>Amount Paid:</strong> ₹{bookingSuccess.amount} (Includes GST)</div>
                  </div>

                  <button
                    onClick={() => {
                      setBookingModalAdvocate(null);
                      setActivePage('consultation');
                    }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
                  >
                    <span>Enter Consultation Room</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
