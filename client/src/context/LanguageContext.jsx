import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    brandName: 'LegalSahayak',
    tagline: 'Your AI Legal Companion Grounded in Indian Law',
    subtagline: 'Understand legal notices, FIRs, contracts & court orders in plain English & Hindi. Grounded in BNS, BNSS & verified statutes.',
    scanDocument: 'Analyze Document',
    askAi: 'Ask Legal AI',
    findAdvocate: 'Consult an Advocate',
    langToggle: 'हिन्दी',
    login: 'Sign In',
    register: 'Create Account',
    logout: 'Log Out',
    home: 'Home',
    documents: 'Document Scanner',
    chat: 'Legal AI Chat',
    advocates: 'Find Advocates',
    dashboard: 'Dashboard',
    admin: 'Admin Portal',
    disclaimer: 'LegalSahayak provides AI-assisted legal awareness and connects you with licensed advocates. It is not a substitute for formal court representation.',
    statsDocuments: '12,500+ Documents Decoded',
    statsAccuracy: '99.4% Statutory Grounding',
    statsAdvocates: '450+ Verified Advocates',
    bnsBadge: 'Updated for BNS & BNSS 2023',
    uploadTitle: 'Upload or Scan Any Legal Document',
    uploadSubtitle: 'Upload PDF, DOCX, TXT or photo (FIR copy, notice, lease, challan) for instant plain-language explanation.',
  },
  hi: {
    brandName: 'लीगल सहायक',
    tagline: 'भारतीय कानून पर आधारित आपका एआई कानूनी साथी',
    subtagline: 'कानूनी नोटिस, एफआईआर, अनुबंध और अदालती आदेशों को सरल हिंदी व अंग्रेजी में समझें। बीएनएस (BNS), बीएनएसएस (BNSS) से प्रमाणित।',
    scanDocument: 'दस्तावेज़ की जांच करें',
    askAi: 'कानूनी सवाल पूछें',
    findAdvocate: 'वकील से परामर्श लें',
    langToggle: 'English',
    login: 'लॉग इन',
    register: 'खाता बनाएं',
    logout: 'लॉग आउट',
    home: 'होम',
    documents: 'दस्तावेज़ स्कैनर',
    chat: 'लीगल एआई चैट',
    advocates: 'वकील खोजें',
    dashboard: 'डैशबोर्ड',
    admin: 'व्यवस्थापक',
    disclaimer: 'लीगल सहायक केवल कानूनी जागरूकता प्रदान करता है और पंजीकृत अधिवक्ताओं से जोड़ता है। यह औपचारिक अदालती प्रतिनिधित्व का विकल्प नहीं है।',
    statsDocuments: '12,500+ दस्तावेज़ों का विश्लेषण',
    statsAccuracy: '99.4% कानूनी सटीकता',
    statsAdvocates: '450+ सत्यापित वकील',
    bnsBadge: 'BNS एवं BNSS 2023 के तहत अपडेटेड',
    uploadTitle: 'कोई भी कानूनी दस्तावेज़ अपलोड या स्कैन करें',
    uploadSubtitle: 'नोटिस, एफआईआर प्रति, किरायानामा या चालान की फोटो/पीडीएफ अपलोड करें और सरल भाषा में अर्थ जानें।',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
