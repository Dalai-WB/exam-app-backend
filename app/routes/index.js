const express = require('express');
const router = express.Router();
const latexRoutes = require('./latexRoutes');
const examRoutes = require('./examRoutes');
const userRoutes = require('./userRoutes');
const userExamRoutes = require('./userExamRoutes');

router.use('/latex', latexRoutes);
router.use('/exam', examRoutes);
router.use('/user', userRoutes);
router.use('/userExam', userExamRoutes);

module.exports = router;
