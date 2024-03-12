const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

router.get('/:examId/questions/:questionIndex', examController.getExamQuestion);

module.exports = router;
