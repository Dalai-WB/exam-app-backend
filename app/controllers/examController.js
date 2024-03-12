const Exam = require('../models/projectModel');

exports.getExamQuestion = async (req, res) => {
  try {
    const { examId } = req.params;
    const { questionIndex } = req.params;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (!exam.questions || exam.questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this exam' });
    }

    const nextQuestionIndex = (questionIndex ? parseInt(questionIndex) : 0) - 1;
    if (nextQuestionIndex >= exam.questions.length) {
      return res.status(404).json({ error: 'No more questions available for this exam' });
    }

    const nextQuestion = exam.questions[nextQuestionIndex];
    
    res.json(nextQuestion);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while fetching exam questions');
  }
};
