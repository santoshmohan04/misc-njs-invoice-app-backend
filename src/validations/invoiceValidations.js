const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Invoice Edit Schema
const editSchema = Joi.object({
  number: Joi.string().trim().min(8).required(),
  customer: Joi.string().pattern(objectIdPattern).message('Invalid ObjectId for customer').required(),
  issued: Joi.date().iso().required(),
  due: Joi.date().iso().required(),
  items: Joi.array().items(
    Joi.object({
      item: Joi.string().pattern(objectIdPattern).message('Invalid ObjectId for item').required(),
      quantity: Joi.number().integer().min(0).required(),
      subtotal: Joi.number().min(0).required()
    })
  ).required(),
  subtotal: Joi.number().min(0).required(),
  discount: Joi.number().min(0).required(),
  total: Joi.number().min(0).required(),
  payment: Joi.string().pattern(objectIdPattern).message('Invalid ObjectId for payment').allow(null, '').optional()
});

module.exports = {
  editSchema
};