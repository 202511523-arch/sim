const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Invitation = require('../models/Invitation');
const ProjectMember = require('../models/ProjectMember');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { isProjectOwner, canEditProject } = require('../middleware/permission');
const emailService = require('../services/email');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * POST /api/projects/:projectId/invite
 * Send invitation to email
 */
router.post('/projects/:projectId/invite', authenticate, canEditProject, [
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['editor', 'viewer']),
    body('message').optional().isLength({ max: 500 }),
    validate
], async (req, res) => {
    try {
        const { email, role, message } = req.body;
        const projectId = req.params.projectId;

        // Check if user is already a member
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const existingMember = await ProjectMember.findOne({
                projectId,
                userId: existingUser._id
            });

            if (existingMember) {
                return res.status(400).json({
                    success: false,
                    message: 'User is already a member of this project'
                });
            }
        }

        // Check for existing pending invitation
        const existingInvite = await Invitation.findOne({
            projectId,
            email,
            status: 'pending'
        });

        if (existingInvite) {
            return res.status(400).json({
                success: false,
                message: 'An invitation has already been sent to this email'
            });
        }

        const project = await Project.findById(projectId);

        // Create invitation
        const invitation = await Invitation.create({
            projectId,
            invitedBy: req.user._id,
            email,
            role,
            message: message || ''
        });

        // Send invitation email
        try {
            await emailService.sendProjectInvitation(
                email,
                req.user.name,
                project.name,
                role,
                invitation.token,
                message
            );
        } catch (emailError) {
            console.error('Failed to send invitation email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            data: { invitation }
        });
    } catch (error) {
        console.error('Send invitation error:', error);
        res.status(500).json({ success: false, message: 'Failed to send invitation' });
    }
});

/**
 * GET /api/projects/:projectId/invitations
 * Get pending invitations for a project
 */
router.get('/projects/:projectId/invitations', authenticate, canEditProject, async (req, res) => {
    try {
        const invitations = await Invitation.find({
            projectId: req.params.projectId,
            status: 'pending'
        })
            .populate('invitedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { invitations }
        });
    } catch (error) {
        console.error('Get invitations error:', error);
        res.status(500).json({ success: false, message: 'Failed to get invitations' });
    }
});

/**
 * GET /api/invitations/my/pending
 * Get current user's pending invitations
 * 🔴 MUST BE BEFORE /:token route!
 */
router.get('/my/pending', authenticate, async (req, res) => {
    try {
        const invitations = await Invitation.find({
            email: req.user.email,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        })
            .populate('projectId', 'name category thumbnail')
            .populate('invitedBy', 'name avatar')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { invitations }
        });
    } catch (error) {
        console.error('Get my invitations error:', error);
        res.status(500).json({ success: false, message: 'Failed to get invitations' });
    }
});

/**
 * DELETE /api/invitations/:id
 * Cancel invitation
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id);

        if (!invitation) {
            return res.status(404).json({ success: false, message: 'Invitation not found' });
        }

        // Check if user can cancel (project owner/editor or inviter)
        const canEdit = await ProjectMember.canEdit(invitation.projectId, req.user._id);
        const isInviter = invitation.invitedBy.toString() === req.user._id.toString();

        if (!canEdit && !isInviter) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        invitation.status = 'cancelled';
        await invitation.save();

        res.json({
            success: true,
            message: 'Invitation cancelled'
        });
    } catch (error) {
        console.error('Cancel invitation error:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel invitation' });
    }
});

/**
 * GET /api/invitations/:token
 * Get invitation details by token (for accepting)
 */
router.get('/:token', async (req, res) => {
    try {
        const invitation = await Invitation.findValidByToken(req.params.token);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired invitation'
            });
        }

        res.json({
            success: true,
            data: {
                invitation: {
                    projectName: invitation.projectId.name,
                    projectCategory: invitation.projectId.category,
                    invitedBy: invitation.invitedBy.name,
                    invitedByAvatar: invitation.invitedBy.avatar,
                    role: invitation.role,
                    message: invitation.message,
                    expiresAt: invitation.expiresAt
                }
            }
        });
    } catch (error) {
        console.error('Get invitation error:', error);
        res.status(500).json({ success: false, message: 'Failed to get invitation' });
    }
});

/**
 * POST /api/invitations/:token/accept
 * Accept invitation
 */
router.post('/:token/accept', authenticate, async (req, res) => {
    try {
        const invitation = await Invitation.findValidByToken(req.params.token);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired invitation'
            });
        }

        // Check if already a member
        const existingMember = await ProjectMember.findOne({
            projectId: invitation.projectId._id,
            userId: req.user._id
        });

        if (existingMember) {
            // Just update status and return
            await invitation.accept(req.user._id);
            return res.json({
                success: true,
                message: 'You are already a member of this project',
                data: {
                    projectId: invitation.projectId._id,
                    projectCategory: invitation.projectId.category
                }
            });
        }

        // Add as member
        await ProjectMember.create({
            projectId: invitation.projectId._id,
            userId: req.user._id,
            role: invitation.role,
            addedBy: invitation.invitedBy._id
        });

        // Update invitation
        await invitation.accept(req.user._id);

        res.json({
            success: true,
            message: 'Invitation accepted! You can now access the project.',
            data: {
                projectId: invitation.projectId._id,
                projectCategory: invitation.projectId.category
            }
        });
    } catch (error) {
        console.error('Accept invitation error:', error);
        res.status(500).json({ success: false, message: 'Failed to accept invitation' });
    }
});

/**
 * POST /api/projects/:projectId/share-link
 * Generate shareable link
 */
router.post('/projects/:projectId/share-link', authenticate, canEditProject, [
    body('role').isIn(['editor', 'viewer']),
    body('expiresInDays').optional().isInt({ min: 1, max: 30 }),
    validate
], async (req, res) => {
    try {
        const { role, expiresInDays = 7 } = req.body;
        const projectId = req.params.projectId;

        // Check for existing valid share link
        let invitation = await Invitation.findOne({
            projectId,
            email: 'link-share@simvex.com',
            status: 'pending',
            expiresAt: { $gt: new Date() }
        });

        if (!invitation) {
            invitation = await Invitation.create({
                projectId,
                invitedBy: req.user._id,
                email: 'link-share@simvex.com', // Placeholder for link shares
                role,
                expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            });
        }

        // Ensure CLIENT_URL is correct, fallback to request origin if needed
        const clientUrl = process.env.CLIENT_URL ||
            (req.get('origin') ? req.get('origin') : `https://${req.get('host')}`);

        const shareLink = `${clientUrl}/invite.html?token=${invitation.token}`;

        res.json({
            success: true,
            data: {
                shareLink,
                token: invitation.token,
                expiresAt: invitation.expiresAt
            }
        });
    } catch (error) {
        console.error('Generate share link error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate share link' });
    }
});

module.exports = router;
