const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
const { uploadFile } = require("../controllers/upload.controller");

// /upload endpoint
router.post("/", upload.single("file"), uploadFile);

module.exports = router;
