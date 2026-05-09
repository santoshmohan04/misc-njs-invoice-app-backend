const { AUTH_CONSTANTS } = require('../constants/api.constants');

const ROLE_HIERARCHY = {
  [AUTH_CONSTANTS.ROLES.OWNER]: 5,
  [AUTH_CONSTANTS.ROLES.ADMIN]: 4,
  [AUTH_CONSTANTS.ROLES.ACCOUNTANT]: 3,
  [AUTH_CONSTANTS.ROLES.STAFF]: 2,
  [AUTH_CONSTANTS.ROLES.VIEWER]: 1,
};

const ROLE_DEFAULT_PERMISSIONS = {
  [AUTH_CONSTANTS.ROLES.OWNER]: ['*'],
  [AUTH_CONSTANTS.ROLES.ADMIN]: ['invoice:*', 'customer:*', 'payment:*', 'profile:update'],
  [AUTH_CONSTANTS.ROLES.ACCOUNTANT]: ['invoice:read', 'invoice:update', 'payment:*', 'customer:read'],
  [AUTH_CONSTANTS.ROLES.STAFF]: ['invoice:read', 'invoice:create', 'customer:read', 'customer:create'],
  [AUTH_CONSTANTS.ROLES.VIEWER]: ['invoice:read', 'customer:read', 'payment:read'],
};

const hasRoleAccess = (userRole, allowedRoles = []) => {
  if (!allowedRoles.length) {
    return true;
  }

  const role = userRole || AUTH_CONSTANTS.ROLES.OWNER;
  const userRank = ROLE_HIERARCHY[role] || 0;

  return allowedRoles.some((allowedRole) => userRank >= (ROLE_HIERARCHY[allowedRole] || 0));
};

const hasPermissions = (user, requiredPermissions = []) => {
  if (!requiredPermissions.length) {
    return true;
  }

  const role = user.role || AUTH_CONSTANTS.ROLES.OWNER;
  const rolePermissions = ROLE_DEFAULT_PERMISSIONS[role] || [];
  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  const granted = new Set([...rolePermissions, ...userPermissions]);

  if (granted.has('*')) {
    return true;
  }

  return requiredPermissions.every((permission) => granted.has(permission));
};

module.exports = {
  ROLE_HIERARCHY,
  ROLE_DEFAULT_PERMISSIONS,
  hasRoleAccess,
  hasPermissions,
};
