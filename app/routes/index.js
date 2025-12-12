const express = require('express');
const router = express.Router();
const latexRoutes = require('./latexRoutes');
const examRoutes = require('./examRoutes');
const userRoutes = require('./userRoutes');
const userExamRoutes = require('./userExamRoutes');
const uploadRoutes = require('./upload.routes');

router.use('/latex', latexRoutes);
router.use('/exam', examRoutes);
router.use('/user', userRoutes);
router.use('/userExam', userExamRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
