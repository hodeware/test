const express = require('express');
const router = express.Router();
const {
  extractQuestion,
  getQuestions,
  getQuestionById,
  createQuestion
} = require('../controllers/questions.controller');

// Question extraction route - POST with rich content
router.post('/extract', extractQuestion);

// CRUD routes (for future database integration)
router.get('/', getQuestions);
router.get('/:id', getQuestionById);
router.post('/', createQuestion);

module.exports = router;
