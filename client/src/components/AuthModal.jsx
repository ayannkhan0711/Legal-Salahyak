import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Briefcase, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, register, loading } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [role, setRole] = useState('user'); // 'user' | 'advocate'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    enrollmentNumber: '',
    barCouncil: '',
  });
  const [error, setError] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const res = await login(formData.email, formData.password);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } else {
      if (!consentGiven) {
        setError('Please agree to terms and data processing consent');
        return;
      }
      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role,
        enrollmentNumber: role === 'advocate' ? formData.enrollmentNumber : undefined,
        barCouncil: role === 'advocate' ? formData.barCouncil : undefined,
      });
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Registration failed');
      }
    }
  };

  const quickLogin = async (userRole) => {
    if (userRole === 'admin') {
      await login('admin@legalsahayak.in', 'Admin@123456');
    } else if (userRole === 'advocate') {
      await login('rajesh.sharma@law.in', 'Lawyer@123456');
    } else {
      await login('citizen@example.com', 'User@123456');
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 17, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '32px',
        position: 'relative',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Header Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <button
            onClick={() => setMode('login')}
            style={{
              background: 'none',
              border: 'none',
              color: mode === 'login' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: 'pointer',
              borderBottom: mode === 'login' ? '2px solid var(--accent-gold)' : 'none',
              paddingBottom: '8px',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('register')}
            style={{
              background: 'none',
              border: 'none',
              color: mode === 'register' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: 'pointer',
              borderBottom: mode === 'register' ? '2px solid var(--accent-gold)' : 'none',
              paddingBottom: '8px',
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            marginBottom: '16px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <>
              {/* Role Toggle */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`btn ${role === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                >
                  <User size={15} /> Citizen / User
                </button>
                <button
                  type="button"
                  onClick={() => setRole('advocate')}
                  className={`btn ${role === 'advocate' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                >
                  <Briefcase size={15} /> Advocate / Lawyer
                </button>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adv. Amit Verma or Sunita Roy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-control"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-control"
                />
              </div>

              {role === 'advocate' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Bar Council Enrollment No.
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. D/1420/2015"
                      value={formData.enrollmentNumber}
                      onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                      className="input-control"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      State Bar Council
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bar Council of Delhi"
                      value={formData.barCouncil}
                      onChange={(e) => setFormData({ ...formData, barCouncil: e.target.value })}
                      className="input-control"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-control"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-control"
            />
          </div>

          {mode === 'register' && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '4px' }}>
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                style={{ marginTop: '3px' }}
              />
              <span>
                I agree to the Terms of Service and consent to encrypted document processing under the Digital Personal Data Protection (DPDP) Act, 2023.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In to LegalSahayak' : 'Create Verified Account'}
          </button>
        </form>

        {/* 1-Click Quick Demo Sign-Ins */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px' }}>
            DEMO SHORTCUTS (1-CLICK ACCESS)
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => quickLogin('user')}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              Demo Citizen
            </button>
            <button
              type="button"
              onClick={() => quickLogin('advocate')}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              Demo Advocate
            </button>
            <button
              type="button"
              onClick={() => quickLogin('admin')}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              Demo Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
