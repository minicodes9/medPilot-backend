const Joi = require('joi');

// CREATE REFILL REQUEST 
const createRefillSchema = Joi.object({
  medication: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid medication ID',
      'any.required': 'Medication ID is required',
    }),

  pharmacyName: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Pharmacy name is required',
  }),

  pharmacyAddress: Joi.string().trim().max(255).optional(),

  pharmacyPhone: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/) // stricter
    .optional()
    .messages({
      'string.pattern.base': 'Please use a valid phone number',
    }),

  quantity: Joi.number().integer().min(1).max(1000).required().messages({
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),

  isUrgent: Joi.boolean().default(false),

  notes: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .when('isUrgent', {
      is: true,
      then: Joi.string().min(5).required().messages({
        'any.required': 'Notes are required for urgent requests',
      }),
    }),
}).options({ stripUnknown: true });


// UPDATE REFILL STATUS (ADMIN ONLY) 
const updateRefillStatusSchema = Joi.object({
  status: Joi.string()
    .valid('approved', 'rejected', 'completed')
    .required()
    .messages({
      'any.only': 'Status must be approved, rejected or completed',
      'any.required': 'Status is required',
    }),

  adminNote: Joi.string().trim().max(300).optional(),
}).options({ stripUnknown: true });


module.exports = {
  createRefillSchema,
  updateRefillStatusSchema,
};