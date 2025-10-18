const { extractQuestion } = require('./extract.controller');
const { extractQuestionWithModel } = require('./extractWithModel.controller');
const { getQuestionById } = require('./render.controller');
const { saveQuestion } = require('./save.controller');
const { convertImageToSvg } = require('./convertToSvg.controller');

module.exports = {
  extractQuestion,
  extractQuestionWithModel,
  getQuestionById,
  saveQuestion,
  convertImageToSvg
};
