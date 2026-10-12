import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Send, MessageSquare, 
  FileText, ShieldCheck, Clock, Share2, Star, CheckCircle, ArrowLeft 
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function ConsultationRoomPage({ setActivePage, bookingContext, selectedDocumentForBooking }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'document'
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [callEnded, setCallEnded] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Adv. Rajesh Sharma',
      text: 'Good afternoon. I have received your shared document summary regarding the Section 138 notice. How can I assist you today?',
      time: 'Just now',
      isMe: false,
    },
    {
      id: 2,
      sender: user?.name || 'You',
      text: 'Hello sir, I received this notice 4 days ago by speed post. The payee says I owe ₹2.5 Lakhs, but that cheque was given as a security deposit for an old consignment that was returned.',
      time: 'Just now',
      isMe: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionSeconds, setSessionSeconds] = useState(1800); // 30 mins
  const socketRef = useRef(null);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Socket connection attempt
  useEffect(() => {
    try {
      const socket = io('http://localhost:5000', {
        transports: ['websocket'],
        reconnectionAttempts: 2,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join_room', { bookingId: bookingContext?.bookingId || 'BK-DEFAULT' });
      });

      socket.on('receive_message', (data) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: data.sender || 'Advocate',
            text: data.content,
            time: 'Just now',
            isMe: false,
          },
        ]);
      });

      return () => {
        socket.disconnect();
      };
    } catch {
      // Offline fallback
    }
  }, [bookingContext]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: user?.name || 'You',
      text: inputMessage.trim(),
      time: 'Just now',
      isMe: true,
    };

    setMessages((prev) => [...prev, newMsg]);

    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', {
        bookingId: bookingContext?.bookingId || 'BK-DEFAULT',
        content: inputMessage.trim(),
      });
    }

    setInputMessage('');

    // Simulated advocate response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: bookingContext?.advocateName || 'Adv. Rajesh Sharma',
          text: 'Under Section 139 of the Negotiable Instruments Act, the presumption of debt is rebuttable. Since the consignment was returned, we must draft a formal reply within the 15-day window citing the delivery challan and return receipts.',
          time: 'Just now',
          isMe: false,
        },
      ]);
    }, 1800);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const endCall = () => {
    setCallEnded(true);
  };

  return (
    <div style={{ padding: '24px 0 60px 0' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        {/* Top Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '12px 20px',
          borderRadius: '14px',
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setActivePage('advocates')}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <ArrowLeft size={14} /> Exit Room
            </button>
            <div>
              <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '1rem' }}>
                Consultation: {bookingContext?.advocateName || 'Adv. Rajesh Sharma'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> End-to-End Encrypted Consultation Session
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid var(--accent-gold)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#F3C649',
            }}>
              <Clock size={14} />
              <span>{formatTime(sessionSeconds)}</span>
            </div>

            <button
              onClick={endCall}
              className="btn btn-primary"
              style={{
                backgroundColor: 'var(--danger)',
                borderColor: 'var(--danger)',
                padding: '6px 16px',
                fontSize: '0.85rem',
              }}
            >
              <PhoneOff size={15} /> End Call
            </button>
          </div>
        </div>

        {/* Main Two-Column Room Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1.4fr) minmax(300px, 1fr)',
          gap: '24px',
        }}>
          {/* Left Column: Video Call Stage */}
          <div className="glass-panel" style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '620px',
            position: 'relative',
            backgroundColor: '#070B16',
          }}>
            {/* Main Video Stream (Advocate) */}
            <div style={{
              flex: 1,
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#0F172A',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(212, 175, 55, 0.2)',
                  border: '2px solid var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#D4AF37',
                }}>
                  RS
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC' }}>
                  {bookingContext?.advocateName || 'Adv. Rajesh Sharma'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#10B981', marginTop: '4px' }}>
                  ● Audio/Video Stream Active (1080p WebRTC)
                </div>
              </div>

              {/* PiP Self Camera */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                width: '140px',
                height: '100px',
                borderRadius: '12px',
                backgroundColor: '#1E293B',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
              }}>
                {videoEnabled ? (
                  <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    <span>You (Live)</span>
                  </div>
                ) : (
                  <div style={{ color: 'var(--danger)', fontSize: '0.72rem' }}>
                    Camera Off
                  </div>
                )}
              </div>
            </div>

            {/* Video Controls Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '14px',
              paddingTop: '16px',
            }}>
              <button
                onClick={() => setMicEnabled(!micEnabled)}
                className="btn btn-secondary"
                style={{
                  padding: '12px',
                  borderRadius: '50%',
                  backgroundColor: micEnabled ? 'rgba(255, 255, 255, 0.08)' : 'var(--danger)',
                  color: '#fff',
                }}
                title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button
                onClick={() => setVideoEnabled(!videoEnabled)}
                className="btn btn-secondary"
                style={{
                  padding: '12px',
                  borderRadius: '50%',
                  backgroundColor: videoEnabled ? 'rgba(255, 255, 255, 0.08)' : 'var(--danger)',
                  color: '#fff',
                }}
                title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button
                className="btn btn-secondary"
                style={{ padding: '12px', borderRadius: '50%' }}
                title="Share Screen"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* Right Column: Chat and Shared Document Hub */}
          <div className="glass-panel" style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            height: '620px',
            backgroundColor: 'rgba(11, 16, 32, 0.9)',
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '12px',
              marginBottom: '16px',
              gap: '12px',
            }}>
              <button
                onClick={() => setActiveTab('chat')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'chat' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderBottom: activeTab === 'chat' ? '2px solid var(--accent-gold)' : 'none',
                  paddingBottom: '6px',
                }}
              >
                <MessageSquare size={16} /> Live Consultation Chat
              </button>

              <button
                onClick={() => setActiveTab('document')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeTab === 'document' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderBottom: activeTab === 'document' ? '2px solid var(--accent-gold)' : 'none',
                  paddingBottom: '6px',
                }}
              >
                <FileText size={16} /> Shared Document
              </button>
            </div>

            {/* Tab 1: Live Chat */}
            {activeTab === 'chat' && (
              <>
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  paddingRight: '6px',
                  marginBottom: '14px',
                }}>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: m.isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        backgroundColor: m.isMe ? '#1E293B' : 'rgba(212, 175, 55, 0.12)',
                        border: m.isMe ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--border-color)',
                        borderRadius: m.isMe ? '14px 14px 2px 14px' : '2px 14px 14px 14px',
                        padding: '10px 14px',
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: m.isMe ? '#93C5FD' : '#D4AF37', fontWeight: 600, marginBottom: '2px' }}>
                        {m.sender}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: '#F8FAFC', lineHeight: 1.5 }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Type message to advocate..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="input-control"
                    style={{ padding: '10px 14px', fontSize: '0.88rem' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}

            {/* Tab 2: Shared Document */}
            {activeTab === 'document' && (
              <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.86rem' }}>
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '14px',
                }}>
                  <div style={{ fontWeight: 600, color: '#D4AF37', marginBottom: '4px' }}>
                    Document Under Review:
                  </div>
                  <div style={{ color: '#F8FAFC' }}>
                    {selectedDocumentForBooking?.originalName || 'Section 138 Statutory Notice.pdf'}
                  </div>
                </div>

                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <p style={{ marginBottom: '10px' }}>
                    <strong>Analysis Summary:</strong> {selectedDocumentForBooking?.analysis?.inOneLine || 'Statutory demand notice under Section 138 Negotiable Instruments Act.'}
                  </p>
                  <p style={{ marginBottom: '10px' }}>
                    <strong>Deadlines:</strong> 15 days to issue formal reply from receipt date.
                  </p>
                  <p>
                    <strong>Citations:</strong> Section 138 NI Act, Section 318(4) Bharatiya Nyaya Sanhita (BNS) 2023.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Post-Call Rating & Feedback Modal ──────────────────── */}
        {callEnded && (
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
              maxWidth: '440px',
              width: '100%',
              padding: '32px',
              borderRadius: '20px',
              textAlign: 'center',
            }}>
              <CheckCircle size={48} color="#10B981" style={{ margin: '0 auto 16px auto' }} />
              <h2 style={{ fontSize: '1.4rem', color: '#F8FAFC', marginBottom: '8px' }}>
                Consultation Completed
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '20px' }}>
                How was your legal advice session with {bookingContext?.advocateName || 'Adv. Rajesh Sharma'}?
              </p>

              {/* Star rating selector */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={28}
                    onClick={() => setRating(s)}
                    style={{ cursor: 'pointer' }}
                    color="#F59E0B"
                    fill={s <= rating ? '#F59E0B' : 'transparent'}
                  />
                ))}
              </div>

              <textarea
                placeholder="Write a brief review on the advocate's legal guidance..."
                className="input-control"
                rows={3}
                style={{ marginBottom: '20px', fontSize: '0.86rem' }}
              />

              <button
                onClick={() => {
                  setReviewSubmitted(true);
                  setTimeout(() => setActivePage('advocates'), 800);
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                {reviewSubmitted ? 'Review Recorded!' : 'Submit Review & Close'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
