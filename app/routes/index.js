const express = require('express');
const router = express.Router();
const latexRoutes = require('./latexRoutes');
const examRoutes = require('./examRoutes');

router.use('/latex', latexRoutes);
router.use('/exam', examRoutes);

module.exports = router;
