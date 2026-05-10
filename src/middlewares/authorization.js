const { createErrorResponse } = require('../helpers/responseHelper');
const { hasRoleAccess, hasPermissions } = require('../auth/rbac');

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(createErrorResponse('Unauthorized access', 401));
  }

  if (!hasRoleAccess(req.user.role, roles)) {
    return res.status(403).json(createErrorResponse('Access forbidden', 403));
  }

  return next();
};

const authorizePermissions = (...permissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(createErrorResponse('Unauthorized access', 401));
  }

  if (!hasPermissions(req.user, permissions)) {
    return res.status(403).json(createErrorResponse('Insufficient permissions', 403));
  }

  return next();
};

module.exports = {
  authorizeRoles,
  authorizePermissions,
};
