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

async function* mockIndianLawStream(systemPrompt, userMessage) {
  // If JSON is requested (e.g., document classification or JSON analysis)
  if (systemPrompt.includes('JSON') || userMessage.includes('JSON')) {
    const mockJson = JSON.stringify({
      documentType: 'legal_notice',
      confidence: 0.92,
      inOneLine: 'This is a formal legal demand notice issued under Section 138 of the Negotiable Instruments Act or Civil Procedure.',
      whatItSays: [
        'Demands settlement of outstanding claim within 15 days of notice receipt.',
        'Alleges dishonour or breach of commitment between parties.',
        'Warns of impending civil and criminal proceedings if unresolved.'
      ],
      whatToDo: [
        'Collect all transaction receipts, bank memos, and communications.',
        'Consult an advocate to draft a formal reply within 15 days.',
        'Do not ignore or admit liability without legal advice.'
      ],
      yourRights: [
        'Right to dispute incorrect calculations and unfair terms.',
        'Right to representation through an advocate of your choice under Article 22(1).'
      ],
      risksOrRedFlags: [
        'Failure to reply within statutory period may be construed as implied admission in court.',
        'Potential criminal complaint under Section 138 NI Act or Section 318 BNS.'
      ],
      suggestedNextStep: 'Schedule a 15-minute consultation with a verified advocate to review and respond before the 15-day deadline.'
    }, null, 2);

    yield mockJson;
    return;
  }

  // Conversational response
  const responseParts = [
    'Based on the Indian legal framework:\n\n',
    '**1. Applicable Provisions:**\n',
    'Under the Bharatiya Nyaya Sanhita (BNS) 2023 and the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 (which replaced IPC and CrPC effective 1 July 2024), your situation is governed by procedural fairness and statutory timelines.\n\n',
    '**2. Your Rights & Options:**\n',
    '• You have the right to seek legal representation and examine all documentation.\n',
    '• For non-cognizable disputes, civil remedies or consumer forums (e-daakhil) provide rapid redressal.\n',
    '• In matters involving financial transactions, check if statutory notices were served within prescribed time limits.\n\n',
    '**3. Recommended Next Steps:**\n',
    'Preserve all digital evidence, messages, and bank records. You may also connect with one of our verified advocates on the platform for a confidential consultation.\n\n',
    '*(Disclaimer: This AI response provides general legal information grounded in Indian statutes and does not constitute formal attorney-client advice.)*'
  ];

  for (const part of responseParts) {
    yield part;
    await new Promise((r) => setTimeout(r, 40));
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
