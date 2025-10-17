const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractQuestion } = require('../controllers/question.controller');
const { getQuestionById } = require('../controllers/questionRender.controller');

// Configure multer for form-data parsing (no file upload, just fields)
const upload = multer();

// POST /api/questions/extract - Extract question from text content
router.post('/extract', upload.none(), extractQuestion);

// GET /api/questions/render/:id - Get question by ID for rendering
router.get('/render/:id', getQuestionById);

module.exports = router;
