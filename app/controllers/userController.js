const { User } = require('../models/projectModel');
const admin = require('firebase-admin');

exports.register = async (req, res) => {
  const { username, role, fireId, teacherId } = req.body;
  try {

    const newUser = new User({
      username,
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

    res.json({ role: user.role, status: user.status });
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
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Find the user and update the status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { status: 'active' },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      message: 'User status updated successfully!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error updating user status, please try again.' });
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