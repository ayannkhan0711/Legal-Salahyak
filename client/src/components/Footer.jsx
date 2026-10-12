import React from 'react';
import { Scale, ShieldCheck, Lock, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Footer({ setActivePage }) {
  const { t } = useLanguage();

  return (
    <footer style={{
      backgroundColor: '#050811',
      borderTop: '1px solid rgba(212, 175, 55, 0.12)',
      padding: '48px 0 24px 0',
      marginTop: '80px',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '36px',
          marginBottom: '40px',
        }}>
          {/* Col 1 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Scale size={22} color="#D4AF37" />
              <span className="brand-font" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F8FAFC' }}>
                Legal<span style={{ color: '#D4AF37' }}>Sahayak</span>
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Making Indian justice accessible, plain-spoken, and trustworthy through verified AI retrieval and transparent advocate connectivity.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D4AF37', fontSize: '0.85rem' }}>
              <ShieldCheck size={16} />
              <span className="brand-font">सत्यमेव जयते (Truth Alone Triumphs)</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform Services
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li>
                <span onClick={() => setActivePage('documents')} style={{ color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}>
                  OCR Document Analyzer
                </span>
              </li>
              <li>
                <span onClick={() => setActivePage('chat')} style={{ color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}>
                  Indian Law Q&A Chatbot
                </span>
              </li>
              <li>
                <span onClick={() => setActivePage('advocates')} style={{ color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}>
                  Find Verified Advocates
                </span>
              </li>
              <li>
                <span onClick={() => setActivePage('admin-dashboard')} style={{ color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }}>
                  Bar Council Verification Portal
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal Corpus */}
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Statutes Covered
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <li>• Bharatiya Nyaya Sanhita (BNS) 2023</li>
              <li>• Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023</li>
              <li>• Consumer Protection Act 2019</li>
              <li>• Information Technology Act 2000 (Cyber Law)</li>
              <li>• Section 138 Negotiable Instruments Act</li>
            </ul>
          </div>

          {/* Col 4: Trust & Compliance */}
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#F8FAFC', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Data Privacy & Security
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontSize: '0.85rem', marginBottom: '8px' }}>
              <Lock size={15} />
              <span>DPDP Act 2023 Compliant</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              All uploaded documents are encrypted with AES-256-GCM. Physical files are purged automatically after 30 days per data minimization protocols.
            </p>
          </div>
        </div>

        {/* Bottom Banner */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}>
          <div>
            {t('disclaimer')}
          </div>
          <div>
            © {new Date().getFullYear()} LegalSahayak India. All rights reserved. Built with precision for the Indian Legal System.
          </div>
        </div>
      </div>
    </footer>
  );
}
