#!/usr/bin/env node

require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');
const Otp = require('../models/Otp');
const Session = require('../models/Session');
const Match = require('../models/Match');

const emailsArg = process.argv[2];

if (!emailsArg) {
  console.error('Usage: node scripts/cleanupTestUsers.js "email1@example.com,email2@example.com"');
  process.exit(1);
}

const emails = emailsArg
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

if (emails.length === 0) {
  console.error('Provide at least one valid email.');
  process.exit(1);
}

const run = async () => {
  await connectDB();

  const users = await User.find({ email: { $in: emails } }).select('_id email matches');
  if (!users.length) {
    console.log('No matching users found.');
    return;
  }

  const userIds = users.map((user) => user._id);

  console.log(`Deleting ${users.length} user(s).`);

  await Promise.all([
    Session.deleteMany({ user: { $in: userIds } }),
    Otp.deleteMany({ user: { $in: userIds } }),
    Match.deleteMany({ participants: { $in: userIds } })
  ]);

  await User.deleteMany({ _id: { $in: userIds } });

  console.log('Removed users:');
  users.forEach((user) => console.log(`- ${user.email}`));
};

run()
  .then(() => {
    console.log('Cleanup complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
