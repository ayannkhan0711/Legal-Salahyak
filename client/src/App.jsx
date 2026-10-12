import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { DocumentScannerPage } from './pages/DocumentScannerPage';
import { LegalChatPage } from './pages/LegalChatPage';
import { AdvocateMarketplacePage } from './pages/AdvocateMarketplacePage';
import { ConsultationRoomPage } from './pages/ConsultationRoomPage';
import { AdvocateDashboardPage } from './pages/AdvocateDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const [activePage, setActivePage] = useState('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Shared context between document analysis & advocate booking
  const [selectedDocumentForBooking, setSelectedDocumentForBooking] = useState(null);
  const [bookingContext, setBookingContext] = useState(null);

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        openAuthModal={openAuthModal}
      />

      <main style={{ flex: 1 }}>
        {activePage === 'landing' && (
          <LandingPage
            setActivePage={setActivePage}
            openAuthModal={openAuthModal}
          />
        )}

        {activePage === 'documents' && (
          <DocumentScannerPage
            setActivePage={setActivePage}
            setSelectedDocumentForBooking={setSelectedDocumentForBooking}
          />
        )}

        {activePage === 'chat' && (
          <LegalChatPage
            setActivePage={setActivePage}
          />
        )}

        {activePage === 'advocates' && (
          <AdvocateMarketplacePage
            setActivePage={setActivePage}
            selectedDocumentForBooking={selectedDocumentForBooking}
            setBookingContext={setBookingContext}
          />
        )}

        {activePage === 'consultation' && (
          <ConsultationRoomPage
            setActivePage={setActivePage}
            bookingContext={bookingContext}
            selectedDocumentForBooking={selectedDocumentForBooking}
          />
        )}

        {activePage === 'advocate-dashboard' && (
          <AdvocateDashboardPage
            setActivePage={setActivePage}
            setBookingContext={setBookingContext}
          />
        )}

        {activePage === 'admin-dashboard' && (
          <AdminDashboardPage />
        )}
      </main>

      <Footer setActivePage={setActivePage} />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
