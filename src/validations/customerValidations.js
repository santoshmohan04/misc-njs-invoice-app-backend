const Joi = require('joi');

/**
 * Customer validation schemas
 */

// Create customer schema
const createSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'Customer name is required',
      'string.min': 'Customer name must be at least 2 characters',
      'string.max': 'Customer name cannot exceed 100 characters'
    }),

  email: Joi.string().trim().email().required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address'
    }),

  phone: Joi.string().trim().min(8).max(20).required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.min': 'Phone number must be at least 8 characters',
      'string.max': 'Phone number cannot exceed 20 characters'
    }),

  address: Joi.string().trim().min(10).max(500).required()
    .messages({
      'string.empty': 'Address is required',
      'string.min': 'Address must be at least 10 characters',
      'string.max': 'Address cannot exceed 500 characters'
    })
});

// Update customer schema (all fields optional for partial updates)
const updateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional()
    .messages({
      'string.min': 'Customer name must be at least 2 characters',
      'string.max': 'Customer name cannot exceed 100 characters'
    }),

  email: Joi.string().trim().email().optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  phone: Joi.string().trim().min(8).max(20).optional()
    .messages({
      'string.min': 'Phone number must be at least 8 characters',
      'string.max': 'Phone number cannot exceed 20 characters'
    }),

  address: Joi.string().trim().min(10).max(500).optional()
    .messages({
      'string.min': 'Address must be at least 10 characters',
      'string.max': 'Address cannot exceed 500 characters'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Legacy schema for backward compatibility
const editSchema = createSchema;

module.exports = {
  createSchema,
  updateSchema,
  editSchema // Keep for backward compatibility
};