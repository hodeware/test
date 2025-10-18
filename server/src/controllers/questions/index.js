const { extractQuestion } = require('./extract.controller');
const { getQuestionById } = require('./render.controller');
const { saveQuestion } = require('./save.controller');

module.exports = {
  extractQuestion,
  getQuestionById,
  saveQuestion
};
