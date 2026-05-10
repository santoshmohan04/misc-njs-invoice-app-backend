const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3333),
  HOST: Joi.string().default('localhost'),

  MONGODB_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  STRIPE_SECRET_KEY: Joi.string().allow('', null),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('', null),

  EMAIL_SERVICE: Joi.string().default('gmail'),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().default('invoiceappserver@gmail.com'),

  AUTH_STRATEGY: Joi.string().valid('header', 'cookie', 'hybrid').default('hybrid'),
  AUTH_INACTIVITY_TIMEOUT_MS: Joi.number().integer().min(60000).default(30 * 60 * 1000),

  COOKIE_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
  COOKIE_DOMAIN: Joi.string().allow('', null),

  CORS_ORIGINS: Joi.string().allow('', null),
  FRONTEND_URL: Joi.string().allow('', null),
  TRUST_PROXY: Joi.boolean().truthy('true').falsy('false').default(false),

  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),

  API_RATE_LIMIT_WINDOW_MS: Joi.number().integer().positive().default(15 * 60 * 1000),
  API_RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().positive().default(100),
  LOGIN_RATE_LIMIT_WINDOW_MS: Joi.number().integer().positive().default(15 * 60 * 1000),
  LOGIN_RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().positive().default(5),
  USER_RATE_LIMIT_MAX_REQUESTS: Joi.number().integer().positive().default(60),
}).unknown();

const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const details = error.details.map((d) => d.message).join(', ');
    throw new Error(`Environment validation failed: ${details}`);
  }

  return value;
};

module.exports = {
  validateEnv,
};
