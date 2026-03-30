const mongoose = require('mongoose');
const { errorResponse } = require('../utils/response');

const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 'Invalid ID format', 400);
  }
  next();
};

module.exports = validateObjectId;