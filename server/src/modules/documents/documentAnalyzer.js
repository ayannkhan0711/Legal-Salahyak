/**
 * modules/documents/documentAnalyzer.js
 * Content-aware intelligent legal document analyzer for Indian legal documents.
 * Extracts parties, financial figures, deadlines, cited statutes, and obligations
 * from the actual uploaded document text, producing a rich, grounded analysis.
 */
import { logger } from '../../utils/logger.js';

/**
 * Main analysis function that inspects actual document text and returns structured analysis.
 * @param {string} text - Raw extracted text from document
 * @param {string} [filename='document'] - Original file name for context
 * @param {string} [language='en'] - 'en' or 'hi'
 * @returns {object} Standardized legal analysis object
 */
export function analyzeDocumentContent(text, filename = 'document', language = 'en') {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return createEmptyAnalysis(filename);
  }

  const cleanText = text.replace(/\r\n/g, '\n').trim();
  const lowerText = cleanText.toLowerCase();

  // 1. Extract financial amounts
  const amounts = extractFinancialAmounts(cleanText);

  // 2. Extract deadlines and timeframes
  const deadlines = extractDeadlines(cleanText);

  // 3. Extract party names and entities
  const parties = extractParties(cleanText);

  // 4. Extract cited acts / sections from text
  const citedStatutes = extractCitedStatutes(cleanText);

  // 5. Detect Document Category
  const category = detectDocumentCategory(lowerText, filename);

  // 6. Generate category-tailored analysis populated with actual extracted entities
  const analysis = generateCategoryAnalysis(category, cleanText, lowerText, {
    amounts,
    deadlines,
    parties,
    citedStatutes,
    filename,
    language,
  });

  return analysis;
}

// ── Financial Amounts Extractor ──────────────────────────────

function extractFinancialAmounts(text) {
  const amountRegex = /(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|\b[0-9]+(?:\.[0-9]{2})?)\s*(?:lakhs?|crores?|k)?/gi;
  const matches = [];
  let m;
  while ((m = amountRegex.exec(text)) !== null) {
    const raw = m[0].trim();
    if (!matches.includes(raw)) {
      matches.push(raw);
    }
  }
  return matches.slice(0, 8);
}

// ── Deadlines & Dates Extractor ──────────────────────────────

function extractDeadlines(text) {
  const deadlineRegex = /(?:within|before|period of|expiry of|notice of|dated?)\s*([0-9]{1,3}\s*(?:days|months|hours|weeks|years)|\b[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+[0-9]{1,2},?\s+[0-9]{4}\b)/gi;
  const matches = [];
  let m;
  while ((m = deadlineRegex.exec(text)) !== null) {
    const raw = m[0].trim();
    if (!matches.includes(raw)) {
      matches.push(raw);
    }
  }
  return matches.slice(0, 6);
}

// ── Parties & Names Extractor ────────────────────────────────

function extractParties(text) {
  const parties = [];

  // Patterns like: "Between [Name] and [Name]", "Lessor: [Name]", "Tenant: [Name]"
  const betweenPattern = /(?:between|party of the first part|lessor|landlord|employer|complainant|petitioner|plaintiff)[:\s]+([A-Z][a-zA-Z\s.,&]{3,40})/gi;
  let m;
  while ((m = betweenPattern.exec(text)) !== null) {
    const name = m[1].replace(/[\n\r]+/g, ' ').trim();
    if (name.length > 2 && !parties.includes(name)) {
      parties.push(name);
    }
  }

  const secondPartPattern = /(?:and|party of the second part|lessee|tenant|employee|accused|respondent|defendant)[:\s]+([A-Z][a-zA-Z\s.,&]{3,40})/gi;
  while ((m = secondPartPattern.exec(text)) !== null) {
    const name = m[1].replace(/[\n\r]+/g, ' ').trim();
    if (name.length > 2 && !parties.includes(name)) {
      parties.push(name);
    }
  }

  return parties.slice(0, 4);
}

// ── Cited Statutes in Document ───────────────────────────────

function extractCitedStatutes(text) {
  const statutes = [];
  const patterns = [
    { regex: /(?:section|sec\.?)\s*138\b/i, act: 'Negotiable Instruments Act, 1881', section: 'Section 138', year: 1881 },
    { regex: /(?:section|sec\.?)\s*35(?:\(3\)|\(4\))?\s*(?:bnss|bharatiya nagarik)/i, act: 'Bharatiya Nagarik Suraksha Sanhita, 2023', section: 'Section 35(3)', year: 2023 },
    { regex: /(?:section|sec\.?)\s*41A\b/i, act: 'Code of Criminal Procedure, 1973 (Transitioned to BNSS 35)', section: 'Section 41A CrPC / 35 BNSS', year: 1973 },
    { regex: /(?:section|sec\.?)\s*318(?:\(4\))?\s*(?:bns|bharatiya nyaya)/i, act: 'Bharatiya Nyaya Sanhita, 2023', section: 'Section 318(4) (Cheating)', year: 2023 },
    { regex: /(?:section|sec\.?)\s*420\b/i, act: 'Indian Penal Code, 1860 (Now BNS 318)', section: 'Section 420 IPC', year: 1860 },
    { regex: /(?:section|sec\.?)\s*27\b.*contract/i, act: 'Indian Contract Act, 1872', section: 'Section 27 (Restraint of Trade)', year: 1872 },
    { regex: /(?:section|sec\.?)\s*106|108\b.*property/i, act: 'Transfer of Property Act, 1882', section: 'Section 106 & 108', year: 1882 },
    { regex: /consumer protection/i, act: 'Consumer Protection Act, 2019', section: 'Section 35', year: 2019 },
    { regex: /(?:rera|real estate regulatory)/i, act: 'Real Estate (Regulation and Development) Act, 2016', section: 'Section 18', year: 2016 },
    { regex: /information technology act|section 66/i, act: 'Information Technology Act, 2000', section: 'Section 66', year: 2000 },
  ];

  for (const p of patterns) {
    if (p.regex.test(text)) {
      statutes.push({ act: p.act, section: p.section, year: p.year, status: 'in_force' });
    }
  }

  return statutes;
}

// ── Document Category Detection ──────────────────────────────

function detectDocumentCategory(lowerText, filename) {
  const combined = (lowerText + ' ' + (filename || '').toLowerCase());

  // 1. Tenancy / Rent / Lease
  if (
    combined.includes('rent agreement') ||
    combined.includes('lease deed') ||
    combined.includes('tenancy') ||
    combined.includes('lessor') ||
    combined.includes('lessee') ||
    (combined.includes('landlord') && combined.includes('tenant')) ||
    combined.includes('security deposit') && combined.includes('premises')
  ) {
    return 'rent_agreement';
  }

  // 2. Employment Contract / Offer Letter
  if (
    combined.includes('employment') ||
    combined.includes('offer letter') ||
    combined.includes('appointment letter') ||
    combined.includes('ctc') ||
    (combined.includes('employer') && combined.includes('employee')) ||
    combined.includes('probation period') ||
    (combined.includes('salary') && combined.includes('designation'))
  ) {
    return 'employment_contract';
  }

  // 3. Police Summons / BNSS 35 / FIR
  if (
    combined.includes('station house officer') ||
    combined.includes('police station') ||
    combined.includes('first information report') ||
    combined.includes('fir no') ||
    combined.includes('section 35') ||
    combined.includes('section 41a') ||
    (combined.includes('investigation') && combined.includes('accused')) ||
    combined.includes('police notice')
  ) {
    return 'police_notice';
  }

  // 4. Statutory Demand Notice / Cheque Bounce
  if (
    combined.includes('legal notice') ||
    combined.includes('demand notice') ||
    combined.includes('advocate') && combined.includes('call upon you') ||
    combined.includes('dishonour of cheque') ||
    combined.includes('section 138') ||
    combined.includes('rejoinder') ||
    combined.includes('statutory demand')
  ) {
    return 'legal_notice';
  }

  // 5. Loan Agreement / Promissory Note
  if (
    combined.includes('loan agreement') ||
    combined.includes('promissory note') ||
    combined.includes('borrower') && combined.includes('lender') ||
    combined.includes('hypothecation') ||
    combined.includes('equated monthly') ||
    (combined.includes('interest rate') && combined.includes('repayment'))
  ) {
    return 'loan_agreement';
  }

  // 6. Property Sale Deed / Conveyance
  if (
    combined.includes('sale deed') ||
    combined.includes('agreement to sell') ||
    combined.includes('conveyance deed') ||
    combined.includes('vendor') && combined.includes('purchaser') ||
    combined.includes('stamp duty') && combined.includes('sub-registrar')
  ) {
    return 'property_deed';
  }

  // 7. Non-Disclosure Agreement (NDA)
  if (
    combined.includes('non-disclosure') ||
    combined.includes('confidentiality agreement') ||
    combined.includes('disclosing party') ||
    combined.includes('proprietary information')
  ) {
    return 'non_disclosure_agreement';
  }

  // 8. Consumer Dispute
  if (
    combined.includes('consumer complaint') ||
    combined.includes('deficiency in service') ||
    combined.includes('unfair trade practice') ||
    combined.includes('e-daakhil') ||
    combined.includes('district consumer commission')
  ) {
    return 'consumer_complaint';
  }

  // 9. Court Summons / Petition
  if (
    combined.includes('court of') ||
    combined.includes('civil suit') ||
    combined.includes('original suit') ||
    combined.includes('writ petition') ||
    combined.includes('plaintiff') && combined.includes('defendant') ||
    combined.includes('judicial magistrate')
  ) {
    return 'court_summons';
  }

  // 10. Affidavit / Undertaking
  if (
    combined.includes('affidavit') ||
    combined.includes('deponent') ||
    combined.includes('solemnly affirm') ||
    combined.includes('undertaking')
  ) {
    return 'affidavit';
  }

  return 'general_contract';
}

// ── Category Analysis Generator ──────────────────────────────

function generateCategoryAnalysis(category, text, lowerText, ctx) {
  const { amounts, deadlines, parties, citedStatutes, filename } = ctx;

  const partySnippet = parties.length > 0 ? `involving ${parties.join(' and ')}` : '';
  const amountSnippet = amounts.length > 0 ? `mentioning consideration/claim of ${amounts.slice(0, 2).join(', ')}` : '';
  const deadlineSnippet = deadlines.length > 0 ? `with critical timelines (${deadlines.slice(0, 2).join(', ')})` : '';

  switch (category) {
    case 'rent_agreement': {
      const rentAmt = amounts.find((a) => lowerText.includes('rent') || a) || 'agreed monthly amount';
      const depositAmt = amounts.find((a) => lowerText.includes('deposit')) || 'stipulated security deposit';
      const duration = deadlines.find((d) => d.includes('month') || d.includes('year')) || '11 months';

      return {
        documentType: 'Residential / Commercial Tenancy Agreement (Lease Deed)',
        confidence: 0.95,
        inOneLine: `Tenancy agreement ${partySnippet} for premises with rent of ${rentAmt}, security deposit of ${depositAmt}, and tenure of ${duration}.`,
        whatItSays: [
          `Lessor and Lessee establish terms for occupancy of the subject premises ${amountSnippet}.`,
          `Rent is stipulated as ${rentAmt} payable on the designated due date each month.`,
          `Security deposit of ${depositAmt} is held by the landlord, subject to peaceful handover at the end of the term.`,
          `Tenure and notice conditions: Duration specified as ${duration} with provisions regarding termination and lock-in periods.`,
          `Utility and maintenance obligations: Tenant is responsible for recurring consumption charges unless explicitly bundled.`
        ],
        whatToDo: [
          `Verify that the security deposit refund timeline (typically 7-15 days from key handover) is explicitly recorded.`,
          `Perform a joint condition check of fixtures, water meters, and electrical appliances before taking or handing over possession.`,
          `Ensure rent receipts or electronic transaction records are preserved for HRA tax exemption under Section 10(13A) of the Income Tax Act.`
        ],
        yourRights: [
          `Right to peaceful possession and quiet enjoyment without unannounced intrusion by the landlord (Section 108 Transfer of Property Act, 1882).`,
          `Right to mandatory 30-day notice prior to eviction once the standard lock-in period has concluded (Model Tenancy Act principles).`,
          `Protection against arbitrary or unjustified deductions from the security deposit without verified repair bills.`
        ],
        risksOrRedFlags: [
          lowerText.includes('painting') || lowerText.includes('deduct')
            ? `Clause allowing unilateral deductions for painting or repainting without proving tenant-inflicted damage beyond fair wear and tear.`
            : `Unilateral termination clauses permitting landlord eviction on short notice without corresponding tenant rights.`,
          deadlines.some((d) => d.includes('year'))
            ? `Lease exceeds 11 months: Under Section 17 of the Registration Act, 1908, leases of 1 year or more MUST be registered at the Sub-Registrar's office to be admissible in court.`
            : `Ensure the agreement is executed on appropriate non-judicial stamp paper as prescribed by State Stamp Rules.`
        ],
        suggestedNextStep: `Review deposit deduction and notice terms with the landlord. If tenancy exceeds 11 months, ensure registration with the local Sub-Registrar. Consult a licensed advocate for specific legal advice.`,
        citations: [
          { act: 'Transfer of Property Act, 1882', section: 'Section 106 & 108', year: 1882, status: 'in_force' },
          { act: 'Model Tenancy Act, 2021', section: 'Section 21 & 22', year: 2021, status: 'in_force' },
          { act: 'Registration Act, 1908', section: 'Section 17(1)(d)', year: 1908, status: 'in_force' }
        ]
      };
    }

    case 'employment_contract': {
      const ctc = amounts.find((a) => a) || 'prescribed compensation';
      const noticePeriod = deadlines.find((d) => d.includes('day') || d.includes('month')) || 'standard notice period';

      return {
        documentType: 'Employment Contract / Offer of Employment',
        confidence: 0.94,
        inOneLine: `Employment agreement ${partySnippet} establishing compensation (${ctc}), duties, probation, and exit conditions (${noticePeriod}).`,
        whatItSays: [
          `Defines formal employment relationship, job responsibilities, and reporting hierarchy ${partySnippet}.`,
          `Compensation structure: Total remuneration/CTC is specified at ${ctc}, subject to statutory PF, ESI, and tax deductions.`,
          `Separation and exit terms: Notice period is stipulated as ${noticePeriod} for either party or pay in lieu thereof.`,
          `Confidentiality & intellectual property: Work product and proprietary information developed during employment vest with the employer.`,
          `Post-employment covenants: Restrictive covenants regarding non-solicitation of clients and colleagues.`
        ],
        whatToDo: [
          `Verify that fixed base salary, allowances, and variable performance bonuses are clearly segregated.`,
          `Confirm the length of the probation period and whether confirmation is automatic or requires formal written evaluation.`,
          `Keep written copies of appointment letters, salary slips, and PF UAN account details for employment verification.`
        ],
        yourRights: [
          `Freedom of profession & invalidity of non-compete covenants: Under Section 27 of the Indian Contract Act, 1872, post-termination non-compete restrictions are void and unenforceable in Indian law (Supreme Court in Percept D'Mark v. Zaheer Khan).`,
          `Right to full and final settlement of earned salary, leave encashment, and bonus within statutory timelines upon resignation.`,
          `Entitlement to gratuity under the Payment of Gratuity Act, 1972 if continuous service exceeds 5 years.`
        ],
        risksOrRedFlags: [
          lowerText.includes('bond') || lowerText.includes('training cost')
            ? `Training bond or liquidated damages clause: In Indian law, employers cannot enforce arbitrary punitive bond amounts unless they prove actual, specialized expenditure incurred.`
            : `Lengthy notice period (e.g. 90 days) without a buyout option, which may hinder subsequent career transitions.`,
          `Arbitrary summary termination clauses without notice or opportunity to cure alleged performance issues.`
        ],
        suggestedNextStep: `Ensure salary structure and notice period match your agreed expectations. Post-exit non-compete clauses cannot lawfully prevent you from working elsewhere in India. Consult a licensed advocate for specific legal advice.`,
        citations: [
          { act: 'Indian Contract Act, 1872', section: 'Section 27 (Restraint of Trade)', year: 1872, status: 'in_force' },
          { act: 'Payment of Wages Act, 1936', section: 'Section 15', year: 1936, status: 'in_force' },
          { act: 'Payment of Gratuity Act, 1972', section: 'Section 4', year: 1972, status: 'in_force' }
        ]
      };
    }

    case 'police_notice': {
      const bnssSec = citedStatutes.find((c) => c.section.includes('35'))?.section || 'Section 35(3) BNSS (formerly CrPC 41A)';
      const appearDeadline = deadlines[0] || 'specified date and time';

      return {
        documentType: 'Police Notice of Appearance / Summons (BNSS 35)',
        confidence: 0.97,
        inOneLine: `Official police notice directing appearance for inquiry/investigation ${partySnippet} under ${bnssSec} by ${appearDeadline}.`,
        whatItSays: [
          `Notice issued by the Investigating Officer requiring personal attendance at the police station regarding an ongoing inquiry.`,
          `Issued under Section 35(3) of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 (which replaced Section 41A CrPC effective July 2024).`,
          `Applies to offenses where arrest is not immediately mandatory; compliance prevents coercive custodial arrest.`,
          `Specifies appearance schedule: ${appearDeadline}.`,
          `Directs production of relevant documents, transaction records, or statements pertinent to the complaint.`
        ],
        whatToDo: [
          `Do NOT ignore or evade this notice. Evading compliance empowers the officer to seek arrest under BNSS Section 35(4).`,
          `Prepare identity verification, bank records, chat logs, or correspondence clarifying the dispute.`,
          `Demand a signed written acknowledgement (Diary Entry / Receiving) from the Investigating Officer confirming your timely appearance.`
        ],
        yourRights: [
          `Constitutional protection against self-incrimination: Under Article 20(3) of the Constitution, you cannot be compelled to sign a confession or make statements against yourself.`,
          `Right to legal counsel: Under Section 37 BNSS and Article 22(1) of the Constitution, you are entitled to have an advocate accompany you or remain within sight during examination.`,
          `Protection against arrest: As laid down by the Supreme Court in Arnesh Kumar v. State of Bihar, a person who complies with a notice under Section 35 BNSS cannot be arrested without explicit recorded judicial reasons.`
        ],
        risksOrRedFlags: [
          `Never sign blank sheets, unread typed statements, or confessional narratives under duress.`,
          `Failing to appear without submitting a formal medical or travel extension in writing can lead to non-bailable warrants.`
        ],
        suggestedNextStep: `Engage a criminal defense advocate to accompany you to the police station and file a formal appearance reply. Consult a licensed advocate for specific legal advice.`,
        citations: [
          { act: 'Bharatiya Nagarik Suraksha Sanhita, 2023', section: 'Section 35(3) & 37', year: 2023, status: 'in_force' },
          { act: 'Constitution of India', section: 'Article 20(3) & 22(1)', year: 1950, status: 'in_force' }
        ]
      };
    }

    case 'legal_notice': {
      const claimAmt = amounts[0] || 'stated demand amount';
      const replyDeadline = deadlines[0] || '15 days from receipt';

      return {
        documentType: 'Legal Demand Notice (Formal Legal Communication)',
        confidence: 0.95,
        inOneLine: `Formal legal notice ${partySnippet} demanding resolution/payment of ${claimAmt} within ${replyDeadline} failing which legal proceedings are threatened.`,
        whatItSays: [
          `Issued by an advocate on behalf of the claimant setting out allegations, grievances, or financial claims ${partySnippet}.`,
          `Alleges breach of contract, unpaid invoices, cheque dishonour, or civil wrong amounting to ${claimAmt}.`,
          `Demands immediate compliance or settlement within ${replyDeadline}.`,
          `Warns of civil suits for recovery with interest and/or criminal complaints under the Bharatiya Nyaya Sanhita (BNS) or specific statutes.`,
          `Claims legal fees and incidental drafting expenses from the notice recipient.`
        ],
        whatToDo: [
          `Check the postal delivery receipt / speed post tracking to record the exact date you received this notice.`,
          `Collect all relevant bank statements, receipts, emails, and WhatsApp conversations that rebut the claims made.`,
          `Draft and dispatch a comprehensive legal reply through an advocate before the ${replyDeadline} window expires.`
        ],
        yourRights: [
          `Right to dispute incorrect calculations, fabricated claims, or unilateral penalties in your formal written reply.`,
          `Right to inspect original instruments, returned cheques, and return memos before admitting any liability.`,
          `Right to claim damages and legal costs if the notice contains defamatory or extortionate allegations.`
        ],
        risksOrRedFlags: [
          `Ignoring a legal notice allows the sender to argue in court that you had no defense, creating an adverse inference against you.`,
          `Admitting liability in partial payments or unvetted text messages without qualified legal oversight.`
        ],
        suggestedNextStep: `Have a registered advocate draft and send a formal point-by-point reply notice before the ${replyDeadline} deadline. Consult a licensed advocate for specific legal advice.`,
        citations: citedStatutes.length > 0 ? citedStatutes : [
          { act: 'Code of Civil Procedure, 1908', section: 'Section 80 / Order VI', year: 1908, status: 'in_force' },
          { act: 'Bharatiya Nyaya Sanhita, 2023', section: 'Section 316 & 318', year: 2023, status: 'in_force' }
        ]
      };
    }

    case 'loan_agreement': {
      const principal = amounts[0] || 'principal sum';
      const tenure = deadlines[0] || 'agreed tenure';

      return {
        documentType: 'Loan Agreement / Debt Financing Instrument',
        confidence: 0.93,
        inOneLine: `Debt financing agreement ${partySnippet} for ${principal} over ${tenure} subject to default and collateral enforcement clauses.`,
        whatItSays: [
          `Governs lending transaction between lender and borrower ${partySnippet}.`,
          `Specifies principal loan amount of ${principal} and schedule of repayments/EMIs over ${tenure}.`,
          `Defines events of default, penal interest rates, and acceleration clauses upon missed installments.`,
          `Sets out hypothecation, lien, or mortgage rights over secured assets or personal guarantees.`
        ],
        whatToDo: [
          `Verify the Annual Percentage Rate (APR) including processing fees, administrative charges, and penal rates.`,
          `Ensure that loan closure terms and issuance of a No Objection Certificate (NOC) upon repayment are explicitly agreed.`
        ],
        yourRights: [
          `Protection under RBI Fair Practices Code: Lenders cannot levy undisclosed charges or use coercive recovery agents.`,
          `Right to 60-day notice under Section 13(2) of SARFAESI Act before any enforcement action on secured immovable property.`
        ],
        risksOrRedFlags: [
          `Undated blank security cheques or open NACH debit mandates without monetary caps.`,
          `Compound penal interest clauses that may violate Section 74 of the Indian Contract Act, 1872.`
        ],
        suggestedNextStep: `Verify repayment schedule and default penalties. Confirm lender's RBI registration if an NBFC. Consult a licensed advocate for specific legal advice.`,
        citations: [
          { act: 'Reserve Bank of India Act, 1934', section: 'Fair Practices Code', year: 1934, status: 'in_force' },
          { act: 'Indian Contract Act, 1872', section: 'Section 73 & 74', year: 1872, status: 'in_force' }
        ]
      };
    }

    case 'property_deed': {
      const price = amounts[0] || 'stated sale consideration';

      return {
        documentType: 'Property Sale Deed / Conveyance Document',
        confidence: 0.94,
        inOneLine: `Property conveyance document ${partySnippet} for title transfer against consideration of ${price}.`,
        whatItSays: [
          `Transfers legal ownership and proprietary title of immovable property ${partySnippet}.`,
          `Specifies total sale consideration of ${price} and mode of payment (cheque/RTGS/demand draft).`,
          `Declares property free from prior encumbrances, court attachments, municipal dues, and mortgages.`,
          `Sets out boundary descriptions, survey numbers, and handover of vacant peaceful possession.`
        ],
        whatToDo: [
          `Obtain a minimum 30-year Encumbrance Certificate (EC) from the Sub-Registrar office to ensure no undisclosed liens.`,
          `Verify original title deeds, sanctioned building plans, and Khata/Patta certificate in the seller's name.`
        ],
        yourRights: [
          `Right to clear, marketable, and unencumbered title under Section 55 of the Transfer of Property Act, 1882.`,
          `Seller is legally bound to disclose all latent structural or title defects known to them.`
        ],
        risksOrRedFlags: [
          `Execution on deficient stamp duty renders the deed inadmissible in court until impounded with penalties under the Stamp Act.`,
          `Agreements to sell without registered conveyance deed do not confer ownership title (Supreme Court in Suraj Lamp).`
        ],
        suggestedNextStep: `Perform title verification through an advocate at the local Sub-Registrar office before remitting remaining consideration. Consult a licensed advocate for specific legal advice.`,
        citations: [
          { act: 'Transfer of Property Act, 1882', section: 'Section 54 & 55', year: 1882, status: 'in_force' },
          { act: 'Registration Act, 1908', section: 'Section 17 & 49', year: 1908, status: 'in_force' }
        ]
      };
    }

    case 'non_disclosure_agreement': {
      const term = deadlines[0] || 'custom confidentiality term';

      return {
        documentType: 'Non-Disclosure & Confidentiality Agreement (NDA)',
        confidence: 0.94,
        inOneLine: `Confidentiality covenant ${partySnippet} safeguarding proprietary information for a duration of ${term}.`,
        whatItSays: [
          `Binds parties to maintain strict confidentiality of proprietary data, technology, and business plans ${partySnippet}.`,
          `Defines confidential material and restricts usage strictly to the permitted evaluation purpose.`,
          `Sets confidentiality obligations for a duration of ${term}.`,
          `Outlines remedies including injunctive relief and damages in case of unauthorized disclosure.`
        ],
        whatToDo: [
          `Ensure standard exclusions (information in public domain, independently developed, or legally mandated disclosure) are present.`,
          `Establish clear procedures for returning or securely destroying confidential data upon termination.`
        ],
        yourRights: [
          `Right to disclose information if compelled by a court of law or regulatory authority, provided prior notice is given.`,
          `Protection against perpetual, indefinite liability for non-trade secret commercial information.`
        ],
        risksOrRedFlags: [
          `Overbroad definition of confidential information encompassing general industry knowledge or prior skills.`,
          `One-sided indemnification clauses holding one party liable for indirect or consequential damages.`
        ],
        suggestedNextStep: `Verify whether the confidentiality period and carve-outs are balanced. Consult a licensed advocate for specific legal advice.`,
        citations: [
          { act: 'Indian Contract Act, 1872', section: 'Section 27', year: 1872, status: 'in_force' },
          { act: 'Specific Relief Act, 1963', section: 'Section 38 & 39', year: 1963, status: 'in_force' }
        ]
      };
    }

    default: {
      // General legal document
      const firstParagraph = text.split('\n\n').find((p) => p.trim().length > 40) || text.slice(0, 300);
      const summaryPoint1 = firstParagraph.slice(0, 180).replace(/[\n\r]+/g, ' ').trim();

      return {
        documentType: 'Legal Agreement / Formal Instrument',
        confidence: 0.88,
        inOneLine: `Legal instrument ${partySnippet} establishing contractual rights, obligations ${amountSnippet} ${deadlineSnippet}.`,
        whatItSays: [
          summaryPoint1.length > 20
            ? `Subject Matter: "${summaryPoint1}..."`
            : `Establishes formal contractual relationship and obligations between the involved parties.`,
          amounts.length > 0
            ? `Financial stipulations: Document specifies monetary terms of ${amounts.join(', ')}.`
            : `Contains reciprocal consideration and covenants binding upon the executing parties.`,
          deadlines.length > 0
            ? `Operational timelines: Governed by specific periods including ${deadlines.join(', ')}.`
            : `Specifies conditions governing duration, performance, and termination.`,
          parties.length > 0
            ? `Executing entities identified: ${parties.join(' and ')}.`
            : `Binds the signatories, their legal heirs, executors, and permitted assignees.`
        ],
        whatToDo: [
          `Verify that all signatories possess valid legal capacity and authority to execute this instrument.`,
          `Check that appropriate non-judicial stamp duty has been paid in accordance with the applicable State Stamp Act.`,
          `Preserve signed duplicate copies and supporting correspondence securely.`
        ],
        yourRights: [
          `Protection under the Indian Contract Act, 1872: An agreement without free consent (coercion, undue influence, fraud, misrepresentation) is voidable under Section 19.`,
          `Right to seek specific performance or damages in competent civil court under the Specific Relief Act, 1963.`
        ],
        risksOrRedFlags: [
          `Check whether any clause attempts to oust the jurisdiction of Indian courts or impose unilateral penalties.`,
          `Ensure dates and consideration amounts are free from clerical ambiguity.`
        ],
        suggestedNextStep: `Review key obligations, timelines, and payment clauses before formal execution. Consult a licensed advocate for specific legal advice.`,
        citations: citedStatutes.length > 0 ? citedStatutes : [
          { act: 'Indian Contract Act, 1872', section: 'Section 10 & 19', year: 1872, status: 'in_force' },
          { act: 'Specific Relief Act, 1963', section: 'Section 10', year: 1963, status: 'in_force' }
        ]
      };
    }
  }
}

function createEmptyAnalysis(filename) {
  return {
    documentType: 'Unidentified Document',
    confidence: 0.5,
    inOneLine: `Uploaded file (${filename}) did not contain sufficient extractable plain text.`,
    whatItSays: [
      `The file could not be parsed into readable text layers.`,
      `If this is a scanned photo or PDF, ensure the scan is clear, well-lit, and upright.`
    ],
    whatToDo: [
      `Re-upload as a clear PDF, high-resolution photo, or DOCX document.`
    ],
    yourRights: [
      `You have the right to have all your legal records accurately reviewed.`
    ],
    risksOrRedFlags: [
      `Unclear or illegible documents cannot be relied upon in court proceedings.`
    ],
    suggestedNextStep: `Re-upload a clearer copy or consult an advocate directly. Consult a licensed advocate for specific legal advice.`,
    citations: []
  };
}
