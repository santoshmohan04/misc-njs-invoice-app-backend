const mongoose = require('mongoose');
const { createErrorResponse } = require('../helpers/responseHelper');

const validateObjectIdParam = (paramName = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return res.status(400).json(createErrorResponse(`Invalid ObjectId for ${paramName}`, 400));
  }

  return next();
};

module.exports = {
  validateObjectIdParam,
};
