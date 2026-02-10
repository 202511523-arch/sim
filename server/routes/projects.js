const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Version = require('../models/Version');
const { authenticate } = require('../middleware/auth');
const { hasProjectAccess, canEditProject, isProjectOwner } = require('../middleware/permission');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/projects
 * Get all projects for current user
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { category, sort = 'updatedAt', order = 'desc', page = 1, limit = 20 } = req.query;

        // Get user's memberships
        const memberships = await ProjectMember.find({ userId: req.user._id }).select('projectId role');
        const projectIds = memberships.map(m => m.projectId);

        // Build query
        const query = { _id: { $in: projectIds } };
        if (category) query.category = category;

        // Get projects with pagination
        const projects = await Project.find(query)
            .populate('ownerId', 'name email avatar')
            .sort({ [sort]: order === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Add role info to each project
        const projectsWithRole = projects.map(project => {
            const membership = memberships.find(m => m.projectId.toString() === project._id.toString());
            return {
                ...project.toObject(),
                myRole: membership ? membership.role : null
            };
        });

        const total = await Project.countDocuments(query);

        res.json({
            success: true,
            data: {
                projects: projectsWithRole,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ success: false, message: 'Failed to get projects' });
    }
});

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', authenticate, [
    body('name').trim().notEmpty().isLength({ max: 100 }),
    body('category').isIn(['chemistry', 'engineering', 'biology', 'medical', 'earthscience']),
    body('description').optional().isLength({ max: 1000 }),
    validate
], async (req, res) => {
    try {
        const { name, category, description } = req.body;

        // Create project
        const project = await Project.create({
            name,
            category,
            description: description || '',
            ownerId: req.user._id
        });

        // Add owner as member
        await ProjectMember.create({
            projectId: project._id,
            userId: req.user._id,
            role: 'owner',
            addedBy: req.user._id
        });

        // Create initial version
        await Version.create({
            projectId: project._id,
            createdBy: req.user._id,
            name: 'Initial version',
            snapshot: project.canvasState,
            isAutoSave: false
        });

        res.status(201).json({
            success: true,
            data: { project }
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ success: false, message: 'Failed to create project' });
    }
});

/**
 * GET /api/projects/:id
 * Get project by ID
 */
router.get('/:id', authenticate, hasProjectAccess, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('ownerId', 'name email avatar')
            .populate('stats.lastEditedBy', 'name avatar');

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Get members
        const members = await ProjectMember.find({ projectId: project._id })
            .populate('userId', 'name email avatar');

        res.json({
            success: true,
            data: {
                project,
                members,
                myRole: req.projectRole
            }
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ success: false, message: 'Failed to get project' });
    }
});

/**
 * PUT /api/projects/:id
 * Update project
 */
router.put('/:id', authenticate, canEditProject, [
    body('name').optional().trim().notEmpty().isLength({ max: 100 }),
    body('description').optional().isLength({ max: 1000 }),
    body('canvasState').optional().isObject(),
    body('settings').optional().isObject(),
    validate
], async (req, res) => {
    try {
        const { name, description, canvasState, settings, tags } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (name) project.name = name;
        if (description !== undefined) project.description = description;
        if (canvasState) project.canvasState = canvasState;
        if (settings) project.settings = { ...project.settings, ...settings };
        if (tags) project.tags = tags;

        project.stats.lastEditedAt = new Date();
        project.stats.lastEditedBy = req.user._id;

        await project.save();

        res.json({
            success: true,
            data: { project }
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ success: false, message: 'Failed to update project' });
    }
});

/**
 * DELETE /api/projects/:id
 * Delete project (owner only)
 */
router.delete('/:id', authenticate, isProjectOwner, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Delete related documents
        await Promise.all([
            ProjectMember.deleteMany({ projectId: project._id }),
            Version.deleteMany({ projectId: project._id }),
            // Assets will need S3 cleanup - handled by asset service
        ]);

        await project.deleteOne();

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete project' });
    }
});

/**
 * GET /api/projects/:id/versions
 * Get project version history
 */
router.get('/:id/versions', authenticate, hasProjectAccess, async (req, res) => {
    try {
        const { includeAutoSave = false, page = 1, limit = 20 } = req.query;

        const query = { projectId: req.params.id };
        if (includeAutoSave !== 'true') {
            query.isAutoSave = false;
        }

        const versions = await Version.find(query)
            .populate('createdBy', 'name avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-snapshot'); // Don't include large snapshot data in list

        const total = await Version.countDocuments(query);

        res.json({
            success: true,
            data: {
                versions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get versions error:', error);
        res.status(500).json({ success: false, message: 'Failed to get versions' });
    }
});

/**
 * GET /api/projects/:id/versions/:versionId
 * Get specific version with snapshot
 */
router.get('/:id/versions/:versionId', authenticate, hasProjectAccess, async (req, res) => {
    try {
        const version = await Version.findOne({
            _id: req.params.versionId,
            projectId: req.params.id
        }).populate('createdBy', 'name avatar');

        if (!version) {
            return res.status(404).json({ success: false, message: 'Version not found' });
        }

        res.json({
            success: true,
            data: { version }
        });
    } catch (error) {
        console.error('Get version error:', error);
        res.status(500).json({ success: false, message: 'Failed to get version' });
    }
});

/**
 * POST /api/projects/:id/versions
 * Create new version (save point)
 */
router.post('/:id/versions', authenticate, canEditProject, [
    body('name').optional().trim().isLength({ max: 100 }),
    body('description').optional().isLength({ max: 500 }),
    body('isAutoSave').optional().isBoolean(),
    validate
], async (req, res) => {
    try {
        const { name, description, isAutoSave = false } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const version = await Version.create({
            projectId: project._id,
            createdBy: req.user._id,
            name: name || `Version ${new Date().toLocaleString()}`,
            description,
            snapshot: project.canvasState,
            isAutoSave
        });

        // Cleanup old auto-saves
        if (isAutoSave) {
            await Version.cleanupAutoSaves(project._id);
        }

        res.status(201).json({
            success: true,
            data: { version }
        });
    } catch (error) {
        console.error('Create version error:', error);
        res.status(500).json({ success: false, message: 'Failed to create version' });
    }
});

/**
 * POST /api/projects/:id/versions/:versionId/restore
 * Restore project to specific version
 */
router.post('/:id/versions/:versionId/restore', authenticate, canEditProject, async (req, res) => {
    try {
        const version = await Version.findOne({
            _id: req.params.versionId,
            projectId: req.params.id
        });

        if (!version) {
            return res.status(404).json({ success: false, message: 'Version not found' });
        }

        const project = await Project.findById(req.params.id);

        // Save current state as a version before restoring
        await Version.create({
            projectId: project._id,
            createdBy: req.user._id,
            name: `Before restore to: ${version.name}`,
            snapshot: project.canvasState,
            isAutoSave: false
        });

        // Restore
        project.canvasState = version.snapshot;
        project.stats.lastEditedAt = new Date();
        project.stats.lastEditedBy = req.user._id;
        await project.save();

        // Notify connected users
        const io = req.app.get('io');
        io.to(`project:${project._id}`).emit('canvas-update', {
            userId: req.user._id,
            userName: req.user.name,
            type: 'full-restore',
            data: project.canvasState
        });

        res.json({
            success: true,
            message: 'Project restored successfully',
            data: { project }
        });
    } catch (error) {
        console.error('Restore version error:', error);
        res.status(500).json({ success: false, message: 'Failed to restore version' });
    }
});

/**
 * GET /api/projects/:id/members
 * Get project members
 */
router.get('/:id/members', authenticate, hasProjectAccess, async (req, res) => {
    try {
        const members = await ProjectMember.find({ projectId: req.params.id })
            .populate('userId', 'name email avatar')
            .populate('addedBy', 'name');

        res.json({
            success: true,
            data: { members }
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ success: false, message: 'Failed to get members' });
    }
});

/**
 * PUT /api/projects/:id/members/:userId
 * Update member role (owner only)
 */
router.put('/:id/members/:userId', authenticate, isProjectOwner, [
    body('role').isIn(['editor', 'viewer']),
    validate
], async (req, res) => {
    try {
        const { role } = req.body;

        // Can't change owner's role
        const project = await Project.findById(req.params.id);
        if (project.ownerId.toString() === req.params.userId) {
            return res.status(400).json({ success: false, message: 'Cannot change owner role' });
        }

        const member = await ProjectMember.findOneAndUpdate(
            { projectId: req.params.id, userId: req.params.userId },
            { role },
            { new: true }
        ).populate('userId', 'name email avatar');

        if (!member) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({
            success: true,
            data: { member }
        });
    } catch (error) {
        console.error('Update member error:', error);
        res.status(500).json({ success: false, message: 'Failed to update member' });
    }
});

/**
 * DELETE /api/projects/:id/members/:userId
 * Remove member from project (owner only, or self)
 */
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        const isOwner = project.ownerId.toString() === req.user._id.toString();
        const isSelf = req.params.userId === req.user._id.toString();

        if (!isOwner && !isSelf) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        // Can't remove owner
        if (project.ownerId.toString() === req.params.userId) {
            return res.status(400).json({ success: false, message: 'Cannot remove project owner' });
        }

        const result = await ProjectMember.deleteOne({
            projectId: req.params.id,
            userId: req.params.userId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Member not found' });
        }

        res.json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove member' });
    }
});

/**
 * PUT /api/projects/:id/workspace-state
 * Save workspace state
 */
router.put('/:id/workspace-state', authenticate, hasProjectAccess, async (req, res) => {
    try {
        const { workspace, state } = req.body;

        if (!workspace) {
            return res.status(400).json({ success: false, message: 'Workspace type required' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Initialize workspaceStates if doesn't exist
        if (!project.workspaceStates) {
            project.workspaceStates = new Map();
        }

        // Save state
        project.workspaceStates.set(workspace, {
            state: state || {},
            lastModified: new Date()
        });

        await project.save();

        res.json({
            success: true,
            message: 'Workspace state saved successfully'
        });
    } catch (error) {
        console.error('Save workspace state error:', error);
        res.status(500).json({ success: false, message: 'Failed to save workspace state' });
    }
});

/**
 * GET /api/projects/:id/workspace-state
 * Get workspace state
 */
router.get('/:id/workspace-state', authenticate, hasProjectAccess, async (req, res) => {
    try {
        const { workspace } = req.query;

        if (!workspace) {
            return res.status(400).json({ success: false, message: 'Workspace type required' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const workspaceState = project.workspaceStates ? project.workspaceStates.get(workspace) : null;

        res.json({
            success: true,
            data: workspaceState || null
        });
    } catch (error) {
        console.error('Get workspace state error:', error);
        res.status(500).json({ success: false, message: 'Failed to get workspace state' });
    }
});

module.exports = router;
