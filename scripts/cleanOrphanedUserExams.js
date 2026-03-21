/**
 * One-time cleanup script: removes UserExam records whose user no longer exists.
 * Run with: node scripts/cleanOrphanedUserExams.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, UserExam } = require('../app/models/projectModel');

async function cleanOrphanedUserExams() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const userIds = await User.distinct('_id');

  const result = await UserExam.deleteMany({ user: { $nin: userIds } });

  console.log(`Deleted ${result.deletedCount} orphaned UserExam record(s).`);

  await mongoose.disconnect();
  console.log('Done.');
}

cleanOrphanedUserExams().catch(err => {
  console.error(err);
  process.exit(1);
});
