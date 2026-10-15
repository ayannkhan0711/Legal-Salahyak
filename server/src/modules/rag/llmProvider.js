/**
 * modules/rag/llmProvider.js
 * Abstract LLM provider. Supports Gemini and OpenAI.
 * Returns either a full string (non-streaming) or an async generator (streaming).
 */
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

// ── Gemini ────────────────────────────────────────────────────

async function* geminiStream(systemPrompt, userMessage, history = []) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_CHAT_MODEL,
    systemInstruction: systemPrompt,
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
  });

  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  });

  const result = await chat.sendMessageStream(userMessage);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

// ── OpenAI ────────────────────────────────────────────────────

async function* openaiStream(systemPrompt, userMessage, history = []) {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const stream = await openai.chat.completions.create({
    model: env.OPENAI_CHAT_MODEL,
    messages,
    stream: true,
    temperature: 0.2,
    max_tokens: 2048,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

import { analyzeDocumentContent } from '../documents/documentAnalyzer.js';

async function* mockIndianLawStream(systemPrompt, userMessage) {
  // If JSON is requested (e.g., document classification or JSON analysis)
  if (systemPrompt.includes('JSON') || userMessage.includes('JSON')) {
    // Extract document content if wrapped in delimiters
    let docContent = userMessage;
    const match = userMessage.match(/<<<DOCUMENT_START>>>([\s\S]*?)<<<DOCUMENT_END>>>/);
    if (match && match[1]) {
      docContent = match[1];
    }

    const dynamicAnalysis = analyzeDocumentContent(docContent);

    // If only classification is requested
    if (systemPrompt.includes('classifier') || userMessage.includes('Classify this document')) {
      yield JSON.stringify({
        type: dynamicAnalysis.documentType,
        confidence: dynamicAnalysis.confidence || 0.92,
        parties: [],
        language: 'en',
      });
      return;
    }

    // Full structured document analysis
    yield JSON.stringify(dynamicAnalysis, null, 2);
    return;
  }

  // Conversational response tailored to user's question
  const lowerMsg = userMessage.toLowerCase();
  let topicHeading = 'Applicable Indian Legal Provisions';
  let statuteNote = 'Under the Bharatiya Nyaya Sanhita (BNS) 2023 and Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 (which replaced IPC and CrPC in July 2024), this matter is governed by statutory timelines and procedural safeguards.';

  if (lowerMsg.includes('cheque') || lowerMsg.includes('138')) {
    topicHeading = 'Section 138 Negotiable Instruments Act (Cheque Dishonour)';
    statuteNote = 'Cheque bounce requires service of statutory notice within 30 days of receiving the bank memo, granting 15 days to pay before a complaint can be filed.';
  } else if (lowerMsg.includes('rent') || lowerMsg.includes('tenant') || lowerMsg.includes('lease')) {
    topicHeading = 'Tenancy Rights & Transfer of Property Act';
    statuteNote = 'Governed by the Transfer of Property Act, 1882 (Section 106 & 108) and Model Tenancy Act rules requiring mandatory written notice and protection of security deposit.';
  } else if (lowerMsg.includes('police') || lowerMsg.includes('fir') || lowerMsg.includes('summons')) {
    topicHeading = 'BNSS Section 35 & Constitutional Protections';
    statuteNote = 'Under Section 35(3) BNSS and Article 20(3) of the Constitution, compliance with notice prevents arbitrary arrest and you have the right to legal counsel under Section 37 BNSS.';
  } else if (lowerMsg.includes('cyber') || lowerMsg.includes('online fraud')) {
    topicHeading = 'Cyber Crime Redressal & Information Technology Act';
    statuteNote = 'Report financial frauds immediately to 1930 or cybercrime.gov.in within the golden hour to freeze fraudulent beneficiary accounts under Section 66D IT Act.';
  }

  const responseParts = [
    `Based on the Indian legal framework regarding your inquiry:\n\n`,
    `**1. ${topicHeading}:**\n`,
    `${statuteNote}\n\n`,
    `**2. Your Rights & Safeguards:**\n`,
    `• You have the right to consult a licensed advocate and review all documentation.\n`,
    `• Statutory notices must strictly adhere to limitation periods prescribed under Indian law.\n`,
    `• In civil or consumer matters, remedies such as e-daakhil or mediation provide fast resolution.\n\n`,
    `**3. Recommended Action:**\n`,
    `Preserve all transaction receipts, agreements, notices, and communications. You can also connect with a verified advocate on LegalSahayak for a one-on-one consultation.\n\n`,
    `*(Disclaimer: This AI response provides general legal information grounded in Indian statutes and does not constitute formal attorney-client advice.)*`
  ];

  for (const part of responseParts) {
    yield part;
    await new Promise((r) => setTimeout(r, 30));
  }
}

// ── Non-streaming (single completion) ────────────────────────

/**
 * Get a non-streaming completion for short classification tasks.
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
export async function complete(systemPrompt, userMessage) {
  let fullText = '';
  for await (const chunk of streamResponse(systemPrompt, userMessage)) {
    fullText += chunk;
  }
  return fullText;
}

/**
 * Stream a response as an async generator.
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {Array<{role: string, content: string}>} history  Previous messages
 * @returns {AsyncGenerator<string>}
 */
export async function* streamResponse(systemPrompt, userMessage, history = []) {
  const hasKey =
    (env.AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('your_')) ||
    (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY && !env.OPENAI_API_KEY.includes('your_'));

  if (!hasKey) {
    logger.debug('No valid LLM key provided. Yielding mock grounded Indian law response.');
    yield* mockIndianLawStream(systemPrompt, userMessage);
    return;
  }

  const streamFn = env.AI_PROVIDER === 'openai' ? openaiStream : geminiStream;
  try {
    yield* streamFn(systemPrompt, userMessage, history);
  } catch (err) {
    logger.warn({ err: err.message }, 'Live LLM stream error. Falling back to mock legal assistant response.');
    yield* mockIndianLawStream(systemPrompt, userMessage);
  }
}
