const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Save question data to a JSON file
 */
const saveQuestion = async (req, res, next) => {
  try {
    const questionData = req.body;

    if (!questionData || !questionData.content) {
      return res.status(400).json({
        success: false,
        message: 'Question data is required'
      });
    }

    // Generate unique ID using Node.js built-in crypto
    const id = crypto.randomUUID();

    // Use src/data directory
    const dataDir = path.join(__dirname, '../../data');

    // Save to file
    const filePath = path.join(dataDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(questionData, null, 2), 'utf8');

    res.status(200).json({
      success: true,
      id: id,
      message: 'Question saved successfully'
    });
  } catch (error) {
    console.error('Error saving question:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save question'
    });
  }
};

module.exports = {
  saveQuestion
};
