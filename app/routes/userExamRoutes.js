const express = require('express');
const router = express.Router();
const userExamController = require('../controllers/userExamController');

router.post('/attempt/:fireId', userExamController.saveUserExamAttempt);
router.get('/statistic/:fireId', userExamController.getStatistic);

module.exports = router;
