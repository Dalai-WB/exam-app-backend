const { Question, Exam, User, UserExam } = require('../models/projectModel');

exports.getExam = async (req, res) => {
  try {
    const { examId, fireId } = req.params;

    const exam = await Exam.findById(examId).populate({
      path: 'questions',
      select: '-correctAnswer -solution'
    });
    const user = await User.findOne({ fireId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const userAttempt = await UserExam.findOne({ user: user._id, exam: exam._id }).populate({
      path: 'responses',
      populate: {
        path: 'question', // Populate the question for each response
        model: 'Question', // Replace with the correct model name if necessary
      },
    });

    const data = {
      exam: exam,
      userAttempt: userAttempt
    }
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while fetching exam questions');
  }
};

exports.getAdminExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).populate({
      path: 'questions',
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while fetching exam questions');
  }
};

exports.getExamAll = async (req, res) => {
  try {
    const { fireId } = req.params;

    // Find the user by fireId
    const user = await User.findOne({ fireId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all exams without questions, and sort them in the desired order
    const exams = await Exam.find().select('-questions').sort({ _id: 1 }); // Replace with your own ordering logic if needed

    // Find all user attempts
    const userAttempts = await UserExam.find({ user: user._id }).select('exam score');

    // Create a map for quick lookup of scores by exam ID
    const attemptMap = userAttempts.reduce((map, attempt) => {
      map[attempt.exam.toString()] = attempt.score;
      return map;
    }, {});

    // Determine exam statuses
    const examsWithStatus = [];
    let unlockNext = true;

    for (const exam of exams) {
      const examIdStr = exam._id.toString();
      const hasAttempt = attemptMap.hasOwnProperty(examIdStr);
      const score = hasAttempt ? attemptMap[examIdStr] : null;

      let status;
      if (hasAttempt) {
        status = 'taken';
      } else if (unlockNext) {
        status = 'available';
        unlockNext = false;
      } else {
        status = 'locked';
      }

      examsWithStatus.push({
        ...exam.toObject(),
        score,
        status,
      });
    }

    res.json(examsWithStatus);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while fetching exams');
  }
};

exports.saveUserExamAttempt = async (req, res) => {
  const { userId, examId, answers } = req.params
  const exam = await Exam.findById(examId);
  let score = 0;
  const responses = exam.questions.map((question, index) => {
    const selectedAnswer = answers[index];
    const isCorrect = selectedAnswer === question.correctAnswer;
    if (isCorrect) score++;
    return { question: question._id, selectedAnswer, isCorrect };
  });

  const userExam = new UserExam({
    user: userId,
    exam: examId,
    score,
    responses,
  });

  try {
    await userExam.save();
    res.status(204);
  } catch (error) {
    res.status(500).send('Error occured while saving answers.');
  }

};

exports.saveExam = async (req, res) => {
  try {
    const { examName, duration, questions } = req.body;

    // Validate input
    if (!examName || !duration || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Save each question and collect its ID + points
    const savedQuestions = [];
    let totalPoint = 0;

    for (const questionData of questions) {
      if (!questionData._id) {
        delete questionData._id;
      }
      const question = new Question(questionData);
      const savedQuestion = await question.save();
      savedQuestions.push(savedQuestion._id);

      // Add questionPoint to the total point (default to 0 if undefined)
      totalPoint += savedQuestion.questionPoint || 0;
    }

    // Create an exam with computed totalPoint
    const exam = new Exam({
      examName,
      duration,
      totalPoint,
      questions: savedQuestions,
    });

    const savedExam = await exam.save();

    res.status(201).json({
      message: 'Exam created successfully',
      exam: savedExam,
    });
  } catch (err) {
    console.error('Error saving exam:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const { examName, duration, totalPoint, questions } = req.body;
    const { examId } = req.params;

    // Validate input
    if (!examName || !duration || !totalPoint || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // If `examId` is provided, update the exam
    if (!examId) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const existingExam = await Exam.findById(examId);
    if (!existingExam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Update questions
    const updatedQuestions = [];
    for (const questionData of questions) {
      if (questionData._id) {
        // Update existing question
        const updatedQuestion = await Question.findByIdAndUpdate(
          questionData._id,
          questionData,
          { new: true }
        );
        updatedQuestions.push(updatedQuestion._id);
      } else {
        // Create new question
        delete questionData._id;
        const newQuestion = new Question(questionData);
        const savedQuestion = await newQuestion.save();
        updatedQuestions.push(savedQuestion._id);
      }
    }

    // Update exam
    existingExam.examName = examName;
    existingExam.duration = duration;
    existingExam.totalPoint = totalPoint;
    existingExam.questions = updatedQuestions;
    const updatedExam = await existingExam.save();

    return res.status(200).json({
      message: 'Exam updated successfully',
      exam: updatedExam,
    });
  } catch (err) {
    console.error('Error saving or updating exam:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.testExam = async (req, res) => {
  try {
    return res.status(200).json({
      message: 'testExam successfully',
    });
  } catch (err) {
    console.error('Error saving or updating exam:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};