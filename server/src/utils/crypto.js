/**
 * utils/crypto.js
 * AES-256-GCM field-level and file encryption helpers.
 * Each ciphertext is stored as: iv:authTag:ciphertext (hex-encoded).
 */
import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex'); // 32 bytes

/**
 * Encrypt a UTF-8 string.
 * @param {string} plaintext
 * @returns {string} "iv:authTag:ciphertext" (hex)
 */
export function encryptField(plaintext) {
  const iv = crypto.randomBytes(12); // 96-bit nonce for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt a field encrypted with encryptField.
 * @param {string} ciphertext "iv:authTag:ciphertext" (hex)
 * @returns {string}
 */
export function decryptField(ciphertext) {
  const [ivHex, tagHex, dataHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/**
 * Encrypt a Buffer (file content).
 * @param {Buffer} buffer
 * @returns {{ iv: string, authTag: string, data: Buffer }}
 */
export function encryptBuffer(buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return {
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
    data: encrypted,
  };
}

/**
 * Decrypt a Buffer.
 * @param {Buffer} encryptedBuffer
 * @param {string} ivHex
 * @param {string} authTagHex
 * @returns {Buffer}
 */
export function decryptBuffer(encryptedBuffer, ivHex, authTagHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}
