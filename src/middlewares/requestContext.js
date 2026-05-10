const { randomUUID } = require('crypto');
const Logger = require('../utils/logger');

const requestContext = (req, res, next) => {
  const correlationId = req.header('x-correlation-id') || randomUUID();
  const requestStart = process.hrtime.bigint();

  req.context = {
    correlationId,
    requestStart,
  };

  res.setHeader('x-correlation-id', correlationId);

  res.on('finish', () => {
    const elapsedNs = Number(process.hrtime.bigint() - requestStart);
    const durationMs = Math.round((elapsedNs / 1_000_000) * 100) / 100;

    Logger.http('request.completed', {
      correlationId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user ? req.user._id : null,
    });
  });

  next();
};

module.exports = requestContext;
