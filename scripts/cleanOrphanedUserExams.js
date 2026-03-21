/**
 * One-time cleanup script: removes UserExam records whose user no longer exists.
 * Run inside the backend container:
 *   docker exec -it <backend-container-name> node scripts/cleanOrphanedUserExams.js
 */

require('dotenv').config();
require('../config/db');
const mongoose = require('mongoose');
const { User, UserExam } = require('../app/models/projectModel');

mongoose.connection.once('open', async () => {
  try {
    const userIds = await User.distinct('_id');
    const result = await UserExam.deleteMany({ user: { $nin: userIds } });
    console.log(`Deleted ${result.deletedCount} orphaned UserExam record(s).`);
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Done.');
  }
});
