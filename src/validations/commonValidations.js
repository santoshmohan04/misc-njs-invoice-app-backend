const Joi = require('joi');

const objectIdSchema = Joi.string().pattern(/^[0-9a-fA-F]{24}$/).message('Invalid ObjectId format');

const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(200).default(50),
  skip: Joi.number().integer().min(0).default(0),
});

const sortSchema = Joi.object({
  sort: Joi.string().trim().max(120).default('-createdAt'),
});

const dateFilterSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

module.exports = {
  objectIdSchema,
  paginationSchema,
  sortSchema,
  dateFilterSchema,
};
