const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractQuestion } = require('../controllers/question.controller');

// Configure multer for form-data parsing (no file upload, just fields)
const upload = multer();

// POST /api/questions/extract - Extract question from text content
router.post('/extract', upload.none(), extractQuestion);

module.exports = router;
