const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: String,
  choices: [String],
  correctAnswer: String,
  category: String,
  questionPoint: Number,
  answerType: String,
});

const examSchema = new mongoose.Schema({
  examName: String,
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  duration: Number,
  totalPoint: Number
});

const userSchema = new mongoose.Schema({
  username: String,
  role: String,
  fireId: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: String,
});

const userExamSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  score: Number,
  responses: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      selectedAnswer: String,
      isCorrect: Boolean,
    },
  ],
  dateTaken: { type: Date, default: Date.now },  // Track when the exam was taken
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Exam: mongoose.model('Exam', examSchema),
  UserExam: mongoose.model('UserExam', userExamSchema),
  Question: mongoose.model('Question', questionSchema),
};