const Joi = require('joi');

/**
 * Payment validation schemas
 */

// Create payment schema
const createSchema = Joi.object({
  invoice: Joi.string().trim().length(24).hex().required()
    .messages({
      'string.empty': 'Invoice ID is required',
      'string.length': 'Invoice ID must be a valid ObjectId',
      'string.hex': 'Invoice ID must be a valid ObjectId'
    }),

  amount: Joi.number().min(0.01).precision(2).required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.min': 'Amount must be greater than 0'
    }),

  currency: Joi.string().trim().length(3).uppercase().default('USD')
    .messages({
      'string.length': 'Currency must be exactly 3 characters',
      'string.uppercase': 'Currency must be uppercase'
    }),

  method: Joi.string().trim().valid('card', 'bank_transfer', 'cash', 'check').default('card')
    .messages({
      'any.only': 'Payment method must be one of: card, bank_transfer, cash, check'
    }),

  status: Joi.string().trim().valid('pending', 'completed', 'failed', 'cancelled').default('pending')
    .messages({
      'any.only': 'Status must be one of: pending, completed, failed, cancelled'
    })
});

// Process payment schema (for Stripe integration)
const processSchema = Joi.object({
  paymentMethodId: Joi.string().trim().required()
    .messages({
      'string.empty': 'Payment method ID is required'
    }),

  type: Joi.string().trim().valid('card', 'bank_account').default('card')
    .messages({
      'any.only': 'Payment type must be card or bank_account'
    })
});

// Update payment status schema
const updateStatusSchema = Joi.object({
  status: Joi.string().trim().valid('pending', 'completed', 'failed', 'cancelled').required()
    .messages({
      'any.only': 'Status must be one of: pending, completed, failed, cancelled',
      'string.empty': 'Status is required'
    })
});

// Legacy schemas for backward compatibility
const newPaymentSchema = createSchema;
const processPaymentSchema = processSchema;

module.exports = {
  createSchema,
  processSchema,
  updateStatusSchema,
  newPaymentSchema, // Keep for backward compatibility
  processPaymentSchema // Keep for backward compatibility
};