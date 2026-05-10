/**
 * User Controller
 * Thin controllers that delegate business logic to services
 */

const express = require('express');
const router = express.Router();

// Services
const AuthService = require('../services/authService');
const config = require('../config/config');

// Middlewares
const { authenticate } = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const { loginRateLimiter } = require('../middlewares/rateLimiter');
const asyncHandler = require('../helpers/asyncHandler');
const { extractRefreshToken } = require('../utils/authUtils');

// Validation schemas
const { registerSchema, loginSchema, editSchema } = require('../validations/userValidations');

// Response helpers
const { sendSuccess, sendError } = require('../helpers/responseHelper');

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new merchant account
 *     description: Creates a new merchant account and returns a JWT access/refresh token pair.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegisterRequest'
 *           example:
 *             name: John Doe
 *             email: john@example.com
 *             password: SecurePass123
 *             company: ABC Corp
 *             phone: "+1234567890"
 *             address: "123 Main St, Springfield"
 *             base_currency: USD
 *     responses:
 *       201:
 *         description: Account created successfully
 *         headers:
 *           x-auth:
 *             schema:
 *               type: string
 *             description: JWT access token
 *           x-refresh-token:
 *             schema:
 *               type: string
 *             description: JWT refresh token
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TokenPair'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const userData = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    company: req.body.company,
    phone: req.body.phone,
    address: req.body.address,
    base_currency: req.body.base_currency,
  };

  const result = await AuthService.register(userData, req);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  // Set tokens in headers for backward compatibility
  res.header('x-auth', result.data.accessToken);
  res.header('x-refresh-token', result.data.refreshToken);

  // Optional secure cookie strategy for browser clients.
  res.cookie('accessToken', result.data.accessToken, {
    httpOnly: true,
    secure: config.auth.cookies.secure,
    sameSite: config.auth.cookies.sameSite,
    domain: config.auth.cookies.domain,
    maxAge: config.jwt.accessExpirationMs,
  });

  res.cookie('refreshToken', result.data.refreshToken, {
    httpOnly: true,
    secure: config.auth.cookies.secure,
    sameSite: config.auth.cookies.sameSite,
    domain: config.auth.cookies.domain,
    maxAge: config.jwt.refreshExpirationMs,
  });

  sendSuccess(res, result.data, result.message, result.statusCode);
}));

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Log in with email and password
 *     description: Authenticates a merchant and returns a JWT access/refresh token pair. Rate limited to 5 attempts per 15 minutes.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginRequest'
 *           example:
 *             email: john@example.com
 *             password: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           x-auth:
 *             schema:
 *               type: string
 *             description: JWT access token
 *           x-refresh-token:
 *             schema:
 *               type: string
 *             description: JWT refresh token
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TokenPair'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/login', loginRateLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const result = await AuthService.login(req.body.email, req.body.password, req);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  // Set tokens in headers for backward compatibility
  res.header('x-auth', result.data.accessToken);
  res.header('x-refresh-token', result.data.refreshToken);

  res.cookie('accessToken', result.data.accessToken, {
    httpOnly: true,
    secure: config.auth.cookies.secure,
    sameSite: config.auth.cookies.sameSite,
    domain: config.auth.cookies.domain,
    maxAge: config.jwt.accessExpirationMs,
  });

  res.cookie('refreshToken', result.data.refreshToken, {
    httpOnly: true,
    secure: config.auth.cookies.secure,
    sameSite: config.auth.cookies.sameSite,
    domain: config.auth.cookies.domain,
    maxAge: config.jwt.refreshExpirationMs,
  });

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh the JWT access token
 *     description: Issues a new access token using a valid refresh token. Pass the refresh token either in the request body or in the `x-refresh-token` header.
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           x-auth:
 *             schema:
 *               type: string
 *             description: New JWT access token
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *       400:
 *         description: Refresh token missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Refresh token invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = extractRefreshToken(req);

  if (!refreshToken) {
    return sendError(res, 'Refresh token is required', 400);
  }

  const result = await AuthService.refreshToken(refreshToken, req);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  // Set new access token in header
  res.header('x-auth', result.data.accessToken);
  res.cookie('accessToken', result.data.accessToken, {
    httpOnly: true,
    secure: config.auth.cookies.secure,
    sameSite: config.auth.cookies.sameSite,
    domain: config.auth.cookies.domain,
    maxAge: config.jwt.accessExpirationMs,
  });

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/user/edit:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Update the authenticated user's profile
 *     description: Updates merchant profile fields such as company, phone, address, and base currency.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserEditRequest'
 *           example:
 *             company: Updated Corp
 *             phone: "+1987654321"
 *             address: "456 New St, Springfield"
 *             base_currency: EUR
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/edit', authenticate, validate(editSchema), asyncHandler(async (req, res) => {
  const updateData = {
    company: req.body.company,
    phone: req.body.phone,
    address: req.body.address,
    base_currency: req.body.base_currency,
  };

  const result = await AuthService.updateProfile(req.user._id, updateData);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/user/logout:
 *   delete:
 *     tags:
 *       - Authentication
 *     summary: Log out current session
 *     description: Invalidates the current access token (single session logout).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/logout', authenticate, asyncHandler(async (req, res) => {
  const result = await AuthService.logout(req.user._id, req.token, extractRefreshToken(req), req);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: config.auth.cookies.secure,
    sameSite: config.auth.cookies.sameSite,
    domain: config.auth.cookies.domain,
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.auth.cookies.secure,
    sameSite: config.auth.cookies.sameSite,
    domain: config.auth.cookies.domain,
  });

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/user/logout-all:
 *   delete:
 *     tags:
 *       - Authentication
 *     summary: Log out all sessions
 *     description: Invalidates all active access tokens for the authenticated user (all devices/sessions).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All sessions logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/logout-all', authenticate, asyncHandler(async (req, res) => {
  const result = await AuthService.logoutAll(req.user._id, req);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: config.auth.cookies.secure,
    sameSite: config.auth.cookies.sameSite,
    domain: config.auth.cookies.domain,
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.auth.cookies.secure,
    sameSite: config.auth.cookies.sameSite,
    domain: config.auth.cookies.domain,
  });

  sendSuccess(res, result.data, result.message);
}));

/**
 * @swagger
 * /api/user/user:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user profile
 *     description: Returns the profile of the currently authenticated merchant.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/user', authenticate, asyncHandler(async (req, res) => {
  sendSuccess(res, {
    user: req.user.toJSON()
  }, 'User profile retrieved successfully');
}));

/**
 * @swagger
 * /api/user/verify:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify a JWT access token
 *     description: Validates the supplied access token and returns the decoded user data. Useful for frontend token validation.
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Token missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const token = req.body.token || req.header('x-auth') || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return sendError(res, 'Token is required', 400);
  }

  const result = await AuthService.verifyUser(token);

  if (!result.success) {
    return sendError(res, result.message, result.statusCode);
  }

  sendSuccess(res, result.data, 'Token verified successfully');
}));

module.exports = router;