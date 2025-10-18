const express = require('express');
const router = express.Router();
const { extractQuestion, extractQuestionWithModel, getQuestionById, saveQuestion } = require('../controllers/questions');

// POST /api/questions/extract - Extract question from text content (regex-based)
router.post('/extract', extractQuestion);

// POST /api/questions/extract-with-model - Extract question using Claude AI (more accurate)
router.post('/extract-with-model', extractQuestionWithModel);

// POST /api/questions/save - Save question to data folder
router.post('/save', saveQuestion);

// GET /api/questions/render/:id - Get question by ID for rendering
router.get('/render/:id', getQuestionById);

module.exports = router;
