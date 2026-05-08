const Joi = require('joi');

// User Registration Schema
const registerSchema = Joi.object({
  name: Joi.string().trim().min(4).required(),
  email: Joi.string().trim().email().min(6).required(),
  password: Joi.string().trim().min(8).required(),
  company: Joi.string().trim().allow('', null).optional(),
  phone: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  base_currency: Joi.string().trim().required(),
});

// User Login Schema
const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().required(),
});

// User Edit Schema
const editSchema = Joi.object({
  company: Joi.string().trim().allow('', null).optional(),
  phone: Joi.string().trim().required(),
  address: Joi.string().trim().required(),
  base_currency: Joi.string().trim().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  editSchema
};