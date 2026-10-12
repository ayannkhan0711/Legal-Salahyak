# LegalSahayak (लीगल सहायक)
> **AI-Powered Legal Assistant & Advocate Consultation Platform Grounded in Indian Law**

LegalSahayak is a production-grade full-stack MERN application that brings clarity and accessible guidance to Indian citizens, businesses, and legal practitioners. It bridges the gap between intimidating legal language and citizen empowerment through multimodal document OCR, Retrieval-Augmented Generation (RAG) updated for the **Bharatiya Nyaya Sanhita (BNS) 2023** and **Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023**, and a verified advocate consultation marketplace with real-time video/chat.

---

## 🏛️ Key Features

1. **AI Document Explainer & OCR Hub**
   - Upload any legal paper (Summons, FIR copies, Rent Agreements, Cheque bounce notices, Challans) in PDF, DOCX, TXT, or mobile photo formats.
   - Text extraction powered by OCR with automated classification.
   - Outputs a plain-English and Hindi structured analysis:
     - 📌 *In One Line* core takeaway
     - 🔍 *What It Says* (simplified obligations)
     - ⏰ *Action Required & Deadlines* (statutory countdown alerts)
     - ⚖️ *Your Rights & Citations* (direct section references)
     - 🚩 *Risks & Red Flags*
     - 🤝 1-Click transfer to a verified advocate with pre-filled document context.

2. **Indian Law Statutory RAG Q&A Agent**
   - Grounded in curated Indian statutes:
     - **Bharatiya Nyaya Sanhita (BNS), 2023** (replaced IPC 1860)
     - **Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023** (replaced CrPC 1973)
     - **Constitution of India** (Articles 14, 19, 21, 22, 32)
     - **Consumer Protection Act, 2019**
     - **Information Technology Act, 2000** (Cyber Crime & UPI fraud)
     - **Section 138 Negotiable Instruments Act** (Cheque dishonour)
   - Real-time distinction between *In Force* and *Repealed* provisions.
   - Conversational in English, Hindi, and Hinglish.

3. **Verified Advocate Consultation Marketplace**
   - Browse licensed advocates filtered by practice area (Criminal, Family, Cyber, Corporate, Consumer), high court / district court, and fee range.
   - Strict Bar Council of India enrollment number validation (`D/1420/2012`).
   - Integrated fixed-fee checkout (in INR) simulated via Razorpay.

4. **Real-Time Consultation Room**
   - Real-time consultation room built with Socket.IO and WebRTC.
   - HD Video call controls (mute, camera toggle, screen sharing).
   - Side-by-side synchronized view of the citizen's uploaded document summary.
   - Post-session rating and review system.

5. **DPDP Act 2023 Compliance & Security**
   - AES-256-GCM encryption for stored documents, extracted text, and sensitive user fields.
   - Explicit consent workflows for document processing and sharing.
   - 30-day automated physical file purge background job.

---

## 📁 Repository Structure

```
Legal Salahkar/
├── package.json                 # Monorepo root scripts (concurrently dev runner)
├── README.md
├── server/                      # Express + MongoDB backend
│   ├── package.json
│   ├── .env.example             # Complete environment configuration template
│   ├── data/
│   │   └── laws/                # Curated Indian Law JSON corpus
│   ├── scripts/
│   │   ├── ingest.js            # Law chunking & vector embedding ingestion
│   │   └── seedAdmin.js         # Seeds platform admin & verified advocates
│   ├── src/
│   │   ├── config/              # env.js, db.js, razorpay.js
│   │   ├── index.js             # Express app & Socket.IO bootstrap
│   │   ├── jobs/                # Background retention & payout scheduler
│   │   ├── middleware/          # auth, rbac, rateLimit, errorHandler
│   │   ├── modules/
│   │   │   ├── admin/           # Admin verification & audit log routes
│   │   │   ├── advocates/       # Advocate profiles & review models
│   │   │   ├── auth/            # JWT auth, user models, encryption
│   │   │   ├── bookings/        # Consultations, slots & payments
│   │   │   ├── chat/            # Conversational sessions & SSE streaming
│   │   │   ├── documents/       # OCR text extraction & analysis
│   │   │   └── rag/             # Chunker, retriever & LLM providers
│   │   ├── sockets/             # Socket.IO consultation room handler
│   │   └── utils/               # AES-256 crypto, formatters, logger
│   └── tests/                   # Unit & integration tests
└── client/                      # React (Vite) frontend
    ├── package.json
    ├── vite.config.js           # Proxy configuration to server
    ├── index.html
    └── src/
        ├── App.jsx              # Main router & page manager
        ├── index.css            # Indian Law deep navy & gold theme
        ├── context/             # AuthContext, LanguageContext
        ├── components/          # Navbar, Footer, AuthModal
        └── pages/
            ├── LandingPage.jsx
            ├── DocumentScannerPage.jsx
            ├── LegalChatPage.jsx
            ├── AdvocateMarketplacePage.jsx
            ├── ConsultationRoomPage.jsx
            ├── AdvocateDashboardPage.jsx
            └── AdminDashboardPage.jsx
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (Local instance or MongoDB Atlas)

### 2. Install Dependencies
```bash
# In the repository root
npm run install:all
```
*(Or install in `server` and `client` individually via `cd server && npm install`, `cd client && npm install`)*

### 3. Configure Environment Variables
Copy `.env.example` in `server/`:
```bash
cp server/.env.example server/.env
```
Key variables to adjust in `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/legalsahayak
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_min_32_chars
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 4. Ingest Legal Corpus & Seed Demo Data
```bash
# Ingest Indian statutes (BNS 2023, BNSS, Consumer Act, NI Act):
npm run ingest

# Seed platform admin and sample verified advocates:
npm run seed
```

### 5. Start the Development Servers
From the root directory:
```bash
npm run dev
```
- **Client UI:** `http://localhost:5173`
- **Server API:** `http://localhost:5000`

---

## 👥 Demo Logins

| Role | Email | Password |
|---|---|---|
| **Platform Admin** | `admin@legalsahayak.in` | `Admin@123456` |
| **Verified Advocate** | `rajesh.sharma@law.in` | `Lawyer@123456` |
| **Demo Citizen** | `citizen@example.com` | `User@123456` |

*(You can also use the 1-click Demo buttons inside the Sign In modal).*

---

## 🛡️ License & Statutory Disclaimer
LegalSahayak is designed for informational and legal awareness purposes under Indian law. Consultation features connect citizens to independent advocates enrolled with state bar councils. All document operations comply with the Digital Personal Data Protection Act, 2023.
