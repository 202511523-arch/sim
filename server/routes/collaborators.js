const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Collaborator = require('../models/Collaborator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/collaborators
 * Get all accepted collaborators for current user
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const collaborators = await Collaborator.find({
            userId: req.user._id,
            status: 'accepted'
        }).populate('collaboratorId', 'name email avatar');

        res.json({
            success: true,
            data: {
                collaborators: collaborators.map(c => ({
                    _id: c._id,
                    user: c.collaboratorId,
                    nickname: c.nickname,
                    note: c.note,
                    tags: c.tags,
                    acceptedAt: c.acceptedAt,
                    createdAt: c.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Get collaborators error:', error);
        res.status(500).json({ success: false, message: 'Failed to get collaborators' });
    }
});

/**
 * GET /api/collaborators/requests/pending
 * Get pending collaborator requests sent TO the current user
 */
router.get('/requests/pending', authenticate, async (req, res) => {
    try {
        const requests = await Collaborator.find({
            collaboratorId: req.user._id,
            status: 'pending'
        }).populate('userId', 'name email avatar');

        res.json({
            success: true,
            data: {
                requests: requests.map(r => ({
                    _id: r._id,
                    from: r.userId,
                    note: r.note,
                    createdAt: r.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to get pending requests' });
    }
});

/**
 * GET /api/collaborators/requests/sent
 * Get pending requests sent BY the current user
 */
router.get('/requests/sent', authenticate, async (req, res) => {
    try {
        const requests = await Collaborator.find({
            userId: req.user._id,
            status: 'pending'
        }).populate('collaboratorId', 'name email avatar');

        res.json({
            success: true,
            data: {
                requests: requests.map(r => ({
                    _id: r._id,
                    to: r.collaboratorId,
                    note: r.note,
                    createdAt: r.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Get sent requests error:', error);
        res.status(500).json({ success: false, message: 'Failed to get sent requests' });
    }
});

/**
 * POST /api/collaborators/request
 * Send a collaborator request by email
 */
router.post('/request', authenticate, [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('note').optional().isLength({ max: 200 }).withMessage('Note too long'),
    validate
], async (req, res) => {
    try {
        const { email, note } = req.body;

        // Can't add yourself
        if (email === req.user.email) {
            return res.status(400).json({
                success: false,
                message: 'You cannot add yourself as a collaborator'
            });
        }

        // Find user by email
        const targetUser = await User.findOne({ email });
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found with this email'
            });
        }

        // Check if relationship already exists
        const existingRelationship = await Collaborator.findOne({
            userId: req.user._id,
            collaboratorId: targetUser._id
        });

        if (existingRelationship) {
            if (existingRelationship.status === 'accepted') {
                return res.status(400).json({
                    success: false,
                    message: 'This user is already your collaborator'
                });
            }
            if (existingRelationship.status === 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Request already sent to this user'
                });
            }
            if (existingRelationship.status === 'blocked') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot send request to this user'
                });
            }
        }

        // Check if the target user already sent a request to current user
        const reverseRequest = await Collaborator.findOne({
            userId: targetUser._id,
            collaboratorId: req.user._id,
            status: 'pending'
        });

        if (reverseRequest) {
            // Auto-accept bi-directional relationship
            await reverseRequest.accept();

            return res.json({
                success: true,
                message: 'Collaborator added! (They already sent you a request)',
                data: {
                    collaborator: {
                        user: {
                            _id: targetUser._id,
                            name: targetUser.name,
                            email: targetUser.email,
                            avatar: targetUser.avatar
                        },
                        status: 'accepted'
                    }
                }
            });
        }

        // Create new collaborator request
        const collaborator = await Collaborator.create({
            userId: req.user._id,
            collaboratorId: targetUser._id,
            note: note || null,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Collaborator request sent!',
            data: {
                request: {
                    _id: collaborator._id,
                    to: {
                        _id: targetUser._id,
                        name: targetUser.name,
                        email: targetUser.email,
                        avatar: targetUser.avatar
                    },
                    status: 'pending',
                    createdAt: collaborator.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Send collaborator request error:', error);
        res.status(500).json({ success: false, message: 'Failed to send request' });
    }
});

/**
 * POST /api/collaborators/requests/:id/accept
 * Accept a pending collaborator request
 */
router.post('/requests/:id/accept', authenticate, async (req, res) => {
    try {
        const request = await Collaborator.findOne({
            _id: req.params.id,
            collaboratorId: req.user._id,
            status: 'pending'
        }).populate('userId', 'name email avatar');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed'
            });
        }

        await request.accept();

        res.json({
            success: true,
            message: 'Collaborator request accepted!',
            data: {
                collaborator: {
                    _id: request._id,
                    user: request.userId,
                    acceptedAt: request.acceptedAt
                }
            }
        });
    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({ success: false, message: 'Failed to accept request' });
    }
});

/**
 * POST /api/collaborators/requests/:id/reject
 * Reject/decline a pending collaborator request
 */
router.post('/requests/:id/reject', authenticate, async (req, res) => {
    try {
        const request = await Collaborator.findOneAndDelete({
            _id: req.params.id,
            collaboratorId: req.user._id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found or already processed'
            });
        }

        res.json({
            success: true,
            message: 'Request rejected'
        });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject request' });
    }
});

/**
 * PUT /api/collaborators/:id
 * Update collaborator (nickname, note, tags)
 */
router.put('/:id', authenticate, [
    body('nickname').optional().isLength({ max: 50 }),
    body('note').optional().isLength({ max: 200 }),
    body('tags').optional().isArray(),
    validate
], async (req, res) => {
    try {
        const { nickname, note, tags } = req.body;

        const collaborator = await Collaborator.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!collaborator) {
            return res.status(404).json({
                success: false,
                message: 'Collaborator not found'
            });
        }

        if (nickname !== undefined) collaborator.nickname = nickname;
        if (note !== undefined) collaborator.note = note;
        if (tags !== undefined) collaborator.tags = tags;

        await collaborator.save();

        res.json({
            success: true,
            message: 'Collaborator updated',
            data: { collaborator }
        });
    } catch (error) {
        console.error('Update collaborator error:', error);
        res.status(500).json({ success: false, message: 'Failed to update collaborator' });
    }
});

/**
 * DELETE /api/collaborators/:id
 * Remove a collaborator
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const collaborator = await Collaborator.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!collaborator) {
            return res.status(404).json({
                success: false,
                message: 'Collaborator not found'
            });
        }

        // Remove both directions of the relationship
        await Collaborator.deleteOne({ _id: collaborator._id });
        await Collaborator.deleteOne({
            userId: collaborator.collaboratorId,
            collaboratorId: req.user._id
        });

        res.json({
            success: true,
            message: 'Collaborator removed'
        });
    } catch (error) {
        console.error('Delete collaborator error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove collaborator' });
    }
});

/**
 * DELETE /api/collaborators/requests/:id/cancel
 * Cancel a pending request sent by current user
 */
router.delete('/requests/:id/cancel', authenticate, async (req, res) => {
    try {
        const request = await Collaborator.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        res.json({
            success: true,
            message: 'Request cancelled'
        });
    } catch (error) {
        console.error('Cancel request error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel request' });
    }
});

/**
 * GET /api/collaborators/search
 * Search users to add as collaborator
 */
router.get('/search', authenticate, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: { users: [] }
            });
        }

        // Search by email or name
        const users = await User.find({
            _id: { $ne: req.user._id },
            $or: [
                { email: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } }
            ]
        })
            .select('name email avatar')
            .limit(10);

        // Check existing relationships
        const userIds = users.map(u => u._id);
        const existingRelationships = await Collaborator.find({
            userId: req.user._id,
            collaboratorId: { $in: userIds }
        });

        const relationshipMap = {};
        existingRelationships.forEach(r => {
            relationshipMap[r.collaboratorId.toString()] = r.status;
        });

        const usersWithStatus = users.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            relationshipStatus: relationshipMap[u._id.toString()] || null
        }));

        res.json({
            success: true,
            data: { users: usersWithStatus }
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ success: false, message: 'Failed to search users' });
    }
});

module.exports = router;
