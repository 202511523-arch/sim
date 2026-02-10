const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const { authenticate } = require('../middleware/auth');
const bcrypt = require('bcryptjs'); // Assuming bcryptjs is used for auth

/**
 * GET /api/users/search
 * Search users by email or name
 */
router.get('/search', authenticate, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const users = await User.find({
            $or: [
                { email: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } }
            ],
            _id: { $ne: req.user._id }
        })
            .select('name email avatar')
            .limit(10);

        res.json({
            success: true,
            data: { users }
        });
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me', authenticate, async (req, res) => {
    try {
        const { name, email, password, avatar } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email; // Note: Typically requires verification
        if (avatar) user.avatar = avatar;

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                }
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

/**
 * GET /api/users/:id
 * Get user profile by ID
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name email avatar createdAt');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user'
        });
    }
});

/**
 * GET /api/users/:id/projects
 * Get user's public projects
 */
router.get('/:id/projects', authenticate, async (req, res) => {
    try {
        // Get projects where user is a member and project is public (or requester is also a member)
        const memberships = await ProjectMember.find({ userId: req.params.id }).select('projectId');
        const projectIds = memberships.map(m => m.projectId);

        const projects = await Project.find({
            _id: { $in: projectIds },
            $or: [
                { 'settings.isPublic': true },
                { ownerId: req.user._id }
            ]
        })
            .populate('ownerId', 'name avatar')
            .select('name description category thumbnail createdAt')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            data: { projects }
        });
    } catch (error) {
        console.error('Get user projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get projects'
        });
    }
});

module.exports = router;
