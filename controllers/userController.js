const express = require("express");
const router = express.Router();

// Import validation middleware and schemas
const validate = require("../src/middlewares/validate");
const { registerSchema, loginSchema, editSchema } = require("../src/validations/userValidations");

// Import authentication middleware
const { authenticate } = require("../src/middlewares/authenticate");

// Import rate limiting middleware
const { loginRateLimiter } = require("../src/middlewares/rateLimiter");

// Import auth service
const AuthService = require("../src/services/authService");
const asyncHandler = require("../src/helpers/asyncHandler");
const { sendSuccess, sendError } = require("../src/helpers/responseHelper");

/**
 * User Registration Route
 * POST /user/register
 */
router.post("/register", validate(registerSchema), asyncHandler(async (req, res) => {
  const userData = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    company: req.body.company,
    phone: req.body.phone,
    address: req.body.address,
    base_currency: req.body.base_currency,
  };

  const result = await AuthService.register(userData);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode, result.errors);
  }

  // Set tokens in headers for backward compatibility
  res.header("x-auth", result.data.accessToken);
  res.header("x-refresh-token", result.data.refreshToken);

  return sendSuccess(res, result.data, result.message, 201);
}));

/**
 * User Login Route with Rate Limiting
 * POST /user/login
 */
router.post("/login", loginRateLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const result = await AuthService.login(req.body.email, req.body.password);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode, result.errors);
  }

  // Set tokens in headers for backward compatibility
  res.header("x-auth", result.data.accessToken);
  res.header("x-refresh-token", result.data.refreshToken);

  return sendSuccess(res, result.data, result.message);
}));

/**
 * Refresh Token Route
 * POST /user/refresh
 */
router.post("/refresh", asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.header("x-refresh-token");

  if (!refreshToken) {
    return sendError(res, "Refresh token is required", 400);
  }

  const result = await AuthService.refreshToken(refreshToken);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode, result.errors);
  }

  // Set new access token in header
  res.header("x-auth", result.data.accessToken);

  return sendSuccess(res, result.data, result.message);
}));

/**
 * User Profile Edit Route
 * POST /user/edit
 */
router.post("/edit", authenticate, validate(editSchema), asyncHandler(async (req, res) => {
  const updateData = {
    company: req.body.company,
    phone: req.body.phone,
    address: req.body.address,
    base_currency: req.body.base_currency,
  };

  const result = await AuthService.updateProfile(req.user._id, updateData);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode, result.errors);
  }

  return sendSuccess(res, result.data, result.message);
}));

/**
 * User Logout Route (single session)
 * DELETE /user/logout
 */
router.delete("/logout", authenticate, asyncHandler(async (req, res) => {
  const result = await AuthService.logout(req.user._id, req.token);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode, result.errors);
  }

  return sendSuccess(res, result.data, result.message);
}));

/**
 * User Logout All Route (all sessions)
 * DELETE /user/logout-all
 */
router.delete("/logout-all", authenticate, asyncHandler(async (req, res) => {
  const result = await AuthService.logoutAll(req.user._id);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode, result.errors);
  }

  return sendSuccess(res, result.data, result.message);
}));

/**
 * Get User Profile Route
 * GET /user/user
 */
router.get("/user", authenticate, asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    user: req.user.toJSON()
  }, "User profile retrieved successfully");
}));

/**
 * Verify Token Route (for frontend token validation)
 * POST /user/verify
 */
router.post("/verify", asyncHandler(async (req, res) => {
  const token = req.body.token || req.header("x-auth") || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return sendError(res, "Token is required", 400);
  }

  const result = await AuthService.verifyUser(token);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode, result.errors);
  }

  return sendSuccess(res, result.data, result.message);
}));

module.exports = router;
