const Joi = require('joi');

/**
 * Item validation schemas
 */

// Create item schema
const createSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'Item name is required',
      'string.min': 'Item name must be at least 2 characters',
      'string.max': 'Item name cannot exceed 100 characters'
    }),

  description: Joi.string().trim().max(500).optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  price: Joi.number().min(0).precision(2).required()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative'
    }),

  category: Joi.string().trim().min(2).max(50).optional()
    .messages({
      'string.min': 'Category must be at least 2 characters',
      'string.max': 'Category cannot exceed 50 characters'
    }),

  quantity: Joi.number().integer().min(0).optional().default(0)
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity cannot be negative'
    })
});

// Update item schema (all fields optional for partial updates)
const updateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional()
    .messages({
      'string.min': 'Item name must be at least 2 characters',
      'string.max': 'Item name cannot exceed 100 characters'
    }),

  description: Joi.string().trim().max(500).optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  price: Joi.number().min(0).precision(2).optional()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative'
    }),

  category: Joi.string().trim().min(2).max(50).optional()
    .messages({
      'string.min': 'Category must be at least 2 characters',
      'string.max': 'Category cannot exceed 50 characters'
    }),

  quantity: Joi.number().integer().min(0).optional()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity cannot be negative'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Legacy schema for backward compatibility
const editSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  price: Joi.number().min(0).required(),
  description: Joi.string().trim().allow('', null).optional()
});

module.exports = {
  createSchema,
  updateSchema,
  editSchema // Keep for backward compatibility
};