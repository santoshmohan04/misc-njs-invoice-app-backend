const { STATUS_CODES, RESPONSE_MESSAGES } = require('../constants/api.constants');

const buildMeta = (meta = {}) => ({
  timestamp: new Date().toISOString(),
  correlationId: meta.correlationId || null,
  ...meta,
});

const successEnvelope = ({
  data = null,
  message = RESPONSE_MESSAGES.SUCCESS,
  statusCode = STATUS_CODES.OK,
  meta = {},
} = {}) => ({
  success: true,
  message,
  data,
  statusCode,
  meta: buildMeta(meta),
});

const errorEnvelope = ({
  message = RESPONSE_MESSAGES.INTERNAL_SERVER_ERROR,
  statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR,
  errors = null,
  meta = {},
} = {}) => {
  const response = {
    success: false,
    message,
    statusCode,
    meta: buildMeta(meta),
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

module.exports = {
  successEnvelope,
  errorEnvelope,
};
