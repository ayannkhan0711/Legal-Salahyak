import React, { useState } from 'react';
import { Scale, FileText, MessageSquare, Users, Shield, Globe, LogIn, LogOut, Menu, X, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export function Navbar({ activePage, setActivePage, openAuthModal }) {
  const { lang, toggleLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: t('home'), icon: Scale },
    { id: 'documents', label: t('documents'), icon: FileText },
    { id: 'chat', label: t('chat'), icon: MessageSquare },
    { id: 'advocates', label: t('advocates'), icon: Users },
  ];

  if (user?.role === 'advocate') {
    navItems.push({ id: 'advocate-dashboard', label: t('dashboard'), icon: Shield });
  }

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin-dashboard', label: t('admin'), icon: Shield });
  }

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(8, 13, 26, 0.88)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
      }}>
        {/* Brand */}
        <div 
          onClick={() => setActivePage('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid var(--accent-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.25)',
          }}>
            <Scale size={24} color="#D4AF37" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-font" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC' }}>
                Legal<span style={{ color: '#D4AF37' }}>Sahayak</span>
              </span>
              <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                BNS 2023
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', letterSpacing: '0.04em' }}>
              INDIAN LAW INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="desktop-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
              >
                <Icon size={16} color={isActive ? '#D4AF37' : '#94A3B8'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Switch Language (English / हिन्दी)"
          >
            <Globe size={15} color="#D4AF37" />
            <span style={{ fontWeight: 600, color: '#D4AF37' }}>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* User Account / Auth */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--accent-gold)',
                  color: '#0B1021',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F8FAFC' }}>
                    {user.name.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#D4AF37', textTransform: 'capitalize' }}>
                    {user.role}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{ padding: '8px', borderRadius: '50%' }}
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.88rem' }}
            >
              <LogIn size={16} />
              {t('login')}
            </button>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary"
            style={{ display: 'none', padding: '8px' }}
            id="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#080D1A',
          borderTop: '1px solid var(--border-subtle)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: activePage === item.id ? '#D4AF37' : '#F8FAFC',
                  background: activePage === item.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </header>
  );
}
