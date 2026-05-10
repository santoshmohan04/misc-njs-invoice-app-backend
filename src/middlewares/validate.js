const Joi = require('joi');
const { sendValidationError } = require('../helpers/responseHelper');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const payload = req[source];
    const { error, value } = schema.validate(payload, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return sendValidationError(res, errors);
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;