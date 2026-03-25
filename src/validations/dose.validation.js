const Joi = require('joi');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const logDoseSchema = Joi.object({
  medication: Joi.string()
    .pattern(objectIdRegex)
    .required()
    .messages({
      'string.pattern.base': 'Invalid medication ID',
      'any.required': 'Medication ID is required',
    }),

  scheduledTime: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Scheduled time cannot be in the future',
      'any.required': 'Scheduled time is required',
    }),

  status: Joi.string()
    .valid('taken', 'skipped', 'missed')
    .required()
    .messages({
      'any.only': 'Status must be taken, skipped or missed',
      'any.required': 'Status is required',
    }),

  takenAt: Joi.when('status', {
    is: 'taken',
    then: Joi.date()
      .max('now')
      .required()
      .messages({
        'date.max': 'takenAt cannot be in the future',
        'any.required': 'takenAt is required when status is taken',
      }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'takenAt should only be provided when status is taken',
    }),
  }),

  notes: Joi.string().trim().max(500).allow('').optional().messages({
    'string.max': 'Notes cannot exceed 500 characters',
  }),
})
  //  Custom validation for logical consistency
  .custom((value, helpers) => {
    if (value.status === 'taken') {
      if (value.takenAt < value.scheduledTime) {
        return helpers.error('any.custom', {
          message: 'takenAt cannot be before scheduledTime',
        });
      }
    }
    return value;
  })

  //  Security
  .options({ stripUnknown: true });

module.exports = { logDoseSchema };