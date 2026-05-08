const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } = require("../src/utils/authUtils");

// JWT Configuration from environment
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

const UserSchema = new Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        minlength: 4
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        required: true,
        minlength: 6
    },
    password: {
        type: String,
        trim: true,
        required: true,
        minlength: 8
    },
    company: {
        type: String,
        trim: true,
        required: false,
    },
    phone: {
        type: String,
        trim: true,
        required: true,
    },
    address: {
        type: String,
        trim: true,
        required: true,
    },
    base_currency: {
        type: String,
        trim: true,
        required: true,
    },
    tokens: [{
        access: {
            type: String,
            required: true,
            enum: ['auth', 'refresh'] // auth for access tokens, refresh for refresh tokens
        },
        token: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: false // Only for refresh tokens
        }
    }],
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Virtual for account lock
UserSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index for email lookups
UserSchema.index({ email: 1 });

// Index for token cleanup (TTL index for expired refresh tokens)
UserSchema.index({ "tokens.expiresAt": 1 }, { expireAfterSeconds: 0 });

// Instance method to return user object without sensitive data
UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    return _.pick(userObject, ["_id", "email", "name", "company", "phone", "address", "base_currency", "lastLogin", "createdAt", "updatedAt"]);
};

// Instance method to generate access token
UserSchema.methods.generateAuthToken = async function () {
    const user = this;
    const accessToken = generateAccessToken({ _id: user._id });

    // Remove existing auth tokens to prevent duplicates
    user.tokens = user.tokens.filter(token => token.access !== 'auth');

    user.tokens.push({
        access: 'auth',
        token: accessToken,
        createdAt: new Date()
    });

    await user.save();
    return accessToken;
};

// Instance method to generate refresh token
UserSchema.methods.generateRefreshToken = async function () {
    const user = this;
    const refreshToken = generateRefreshToken({ _id: user._id });
    const expiresAt = new Date(Date.now() + this.getRefreshTokenExpirationMs());

    // Remove existing refresh tokens
    user.tokens = user.tokens.filter(token => token.access !== 'refresh');

    user.tokens.push({
        access: 'refresh',
        token: refreshToken,
        createdAt: new Date(),
        expiresAt
    });

    await user.save();
    return refreshToken;
};

// Helper method to get refresh token expiration in milliseconds
UserSchema.methods.getRefreshTokenExpirationMs = function() {
    const expiration = JWT_REFRESH_EXPIRATION;
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1));

    switch(unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 7 * 24 * 60 * 60 * 1000; // Default 7 days
    }
};

// Instance method to remove specific token
UserSchema.methods.removeToken = async function (token) {
    const user = this;
    user.tokens = user.tokens.filter(t => t.token !== token);
    return user.save();
};

// Instance method to remove all tokens (logout all)
UserSchema.methods.removeAllTokens = async function () {
    const user = this;
    user.tokens = [];
    return user.save();
};

// Instance method to update last login
UserSchema.methods.updateLastLogin = async function () {
    this.lastLogin = new Date();
    this.loginAttempts = 0; // Reset login attempts on successful login
    this.lockUntil = null; // Unlock account
    return this.save();
};

// Instance method to increment login attempts
UserSchema.methods.incLoginAttempts = async function () {
    this.loginAttempts += 1;

    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts >= 5) {
        this.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
    }

    return this.save();
};

// Pre-save middleware to hash password
UserSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified("password")) {
        try {
            user.password = await hashPassword(user.password);
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Static method to find user by credentials with rate limiting
UserSchema.statics.findUserByCredentials = async function (email, password) {
    const User = this;

    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        await user.incLoginAttempts();
        throw new Error('Invalid email or password');
    }

    // Update last login on successful authentication
    await user.updateLastLogin();

    return user;
};

// Static method to find user by access token
UserSchema.statics.findUserByToken = async function (token) {
    const User = this;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.type !== 'access') {
            throw new Error('Invalid token type');
        }

        const user = await User.findOne({
            "_id": decoded._id,
            "tokens.token": token,
            "tokens.access": "auth",
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;

    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Static method to find user by refresh token
UserSchema.statics.findUserByRefreshToken = async function (refreshToken) {
    const User = this;

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }

        const user = await User.findOne({
            "_id": decoded._id,
            "tokens.token": refreshToken,
            "tokens.access": "refresh",
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;

    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

const User = mongoose.model('User', UserSchema, 'users');

module.exports = { User };
