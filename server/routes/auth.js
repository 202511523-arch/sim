const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { authenticate, generateToken } = require('../middleware/auth');
const emailService = require('../services/email');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

/**
 * POST /api/auth/register
 * Register new user with email/password
 */
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    validate
], async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user
        const user = await User.create({
            email,
            passwordHash: password, // Will be hashed by pre-save hook
            name,
            provider: 'local',
            emailVerificationToken,
            emailVerificationExpires
        });

        // Send verification email
        try {
            await emailService.sendVerificationEmail(user.email, user.name, emailVerificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

/**
 * POST /api/auth/login
 * Login with email/password
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (user.provider !== 'local') {
            return res.status(401).json({
                success: false,
                message: `Please login with ${user.provider}`
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email', [
    body('token').notEmpty(),
    validate
], async (req, res) => {
    try {
        const { token } = req.body;

        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        user.emailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        res.json({
            success: true,
            message: 'Email verified successfully'
        });
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed'
        });
    }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', authenticate, async (req, res) => {
    try {
        if (req.user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        req.user.emailVerificationToken = emailVerificationToken;
        req.user.emailVerificationExpires = emailVerificationExpires;
        await req.user.save();

        await emailService.sendVerificationEmail(req.user.email, req.user.name, emailVerificationToken);

        res.json({
            success: true,
            message: 'Verification email sent'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send verification email'
        });
    }
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail(),
    validate
], async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email, provider: 'local' });

        if (user) {
            const passwordResetToken = crypto.randomBytes(32).toString('hex');
            const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            user.passwordResetToken = passwordResetToken;
            user.passwordResetExpires = passwordResetExpires;
            await user.save();

            await emailService.sendPasswordResetEmail(user.email, user.name, passwordResetToken);
        }

        // Always return success to prevent email enumeration
        res.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request'
        });
    }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
    validate
], async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        user.passwordHash = password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth
 */
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/?error=google_auth_failed' }),
    (req, res) => {
        const token = generateToken(req.user._id);

        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5500'}/index.html?token=${token}`);
    }
);

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth
 */
router.get('/github', passport.authenticate('github', {
    scope: ['user:email']
}));

/**
 * GET /api/auth/github/callback
 * GitHub OAuth callback
 */
router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/?error=github_auth_failed' }),
    (req, res) => {
        const token = generateToken(req.user._id);

        // Redirect to frontend with token
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5500'}/index.html?token=${token}`);
    }
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
});

/**
 * PUT /api/auth/me
 * Update current user profile
 */
router.put('/me', authenticate, [
    body('name').optional().trim().notEmpty(),
    body('avatar').optional().isURL(),
    validate
], async (req, res) => {
    try {
        const { name, avatar } = req.body;

        if (name) req.user.name = name;
        if (avatar) req.user.avatar = avatar;

        await req.user.save();

        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

/**
 * PUT /api/auth/change-password
 * Change password
 */
router.put('/change-password', authenticate, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
    validate
], async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (req.user.provider !== 'local') {
            return res.status(400).json({
                success: false,
                message: 'Cannot change password for social login accounts'
            });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.passwordHash = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
});

module.exports = router;
