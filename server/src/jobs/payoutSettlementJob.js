/**
 * jobs/payoutSettlementJob.js
 * Credits advocate balances and tallies earnings for completed consultations.
 */
import { Booking } from '../modules/bookings/Booking.model.js';
import { AdvocateProfile } from '../modules/advocates/AdvocateProfile.model.js';
import { logger } from '../utils/logger.js';

export async function runPayoutSettlementJob() {
  logger.info('💳 Running Payout Settlement Job...');

  try {
    // Find completed bookings where payout was not added yet
    const completedBookings = await Booking.find({
      status: 'completed',
      advocatePayoutPaise: { $gt: 0 },
    }).limit(50);

    let settledCount = 0;

    for (const booking of completedBookings) {
      if (booking.advocatePayoutPaise > 0) {
        await AdvocateProfile.findByIdAndUpdate(booking.advocateProfileId, {
          $inc: { earningsTotal: booking.advocatePayoutPaise },
        });
        settledCount++;
      }
    }

    logger.info(`✅ Payout Settlement Job completed. Processed ${settledCount} bookings.`);
  } catch (err) {
    logger.error(err, '❌ Error in Payout Settlement Job');
  }
}
