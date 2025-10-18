const express = require('express');
const router = express.Router();
const { extractQuestion, getQuestionById, saveQuestion } = require('../controllers/questions');

// POST /api/questions/extract - Extract question from text content
router.post('/extract', extractQuestion);

// POST /api/questions/save - Save question to data folder
router.post('/save', saveQuestion);

// GET /api/questions/render/:id - Get question by ID for rendering
router.get('/render/:id', getQuestionById);

module.exports = router;
