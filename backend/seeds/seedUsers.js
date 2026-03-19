require('dotenv').config();

const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');
const Otp = require('../models/Otp');
const sampleUsers = require('./data/users');

const prepareUsers = async () =>
  Promise.all(
    sampleUsers.map(async (user) => ({
      ...user,
      email: user.email.toLowerCase(),
      password: await bcrypt.hash(user.password, 12),
      isVerified: true,
      onboardingComplete: true,
      lastActiveAt: new Date()
    }))
  );

const seedUsers = async () => {
  try {
    await connectDB();
    await Promise.all([User.deleteMany({}), Match.deleteMany({}), Message.deleteMany({}), Otp.deleteMany({})]);

    const users = await prepareUsers();
    await User.insertMany(users);

    console.log(`Seeded ${users.length} user profiles.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
