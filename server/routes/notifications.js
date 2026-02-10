const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/notifications
 * Get user notifications (primarily invitations)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const notifications = [];

        // 1. Pending Invitations
        const invitations = await Invitation.find({
            email: req.user.email,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        }).populate('invitedBy', 'name avatar')
            .populate('projectId', 'name');

        invitations.forEach(inv => {
            if (inv.projectId && inv.invitedBy) {
                notifications.push({
                    id: inv._id,
                    type: 'invitation',
                    title: 'Project Invitation',
                    message: `<strong>${inv.invitedBy.name}</strong> has invited you to the <strong>${inv.projectId.name}</strong> project.`,
                    time: inv.createdAt,
                    actionUrl: `/invite.html?token=${inv.token}`,
                    read: false
                });
            }
        });

        // Sort by time desc
        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({
            success: true,
            data: { notifications }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Failed to get notifications' });
    }
});

module.exports = router;
