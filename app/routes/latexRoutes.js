const express = require('express');
const router = express.Router();
const multer = require('multer');
const latexController = require('../controllers/latexController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './app/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

router.post('/upload', upload.single('Soril'), latexController.uploadLatexFile);

module.exports = router;
