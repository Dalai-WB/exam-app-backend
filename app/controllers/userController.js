const { User, UserExam } = require('../models/projectModel');
const admin = require('firebase-admin');

exports.register = async (req, res) => {
  const { username, firstName, lastName, role, fireId, teacherId } = req.body;
  try {

    const newUser = new User({
      username,
      firstName,
      lastName,
      role,
      fireId,
      teacherId: teacherId !== '' ? teacherId : null,
      status: 'pending',
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user, please try again.' });
  }
};

exports.getUserRole = async (req, res) => {
  try {
    const { fireId } = req.params;

    const user = await User.findOne({ fireId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ firstName: user.firstName, role: user.role, status: user.status });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Error fetching user information' });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' });

    if (!teachers || teachers.length === 0) {
      return res.status(404).json({ message: 'No teachers found' });
    }

    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers' });
  }
};

exports.getStudentsByTeacher = async (req, res) => {
  const { teacherId } = req.params; // Assuming the teacher ID is stored in the request user object after authentication

  try {
    const teacher = await User.findOne({ fireId: teacherId, role: 'teacher' });
    // Find all students where teacherId is the authenticated teacher's ID
    const students = await User.find({ teacherId: teacher._id }).populate('teacherId');
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const { status } = req.params;
    const users = await User.find({ status: status }).populate('teacherId');

    if (!users) {
      return res.status(404).json({ message: 'No teachers found' });
    }

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.approve = async (req, res) => {
  const { userId, durationMonth } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    if (!durationMonth || isNaN(durationMonth)) {
      return res.status(400).json({ message: "Duration (in months) is required and must be a number." });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + Number(durationMonth));

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        status: "active",
        startDate: startDate,
        endDate: endDate
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User subscription approved successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user subscription:", error);
    res.status(500).json({ message: "Error updating subscription, please try again." });
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    // Find the user in MongoDB to get the Firebase ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const fireId = user.fireId;

    // Delete the user from MongoDB
    await User.findByIdAndDelete(userId);

    await admin.auth().deleteUser(fireId);

    res.status(200).json({ message: `User with ID ${userId} deleted successfully`, id: userId });
  } catch (error) {
    console.error('Error deleting user from MongoDB:', error);
    res.status(500).json({ message: 'Error deleting user from MongoDB, please try again.' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { fireId } = req.params;

    // Step 1: Find the user
    const user = await User.findOne({ fireId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Aggregate average scores and rankings
    const rankings = await UserExam.aggregate([
      {
        $group: {
          _id: "$user",
          totalScore: { $sum: "$score" },
          examCount: { $sum: 1 },
          avgScore: { $avg: "$score" }
        }
      },
      {
        $sort: { avgScore: -1 }
      }
    ]);

    // Step 3: Find the current user's ranking and stats
    let userStats = null;
    rankings.forEach((entry, index) => {
      if (entry._id.toString() === user._id.toString()) {
        userStats = {
          totalScore: entry.totalScore,
          examCount: entry.examCount,
          avgScore: entry.avgScore,
          rank: index + 1
        };
      }
    });

    // If user has never taken an exam, manually set defaults
    if (!userStats) {
      userStats = {
        totalScore: 0,
        examCount: 0,
        avgScore: 0,
        rank: null // or set to "unranked"
      };
    }

    // Step 4: Prepare top 10 users
    const top10UserIds = rankings.slice(0, 10).map(entry => entry._id);

    const top10UsersRaw = await User.find({ _id: { $in: top10UserIds } })
      .select('firstName lastName username role')
      .lean();

    const top10 = top10UsersRaw.map(u => {
      const stats = rankings.find(r => r._id.toString() === u._id.toString());
      return {
        ...u,
        avgScore: stats?.avgScore || 0,
        totalScore: stats?.totalScore || 0,
        examCount: stats?.examCount || 0,
        rank: rankings.findIndex(r => r._id.toString() === u._id.toString()) + 1
      };
    });

    // Step 5: Return user info, stats, and leaderboard
    res.json({
      user,
      userStats,
      top10
    });

  } catch (error) {
    console.error("Error fetching user profile and ranking:", error);
    res.status(500).json({ message: "Error fetching user profile and ranking" });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { fireId } = req.params;
    const updateData = req.body;

    // Step 1: Find the user
    const user = await User.findOne({ fireId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Update user fields with data from req.body
    Object.assign(user, updateData);

    // Step 3: Save the updated user
    await user.save();

    // Step 4: Return the updated user
    res.status(200).json({ message: "User profile updated", user });
  } catch (error) {
    console.error("Error updating user profile", error);
    res.status(500).json({ message: "Error updating user profile" });
  }
};