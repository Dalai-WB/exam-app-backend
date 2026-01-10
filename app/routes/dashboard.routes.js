// routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboard.controller');

router.get('/:fireId/categories', controller.getCategoryStats);
router.get('/:fireId/subcategories', controller.getSubCategoryStats);
router.get('/:fireId/summary', controller.getAnswerSummary);
router.get('/:fireId/trend', controller.getExamTrend);

module.exports = router;
