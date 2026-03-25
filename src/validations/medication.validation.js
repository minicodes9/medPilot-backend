const Joi = require('joi');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

//  Base fields (reusable)
const baseFields = {
  name: Joi.string().trim().min(2).max(100).messages({
    'string.min': 'Medication name must be at least 2 characters',
    'string.max': 'Medication name cannot exceed 100 characters',
  }),

  dosage: Joi.string().trim(),

  frequency: Joi.string().valid(
    'once_daily',
    'twice_daily',
    'three_times_daily',
    'weekly',
    'as_needed'
  ),

  times: Joi.array()
    .items(
      Joi.string().pattern(timeRegex).messages({
        'string.pattern.base': 'Times must be in HH:MM format',
      })
    )
    .min(1),

  startDate: Joi.date(),

  endDate: Joi.date(),

  quantity: Joi.number().integer().min(1).messages({
    'number.min': 'Quantity must be at least 1',
  }),

  refillThreshold: Joi.number().integer().min(1).default(7).messages({
    'number.min': 'Refill threshold must be at least 1',
  }),

  instructions: Joi.string().trim().allow(''),

  isActive: Joi.boolean(),
};


//  ADD medication schema

const addMedicationSchema = Joi.object({
  ...baseFields,

  name: baseFields.name.required().messages({
    'any.required': 'Medication name is required',
  }),

  dosage: baseFields.dosage.required().messages({
    'any.required': 'Dosage is required',
  }),

  frequency: baseFields.frequency.required().messages({
    'any.required': 'Frequency is required',
  }),

  times: baseFields.times.required().messages({
    'array.min': 'At least one time is required',
    'any.required': 'Times are required',
  }),

  startDate: baseFields.startDate.required().messages({
    'any.required': 'Start date is required',
  }),

  quantity: baseFields.quantity.required().messages({
    'any.required': 'Quantity is required',
  }),
})
  //  Enforce times based on frequency
  .custom((value, helpers) => {
    const { frequency, times } = value;

    const rules = {
      once_daily: 1,
      twice_daily: 2,
      three_times_daily: 3,
      weekly: 1,
    };

    if (rules[frequency] && times.length !== rules[frequency]) {
      return helpers.error('any.custom', {
        message: `Frequency "${frequency}" requires exactly ${rules[frequency]} time(s)`,
      });
    }

    return value;
  })
  //  Date validation
  .custom((value, helpers) => {
    if (value.endDate && value.endDate < value.startDate) {
      return helpers.error('any.custom', {
        message: 'End date must be after start date',
      });
    }
    return value;
  })
  //  Remove unknown fields (SECURITY)
  .options({ stripUnknown: true });


//  UPDATE medication schema

const updateMedicationSchema = Joi.object({
  ...baseFields,
})
  // 🔥 At least one field must be provided
  .min(1)
  .message('At least one field must be provided for update')

  //  Date validation
  .custom((value, helpers) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      return helpers.error('any.custom', {
        message: 'End date must be after start date',
      });
    }
    return value;
  })

  //  Remove unknown fields
  .options({ stripUnknown: true });

module.exports = { addMedicationSchema, updateMedicationSchema };