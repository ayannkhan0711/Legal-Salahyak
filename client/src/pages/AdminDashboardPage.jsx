import React, { useState } from 'react';
import { 
  ShieldCheck, Users, FileText, CheckCircle, XCircle, RefreshCw, 
  Database, AlertTriangle, Search, Check, Lock 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminDashboardPage() {
  const { user } = useAuth();

  const [pendingAdvocates, setPendingAdvocates] = useState([
    {
      id: 'adv_pending_1',
      name: 'Adv. Manisha Kulkarni',
      email: 'manisha.kulkarni@law.in',
      enrollmentNumber: 'MAH/5829/2019',
      barCouncil: 'Bar Council of Maharashtra & Goa',
      city: 'Pune',
      state: 'Maharashtra',
      practiceAreas: ['Cyber Crime', 'Banking Fraud'],
      experienceYears: 5,
      docUploaded: 'bar_council_id_card.pdf',
    },
    {
      id: 'adv_pending_2',
      name: 'Adv. Harpreet Singh Dhillon',
      email: 'h.dhillon@punjablaw.in',
      enrollmentNumber: 'PH/1104/2014',
      barCouncil: 'Bar Council of Punjab & Haryana',
      city: 'Chandigarh',
      state: 'Punjab',
      practiceAreas: ['Land Acquisition', 'Civil Writs'],
      experienceYears: 10,
      docUploaded: 'bar_license_enrollment_cert.pdf',
    },
  ]);

  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: 'VERIFICATION_APPROVED', target: 'Adv. Priya Deshmukh (MAH/3421/2015)', time: '10 mins ago', admin: 'Platform Admin' },
    { id: 2, action: 'DOCUMENT_PURGED_RETENTION', target: 'DOC-90812 (30-day DPDP expiry)', time: '1 hour ago', admin: 'System Scheduler' },
    { id: 3, action: 'VECTOR_INDEX_UPDATE', target: 'Ingested 28 sections of BNS & BNSS 2023', time: '3 hours ago', admin: 'Platform Admin' },
    { id: 4, action: 'PAYOUT_DISBURSED', target: '₹14,200 settled to Adv. Rajesh Sharma', time: 'Yesterday', admin: 'Razorpay Auto-Payout' },
  ]);

  const [reindexing, setReindexing] = useState(false);
  const [reindexSuccess, setReindexSuccess] = useState(false);

  const approveAdvocate = (id) => {
    setPendingAdvocates((prev) => prev.filter((a) => a.id !== id));
    setAuditLogs((prev) => [
      { id: Date.now(), action: 'VERIFICATION_APPROVED', target: `Advocate ID ${id}`, time: 'Just now', admin: user?.name || 'Admin' },
      ...prev,
    ]);
  };

  const rejectAdvocate = (id) => {
    setPendingAdvocates((prev) => prev.filter((a) => a.id !== id));
    setAuditLogs((prev) => [
      { id: Date.now(), action: 'VERIFICATION_REJECTED', target: `Advocate ID ${id}`, time: 'Just now', admin: user?.name || 'Admin' },
      ...prev,
    ]);
  };

  const triggerReindexing = () => {
    setReindexing(true);
    setReindexSuccess(false);
    setTimeout(() => {
      setReindexing(false);
      setReindexSuccess(true);
      setTimeout(() => setReindexSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div style={{ padding: '40px 0 80px 0' }}>
      <div className="container">
        {/* Banner */}
        <div style={{ marginBottom: '32px' }}>
          <span className="badge badge-gold" style={{ marginBottom: '8px' }}>
            SYSTEM ADMINISTRATION CONSOLE
          </span>
          <h1 style={{ fontSize: '2.2rem', color: '#F8FAFC' }}>
            Platform Governance & Bar Verification
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem' }}>
            Manage advocate certifications, vector knowledge base integrity, and DPDP compliance logs.
          </p>
        </div>

        {/* 4 Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '36px',
        }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              REGISTERED USERS
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
              14,280
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              VERIFIED ADVOCATES
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#D4AF37', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
              452 Active
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              DOCUMENTS ANALYZED
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10B981', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
              12,504
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              PLATFORM COMMISSION
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#F59E0B', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
              ₹1,48,200
            </div>
          </div>
        </div>

        {/* Main Grid: Verification Queue & Knowledge Base */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.5fr) minmax(320px, 1fr)',
          gap: '28px',
          marginBottom: '36px',
        }}>
          {/* Advocate Verification Queue */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.25rem', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#D4AF37" />
                Pending Advocate Applications ({pendingAdvocates.length})
              </h2>
            </div>

            {pendingAdvocates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                <CheckCircle size={36} color="#10B981" style={{ margin: '0 auto 10px auto' }} />
                <p>All advocate verification applications are processed!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {pendingAdvocates.map((adv) => (
                  <div key={adv.id} style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '1rem' }}>
                          {adv.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#D4AF37', marginTop: '2px' }}>
                          Enrollment: <strong>{adv.enrollmentNumber}</strong> • {adv.barCouncil}
                        </div>
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                        Pending Review
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      Location: {adv.city}, {adv.state} • Practice: {adv.practiceAreas.join(', ')} • {adv.experienceYears} yrs experience
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Attachment: {adv.docUploaded}
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => rejectAdvocate(adv.id)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 12px', fontSize: '0.78rem', color: 'var(--danger)' }}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                        <button
                          onClick={() => approveAdvocate(adv.id)}
                          className="btn btn-primary"
                          style={{ padding: '5px 14px', fontSize: '0.78rem' }}
                        >
                          <Check size={14} /> Verify & Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Legal Knowledge Base & RAG Indexing */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#F8FAFC', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={20} color="#D4AF37" />
              Statutory Vector Corpus
            </h2>

            <div style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{ color: '#10B981', fontWeight: 600 }}>Active & Synchronized</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Vector Dimension:</span>
                <span style={{ color: '#F8FAFC' }}>768 (Cosine Index)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Criminal Reform:</span>
                <span style={{ color: '#D4AF37', fontWeight: 600 }}>BNS & BNSS 2023 In-Force</span>
              </div>
            </div>

            <button
              onClick={triggerReindexing}
              disabled={reindexing}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', fontSize: '0.88rem', borderColor: 'var(--border-color)', marginBottom: '12px' }}
            >
              <RefreshCw size={15} className={reindexing ? 'pulse-glow' : ''} />
              {reindexing ? 'Re-indexing Legal Corpus...' : 'Trigger Vector Corpus Sync'}
            </button>

            {reindexSuccess && (
              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.82rem', textAlign: 'center' }}>
                ✓ Corpus re-indexed successfully across MongoDB Atlas!
              </div>
            )}
          </div>
        </div>

        {/* Audit Logs Feed */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#F8FAFC', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="#D4AF37" />
            Security & DPDP Compliance Audit Logs
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>
                    {log.action}
                  </span>
                  <span style={{ color: '#F8FAFC' }}>{log.target}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  {log.time} • by {log.admin}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
