import { describe, it, expect } from '@jest/globals';
import { formatINR, rupeesToPaise, maskAadhaar, maskPAN } from '../src/utils/formatters.js';
import { chunkText, estimateTokens } from '../src/modules/rag/chunker.js';

describe('Formatters Utils', () => {
  it('converts paise to formatted INR string', () => {
    const formatted = formatINR(150000);
    expect(formatted).toContain('1,500.00');
  });

  it('converts rupees to paise', () => {
    expect(rupeesToPaise(500)).toBe(50000);
    expect(rupeesToPaise(49.99)).toBe(4999);
  });

  it('masks Aadhaar card number leaving only last 4 digits', () => {
    const masked = maskAadhaar('123456789012');
    expect(masked).toBe('XXXXXXXX9012');
  });

  it('masks PAN number', () => {
    const masked = maskPAN('ABCDE1234F');
    expect(masked).toBe('XXXXXX234F');
  });
});

describe('RAG Chunker', () => {
  it('estimates token counts appropriately', () => {
    const text = 'This is a sample Indian law legal text chunk.';
    expect(estimateTokens(text)).toBeGreaterThan(0);
  });

  it('chunks text preserving metadata', () => {
    const text = `
    CHAPTER I - PRELIMINARY
    Section 1. Short title, extent and commencement.
    This Act may be called the Consumer Protection Act, 2019. It extends to the whole of India.

    Section 2. Definitions.
    In this Act, unless the context otherwise requires, consumer means any person who buys goods.
    `;
    const chunks = chunkText(text, { act: 'Consumer Protection Act', year: 2019 });
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].metadata.act).toBe('Consumer Protection Act');
    expect(chunks[0].text).toContain('Consumer Protection Act');
  });
});
