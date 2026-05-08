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

/**
 * User Registration Route
 * POST /user/register
 */
router.post("/register", validate(registerSchema), async (req, res) => {
  try {
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
      return res.status(result.statusCode).json(result);
    }

    // Set tokens in headers for backward compatibility
    res.header("x-auth", result.data.accessToken);
    res.header("x-refresh-token", result.data.refreshToken);

    res.status(201).json(result);

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration"
    });
  }
});

/**
 * User Login Route with Rate Limiting
 * POST /user/login
 */
router.post("/login", loginRateLimiter, validate(loginSchema), async (req, res) => {
  try {
    const result = await AuthService.login(req.body.email, req.body.password);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    // Set tokens in headers for backward compatibility
    res.header("x-auth", result.data.accessToken);
    res.header("x-refresh-token", result.data.refreshToken);

    res.json(result);

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login"
    });
  }
});

/**
 * Refresh Token Route
 * POST /user/refresh
 */
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.header("x-refresh-token");

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    const result = await AuthService.refreshToken(refreshToken);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    // Set new access token in header
    res.header("x-auth", result.data.accessToken);

    res.json(result);

  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during token refresh"
    });
  }
});

/**
 * User Profile Edit Route
 * POST /user/edit
 */
router.post("/edit", authenticate, validate(editSchema), async (req, res) => {
  try {
    const updateData = {
      company: req.body.company,
      phone: req.body.phone,
      address: req.body.address,
      base_currency: req.body.base_currency,
    };

    const result = await AuthService.updateProfile(req.user._id, updateData);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during profile update"
    });
  }
});

/**
 * User Logout Route (single session)
 * DELETE /user/logout
 */
router.delete("/logout", authenticate, async (req, res) => {
  try {
    const result = await AuthService.logout(req.user._id, req.token);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout"
    });
  }
});

/**
 * User Logout All Route (all sessions)
 * DELETE /user/logout-all
 */
router.delete("/logout-all", authenticate, async (req, res) => {
  try {
    const result = await AuthService.logoutAll(req.user._id);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout"
    });
  }
});

/**
 * Get User Profile Route
 * GET /user/user
 */
router.get("/user", authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "User profile retrieved successfully",
      data: {
        user: req.user.toJSON()
      }
    });

  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

/**
 * Verify Token Route (for frontend token validation)
 * POST /user/verify
 */
router.post("/verify", async (req, res) => {
  try {
    const token = req.body.token || req.header("x-auth") || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required"
      });
    }

    const result = await AuthService.verifyUser(token);

    if (!result.success) {
      return res.status(result.statusCode).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during token verification"
    });
  }
});

module.exports = router;

