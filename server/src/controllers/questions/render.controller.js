const fs = require('fs');
const path = require('path');

/**
 * Get question by ID and return it for rendering
 */
const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Path to the JSON file (from controllers/questions/ to src/data/)
    const filePath = path.join(__dirname, '../../data', `${id}.json`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Read and parse the JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questionData = JSON.parse(fileContent);

    res.status(200).json({
      success: true,
      data: questionData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  getQuestionById
};
