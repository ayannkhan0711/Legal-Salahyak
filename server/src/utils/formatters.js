/**
 * utils/formatters.js
 * Indian currency, date, and number formatting helpers.
 */

/**
 * Convert paise (integer) to a ₹-formatted Indian rupee string.
 * e.g. 150000 → "₹1,500.00"
 * @param {number} paise
 * @returns {string}
 */
export function formatINR(paise) {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Convert rupees to paise (integer), safe for Razorpay.
 * @param {number} rupees
 * @returns {number}
 */
export function rupeesToPaise(rupees) {
  return Math.round(rupees * 100);
}

/**
 * Format a JS Date as "12 October 2026, 10:30 AM IST"
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDateIST(date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(date));
}

/**
 * Mask Aadhaar: keep only last 4 digits
 * @param {string} aadhaar
 * @returns {string}
 */
export function maskAadhaar(aadhaar) {
  return aadhaar.replace(/\d(?=\d{4})/g, 'X');
}

/**
 * Mask PAN: keep only last 4 chars
 * @param {string} pan
 * @returns {string}
 */
export function maskPAN(pan) {
  return 'XXXXXX' + pan.slice(-4);
}
