const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true, 
    });

    if (error) {
      const formattedErrors = error.details.map((err) => ({
        field: err.path.join('.'), 
        message: err.message.replace(/['"]/g, ''),
      }));

      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
        ...(process.env.NODE_ENV === 'development' && {
          raw: error.details, 
        }),
      });
    }

    //  Replace request data with validated & sanitized data
    req[source] = value;

    next();
  };
};

module.exports = validateRequest;