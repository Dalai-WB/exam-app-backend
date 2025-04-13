const { Question, Exam, UserExam, User } = require('../models/projectModel');

exports.saveUserExamAttempt = async (req, res) => {
  try {
    const { fireId } = req.params;

    console.log(fireId);
    console.log(req.body);

    // Fetch the user and exam
    const user = await User.findOne({ fireId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const exam = await Exam.findById(req.body._id).populate('questions');
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Process answers
    const answers = req.body.questions;
    let score = 0;
    const responses = exam.questions.map((question) => {
      const answer = answers.find(ans => ans._id === question._id.toString());
      const selectedAnswer = answer ? answer.selectedAnswer : null;
      if (question.answerType === 'fill') {
        const selectedAnswerArray = selectedAnswer.split(';');

        const correctAnswerArray = question.correctAnswer.split(';');
        var isCorrect = true;
        correctAnswerArray.forEach((answerPart, index) => {
          const [correctAnswerValue, points] = answerPart.split('&');
          if (selectedAnswerArray[index].trim() === correctAnswerValue.trim()) {
            score += parseInt(points) || 0;
          } else {
            isCorrect = false;
          }
        })
        return {
          question: question._id,
          selectedAnswer,
          isCorrect,
        };
      } else {
        const isCorrect = selectedAnswer === question.correctAnswer;
        if (isCorrect) score += question.questionPoint || 1;
        return {
          question: question._id,
          selectedAnswer,
          isCorrect,
        };
      }
    });

    // Create and save UserExam
    const userExam = new UserExam({
      user: user._id,
      exam: exam._id,
      score,
      responses,
    });

    await userExam.save();
    res.status(201).json({
      message: 'User exam attempt saved successfully',
      userExam,
    });
  } catch (error) {
    console.error('Error saving user exam attempt:', error);
    res.status(500).json({ error: 'Error occurred while saving answers' });
  }
};

const categories = [
  'Тоон ба үсэгт илэрхийлэл',
  'Функц',
  'Тэгшитгэл ба тэнцэтгэл биш',
  'Дараалал',
  'Тригонометр',
  'Функцийн уламжлал',
  'Интеграл',
  'Координатын систем',
  'Вектор',
  'Хавтгайн геометр',
  'Огторгуйн геометр',
  'Магадлал статистик',
  'Комплекс тоо',
  'Матриц',
];

exports.getStatistic = async (req, res) => {
  try {
    console.log('statistic orson');
    const { fireId } = req.params;

    // Find the user by fireId
    const user = await User.findOne({ fireId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize statistics with all categories
    const categoryStats = {};
    categories.forEach((category) => {
      categoryStats[category] = { total: 0, correct: 0 };
    });

    // Fetch all UserExams for the user (for overall statistics)
    const allUserExams = await UserExam.find({ user: user._id })
      .populate({
        path: 'responses.question',
        select: 'category', // Only populate the category field
      })
      .exec();

    console.log('statistic ene hurtel gaigu');
    // Aggregate data by category for all exams (overall)
    allUserExams.forEach((userExam) => {
      userExam.responses.forEach((response) => {
        const category = response.question?.category; // Ensure question exists
        if (category && categoryStats[category]) {
          categoryStats[category].total += 1;
          if (response.isCorrect) {
            categoryStats[category].correct += 1;
          }
        }
      });
    });

    // Calculate overall statistics
    const overallStatistics = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
      percentage: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(2) : '0.00',
    }));

    // Reset category stats for the last 3 exams
    const lastThreeCategoryStats = {};
    categories.forEach((category) => {
      lastThreeCategoryStats[category] = { total: 0, correct: 0 };
    });

    // Fetch the last 3 UserExams for the user
    const lastThreeExams = await UserExam.find({ user: user._id })
      .sort({ examDate: -1 }) // Sort by examDate in descending order
      .limit(3) // Limit to the last 3 exams
      .populate({
        path: 'responses.question',
        select: 'category', // Only populate the category field
      })
      .exec();

    console.log('statistic ene hurtel gaigu');
    // Aggregate data by category for the last 3 exams
    lastThreeExams.forEach((userExam) => {
      userExam.responses.forEach((response) => {
        const category = response.question?.category;
        if (category && lastThreeCategoryStats[category]) {
          lastThreeCategoryStats[category].total += 1;
          if (response.isCorrect) {
            lastThreeCategoryStats[category].correct += 1;
          }
        }
      });
    });

    // Calculate statistics for the last 3 exams
    const lastThreeStatistics = Object.entries(lastThreeCategoryStats).map(([category, stats]) => ({
      category,
      totalQuestions: stats.total,
      correctAnswers: stats.correct,
      percentage: stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(2) : '0.00',
    }));

    console.log('statistic odoo end');

    return res.json({
      overallStatistics,
      lastThreeStatistics,
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};


