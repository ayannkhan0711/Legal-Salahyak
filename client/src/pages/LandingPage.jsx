import React, { useState } from 'react';
import { 
  FileText, MessageSquare, Users, ShieldCheck, Scale, ArrowRight, 
  CheckCircle, Zap, Lock, BookOpen, AlertCircle, ChevronDown, ChevronUp, Star, PhoneCall, Video 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function LandingPage({ setActivePage, openAuthModal }) {
  const { t, lang } = useLanguage();
  const [activeFaq, setActiveFaq] = useState(null);

  const bnsComparisons = [
    { old: 'Section 420 IPC (Cheating)', new: 'Section 318(4) BNS', notes: 'Cheating & dishonestly inducing delivery of property' },
    { old: 'Section 302 IPC (Murder)', new: 'Section 103 BNS', notes: 'Mandatory penalty for organized group violence / lynching' },
    { old: 'Section 438 CrPC (Anticipatory Bail)', new: 'Section 482 BNSS', notes: 'Pre-arrest protection with streamlined high court procedures' },
    { old: 'Section 41A CrPC (Notice of Appearance)', new: 'Section 35(3) BNSS', notes: 'Mandatory notice before arrest for offenses < 7 years' },
  ];

  const faqs = [
    {
      q: 'How does LegalSahayak analyze my legal notice or FIR?',
      a: 'We use high-precision OCR and multimodal extraction coupled with a vector retrieval engine grounded directly in current Indian statutes (BNS 2023, BNSS 2023, Consumer Act, NI Act). The AI detects what type of document it is, extracts the core obligations, highlights critical response deadlines (e.g., 15-day cheque bounce notice), and spots legal red flags.'
    },
    {
      q: 'Is my uploaded document private and protected under Indian law?',
      a: 'Yes. All uploaded files and extracted text are encrypted using AES-256-GCM. We adhere strictly to the Digital Personal Data Protection (DPDP) Act, 2023. We enforce a 30-day auto-purge retention policy unless you choose to permanently delete your document earlier.'
    },
    {
      q: 'How does the Advocate Consultation marketplace work?',
      a: 'You can browse verified advocates with confirmed Bar Council of India enrollment numbers. You can select an advocate based on practice area (Criminal, Family, Cyber, Corporate), city, and language, and book either an encrypted real-time chat or a secure WebRTC video consultation slot.'
    },
    {
      q: 'Does LegalSahayak reflect the new criminal laws (BNS and BNSS 2023)?',
      a: 'Absolutely. On 1st July 2024, the Indian Penal Code (IPC), Code of Criminal Procedure (CrPC), and Indian Evidence Act were replaced by BNS, BNSS, and BSA. LegalSahayak’s knowledge base includes real-time cross-referencing and section mapping.'
    }
  ];

  return (
    <div>
      {/* ── Hero Section ────────────────────────────────────────── */}
      <section style={{
        padding: '70px 0 60px 0',
        position: 'relative',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% -20%, rgba(212, 175, 55, 0.12) 0%, transparent 60%)',
      }}>
        <div className="container">
          {/* Top Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <span className="badge badge-gold" style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#D4AF37" />
              {t('bnsBadge')}
            </span>
          </div>

          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(2.3rem, 5vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.18,
            maxWidth: '920px',
            margin: '0 auto 20px auto',
            color: '#F8FAFC',
          }}>
            Demystifying Indian Law. <br />
            <span style={{
              background: 'linear-gradient(135deg, #F3C649 0%, #D4AF37 50%, #FF8C38 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Powered by AI & Verified Advocates.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.22rem)',
            color: 'var(--text-secondary)',
            maxWidth: '740px',
            margin: '0 auto 36px auto',
            lineHeight: 1.6,
          }}>
            {t('subtagline')}
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '50px' }}>
            <button
              onClick={() => setActivePage('documents')}
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1.05rem' }}
            >
              <FileText size={20} />
              {t('scanDocument')}
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => setActivePage('chat')}
              className="btn btn-secondary"
              style={{ padding: '14px 28px', fontSize: '1.05rem', borderColor: 'var(--border-color)' }}
            >
              <MessageSquare size={20} color="#D4AF37" />
              {t('askAi')}
            </button>

            <button
              onClick={() => setActivePage('advocates')}
              className="btn btn-secondary"
              style={{ padding: '14px 24px', fontSize: '1.05rem' }}
            >
              <Users size={20} />
              {t('findAdvocate')}
            </button>
          </div>

          {/* Stats Bar */}
          <div className="glass-panel" style={{
            maxWidth: '940px',
            margin: '0 auto',
            padding: '24px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            textAlign: 'center',
          }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#D4AF37', fontFamily: 'var(--font-serif)' }}>
                12,500+
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Legal Documents Decoded
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-serif)' }}>
                BNS & BNSS
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                2024 New Criminal Laws Integrated
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#D4AF37', fontFamily: 'var(--font-serif)' }}>
                450+
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Verified Bar Council Advocates
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Core Pillars ────────────────────────────────────────── */}
      <section style={{ padding: '70px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px auto' }}>
            <span className="badge badge-gold" style={{ marginBottom: '12px' }}>THREE-TIER ASSISTANCE</span>
            <h2 style={{ fontSize: '2.2rem', color: '#F8FAFC', marginBottom: '14px' }}>
              Built for Every Indian Citizen & Business
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Whether you received an intimidating police summons, a landlord dispute notice, or need urgent consultation, we bridge the gap.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
          }}>
            {/* Card 1: Document OCR */}
            <div 
              className="glass-panel glass-card-interactive"
              onClick={() => setActivePage('documents')}
              style={{ padding: '36px 28px', position: 'relative' }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '22px',
              }}>
                <FileText size={26} color="#D4AF37" />
              </div>
              <h3 style={{ fontSize: '1.35rem', color: '#F8FAFC', marginBottom: '12px' }}>
                1. Document Explainer
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Upload notices, rent deeds, FIRs, or court decrees in PDF, DOCX, or mobile photos. We extract text via OCR, summarize what it means in simple Hindi/English, and flag risks.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '24px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10B981" /> Plain-language summary & deadline alerts
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10B981" /> Highlights statutory rights & obligations
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10B981" /> Identifies red flags & unfair clauses
                </li>
              </ul>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D4AF37', fontWeight: 600, fontSize: '0.9rem' }}>
                Analyze a document <ArrowRight size={16} />
              </div>
            </div>

            {/* Card 2: Legal AI Chat */}
            <div 
              className="glass-panel glass-card-interactive"
              onClick={() => setActivePage('chat')}
              style={{ padding: '36px 28px', position: 'relative' }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid #3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '22px',
              }}>
                <MessageSquare size={26} color="#3B82F6" />
              </div>
              <h3 style={{ fontSize: '1.35rem', color: '#F8FAFC', marginBottom: '12px' }}>
                2. Indian Law RAG Chatbot
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Ask questions in English, Hindi, or Hinglish. Every response cites specific statutory sections with verified status tags, warning when an old law like IPC has been repealed.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '24px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10B981" /> Grounded in BNS, BNSS, Consumer Act & RTI
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10B981" /> Distinguishes in-force vs repealed statutes
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10B981" /> Procedural roadmaps for FIRs, bail, & claims
                </li>
              </ul>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3B82F6', fontWeight: 600, fontSize: '0.9rem' }}>
                Ask a legal question <ArrowRight size={16} />
              </div>
            </div>

            {/* Card 3: Advocate Consultations */}
            <div 
              className="glass-panel glass-card-interactive"
              onClick={() => setActivePage('advocates')}
              style={{ padding: '36px 28px', position: 'relative' }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '22px',
              }}>
                <Users size={26} color="#10B981" />
              </div>
              <h3 style={{ fontSize: '1.35rem', color: '#F8FAFC', marginBottom: '12px' }}>
                3. Verified Advocate Connect
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
                Connect directly with Bar Council licensed advocates. Pre-share your AI document summary, choose a convenient slot, and consult via live encrypted chat or WebRTC video.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '24px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10B981" /> Bar Council credential verification by admin
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10B981" /> Transparent fixed fees in INR (no hidden costs)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10B981" /> End-to-end encrypted video and chat rooms
                </li>
              </ul>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 600, fontSize: '0.9rem' }}>
                Browse verified advocates <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BNS 2023 Crosswalk Spotlight ─────────────────────────── */}
      <section style={{ padding: '60px 0', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '40px',
            alignItems: 'center',
          }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '12px' }}>CRIMINAL LAW REFORM</span>
              <h2 style={{ fontSize: '2.1rem', color: '#F8FAFC', marginBottom: '16px' }}>
                Never Get Confused by the 2024 Law Changes
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', lineHeight: 1.7, marginBottom: '20px' }}>
                The colonial-era IPC and CrPC have been replaced by the Bharatiya Nyaya Sanhita (BNS) and Bharatiya Nagarik Suraksha Sanhita (BNSS).
                LegalSahayak automatically translates old police references to the active provisions in force today.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#10B981' }}>
                  <CheckCircle size={16} /> Seamless IPC-to-BNS Mapping
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#10B981' }}>
                  <CheckCircle size={16} /> CrPC-to-BNSS Procedural Crosswalk
                </div>
              </div>
            </div>

            {/* Comparison Cards */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Live Statutory Crosswalk Examples
              </div>
              {bnsComparisons.map((c, idx) => (
                <div key={idx} style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(8, 13, 26, 0.7)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--danger)', textDecoration: 'line-through' }}>
                      {c.old}
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                      {c.new}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {c.notes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────── */}
      <section style={{ padding: '70px 0' }}>
        <div className="container" style={{ maxWidth: '840px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="badge badge-gold" style={{ marginBottom: '10px' }}>FREQUENTLY ASKED</span>
            <h2 style={{ fontSize: '2rem', color: '#F8FAFC' }}>Common Questions on LegalSahayak</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index} 
                  className="glass-panel" 
                  style={{ overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                >
                  <div style={{
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: isOpen ? '#D4AF37' : '#F8FAFC',
                  }}>
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                  {isOpen && (
                    <div style={{
                      padding: '0 24px 20px 24px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.92rem',
                      lineHeight: 1.6,
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '14px',
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA Banner ────────────────────────────────────── */}
      <section style={{ padding: '40px 0 80px 0' }}>
        <div className="container">
          <div className="glass-panel" style={{
            padding: '50px 32px',
            textAlign: 'center',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(18, 26, 47, 0.9) 0%, rgba(10, 15, 29, 0.95) 100%)',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <h2 style={{ fontSize: '2.4rem', color: '#F8FAFC', marginBottom: '16px' }}>
              Take Control of Your Legal Situation Today
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto 28px auto', fontSize: '1.05rem' }}>
              Upload any intimidating legal paper or chat with our BNS-trained legal AI in under 30 seconds.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActivePage('documents')}
                className="btn btn-primary"
                style={{ padding: '12px 26px', fontSize: '1rem' }}
              >
                <FileText size={18} /> Upload Your Document Now
              </button>
              <button
                onClick={() => setActivePage('chat')}
                className="btn btn-secondary"
                style={{ padding: '12px 26px', fontSize: '1rem' }}
              >
                <MessageSquare size={18} /> Start Free AI Chat
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
