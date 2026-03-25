const Joi = require('joi');

const adherenceQuerySchema = Joi.object({
  days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(7)
    .messages({
      'number.min': 'Days must be at least 1',
      'number.max': 'Days cannot exceed 365',
    }),
}).options({ stripUnknown: true });

module.exports = { adherenceQuerySchema };