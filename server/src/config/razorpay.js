/**
 * config/razorpay.js
 * Razorpay client singleton.
 */
import Razorpay from 'razorpay';
import { env } from './env.js';

let razorpay = null;
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}
export { razorpay };
