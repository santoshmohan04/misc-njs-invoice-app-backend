const { User } = require("../../models/user");
const { extractToken, createErrorResponse } = require("../utils/authUtils");

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json(createErrorResponse("Access denied. No token provided.", 401));
    }

    const user = await User.findUserByToken(token);

    if (!user) {
      return res.status(401).json(createErrorResponse("Invalid token.", 401));
    }

    // Attach user and token to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(401).json(createErrorResponse("Invalid token.", 401));
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      const user = await User.findUserByToken(token);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

/**
 * Admin authentication middleware (placeholder for future admin roles)
 * Currently same as regular authenticate, but can be extended for role-based access
 */
const authenticateAdmin = authenticate;

module.exports = {
  authenticate,
  optionalAuthenticate,
  authenticateAdmin
};