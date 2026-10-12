/**
 * scripts/seedAdmin.js
 * Seeds the initial super-admin and realistic verified advocate profiles for testing.
 * Run with: npm run seed
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/modules/auth/User.model.js';
import { AdvocateProfile } from '../src/modules/advocates/AdvocateProfile.model.js';
import { logger } from '../src/utils/logger.js';

async function seed() {
  logger.info('🌱 Starting database seed script...');
  await connectDB();

  // 1. Seed or update Admin
  let admin = await User.findOne({ email: env.SEED_ADMIN_EMAIL.toLowerCase() });
  if (!admin) {
    admin = new User({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL.toLowerCase(),
      passwordHash: env.SEED_ADMIN_PASSWORD,
      role: 'admin',
      isEmailVerified: true,
      preferredLanguage: 'en',
    });
    await admin.save();
    logger.info(`✅ Admin created: ${env.SEED_ADMIN_EMAIL}`);
  } else {
    logger.info(`ℹ️  Admin already exists: ${env.SEED_ADMIN_EMAIL}`);
  }

  // 2. Seed realistic Advocates with Verified Profiles
  const sampleAdvocates = [
    {
      name: 'Adv. Rajesh Sharma',
      email: 'rajesh.sharma@law.in',
      phone: '+919876543210',
      state: 'Delhi',
      preferredLanguage: 'en',
      profile: {
        enrollmentNumber: 'D/1420/2012',
        barCouncil: 'Bar Council of Delhi',
        verificationStatus: 'verified',
        practiceAreas: ['Criminal', 'Cyber Crime', 'Bail Matters'],
        courts: ['Delhi High Court', 'Tis Hazari District Court'],
        languages: ['English', 'Hindi'],
        experienceYears: 12,
        city: 'New Delhi',
        state: 'Delhi',
        bio: 'Specialist in criminal defense, cyber fraud, economic offences, and anticipatory bail under BNSS/BNS. 12+ years of trial and appellate practice.',
        fees: { chat: 50000, video: 120000 }, // ₹500 and ₹1,200
        rating: 4.9,
        reviewCount: 38,
        availability: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '13:00', durationMinutes: 30 },
          { dayOfWeek: 2, startTime: '10:00', endTime: '13:00', durationMinutes: 30 },
          { dayOfWeek: 3, startTime: '14:00', endTime: '18:00', durationMinutes: 30 },
          { dayOfWeek: 5, startTime: '10:00', endTime: '17:00', durationMinutes: 30 },
        ],
      },
    },
    {
      name: 'Adv. Priya Deshmukh',
      email: 'priya.deshmukh@law.in',
      phone: '+919876543211',
      state: 'Maharashtra',
      preferredLanguage: 'hi',
      profile: {
        enrollmentNumber: 'MAH/3421/2015',
        barCouncil: 'Bar Council of Maharashtra & Goa',
        verificationStatus: 'verified',
        practiceAreas: ['Family Law', 'Domestic Violence', 'Divorce & Custody'],
        courts: ['Bombay High Court', 'Family Court Bandra'],
        languages: ['English', 'Hindi', 'Marathi'],
        experienceYears: 9,
        city: 'Mumbai',
        state: 'Maharashtra',
        bio: 'Dedicated family law advocate focusing on matrimonial mediation, maintenance under BNSS, domestic violence protection orders, and child custody.',
        fees: { chat: 45000, video: 100000 }, // ₹450 and ₹1,000
        rating: 4.8,
        reviewCount: 42,
        availability: [
          { dayOfWeek: 1, startTime: '11:00', endTime: '16:00', durationMinutes: 30 },
          { dayOfWeek: 3, startTime: '11:00', endTime: '16:00', durationMinutes: 30 },
          { dayOfWeek: 4, startTime: '11:00', endTime: '16:00', durationMinutes: 30 },
          { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', durationMinutes: 30 },
        ],
      },
    },
    {
      name: 'Adv. Vikramaditya Reddy',
      email: 'vikram.reddy@law.in',
      phone: '+919876543212',
      state: 'Karnataka',
      preferredLanguage: 'en',
      profile: {
        enrollmentNumber: 'KAR/8912/2010',
        barCouncil: 'Bar Council of Karnataka',
        verificationStatus: 'verified',
        practiceAreas: ['Consumer Disputes', 'Cheque Bounce (NI Act 138)', 'Contracts & Real Estate'],
        courts: ['Karnataka High Court', 'State Consumer Disputes Redressal Commission'],
        languages: ['English', 'Hindi', 'Kannada'],
        experienceYears: 14,
        city: 'Bengaluru',
        state: 'Karnataka',
        bio: 'Expert in commercial disputes, Section 138 cheque dishonour cases, property deed reviews, RERA litigation, and consumer redressal.',
        fees: { chat: 60000, video: 150000 }, // ₹600 and ₹1,500
        rating: 5.0,
        reviewCount: 29,
        availability: [
          { dayOfWeek: 2, startTime: '15:00', endTime: '19:00', durationMinutes: 30 },
          { dayOfWeek: 4, startTime: '15:00', endTime: '19:00', durationMinutes: 30 },
          { dayOfWeek: 5, startTime: '15:00', endTime: '19:00', durationMinutes: 30 },
        ],
      },
    },
    {
      name: 'Adv. Aradhana Mukherjee',
      email: 'aradhana.mukherjee@law.in',
      phone: '+919876543213',
      state: 'West Bengal',
      preferredLanguage: 'en',
      profile: {
        enrollmentNumber: 'WB/5512/2018',
        barCouncil: 'Bar Council of West Bengal',
        verificationStatus: 'verified',
        practiceAreas: ['Labour Law', 'Employment Contracts', 'Civil Writs'],
        courts: ['Calcutta High Court', 'Central Administrative Tribunal'],
        languages: ['English', 'Hindi', 'Bengali'],
        experienceYears: 6,
        city: 'Kolkata',
        state: 'West Bengal',
        bio: 'Advising employees and startups on employment termination, severance agreements, workplace harassment (POSH), and fundamental rights writ petitions.',
        fees: { chat: 35000, video: 80000 }, // ₹350 and ₹800
        rating: 4.7,
        reviewCount: 19,
        availability: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '15:00', durationMinutes: 30 },
          { dayOfWeek: 2, startTime: '10:00', endTime: '15:00', durationMinutes: 30 },
          { dayOfWeek: 5, startTime: '10:00', endTime: '15:00', durationMinutes: 30 },
        ],
      },
    },
  ];

  for (const item of sampleAdvocates) {
    let user = await User.findOne({ email: item.email });
    if (!user) {
      user = new User({
        name: item.name,
        email: item.email,
        phone: item.phone,
        passwordHash: 'Lawyer@123456',
        role: 'advocate',
        state: item.state,
        preferredLanguage: item.preferredLanguage,
        isEmailVerified: true,
      });
      await user.save();
      logger.info(`👤 Created advocate user: ${item.email}`);
    }

    await AdvocateProfile.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        ...item.profile,
      },
      { upsert: true, new: true },
    );
    logger.info(`🏛️  Updated profile for: ${item.name}`);
  }

  logger.info('🎉 Seed completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  logger.error(err, '❌ Seed failed');
  process.exit(1);
});
