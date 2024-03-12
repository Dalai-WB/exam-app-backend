const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: String,
  choices: [String],
});

const examSchema = new mongoose.Schema({
  examName: String,
  questions: [questionSchema],
});

// const projectSchema = new mongoose.Schema({
//   projectName: String,
//   exams: [examSchema],
// });

module.exports = mongoose.model('Exam', examSchema);
