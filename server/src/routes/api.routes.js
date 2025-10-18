const express = require('express');
const router = express.Router();

const questionsRoutes = require('./questions.routes');

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'API is working',
    version: '1.0.0',
    endpoints: {
      questions: '/api/questions',
      extractQuestion: '/api/questions/extract'
    }
  });
});

// Mount route modules
router.use('/questions', questionsRoutes);

module.exports = router;
