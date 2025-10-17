const express = require('express');
const router = express.Router();

const userRoutes = require('./user.routes');

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'API is working',
    version: '1.0.0',
    endpoints: {
      users: '/api/users'
    }
  });
});

// Mount route modules
router.use('/users', userRoutes);

module.exports = router;
