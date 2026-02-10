const ProjectMember = require('../models/ProjectMember');
const Project = require('../models/Project');

/**
 * Check if user has access to project (any role)
 */
const hasProjectAccess = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.params.id;

        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required'
            });
        }

        const membership = await ProjectMember.findOne({
            projectId,
            userId: req.user._id
        });

        if (!membership) {
            // Check if project is public
            const project = await Project.findById(projectId);

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }

            if (!project.settings.isPublic) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this project'
                });
            }

            req.projectRole = 'viewer';
            req.project = project;
        } else {
            req.projectRole = membership.role;
            req.project = await Project.findById(projectId);
        }

        next();
    } catch (error) {
        console.error('Project access check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking project access'
        });
    }
};

/**
 * Check if user can edit project (owner or editor)
 */
const canEditProject = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.params.id;

        const canEdit = await ProjectMember.canEdit(projectId, req.user._id);

        if (!canEdit) {
            // Check if project is public (Allow public editing)
            const project = await Project.findById(projectId);
            if (project && project.settings.isPublic) {
                // Allow
                next();
                return;
            }

            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this project'
            });
        }

        next();
    } catch (error) {
        console.error('Edit permission check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking edit permission'
        });
    }
};

/**
 * Check if user is project owner
 */
const isProjectOwner = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.params.id;

        const isOwner = await ProjectMember.isOwner(projectId, req.user._id);

        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Only project owner can perform this action'
            });
        }

        next();
    } catch (error) {
        console.error('Owner check error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking owner permission'
        });
    }
};

/**
 * Check specific role (flexible)
 */
const requireRole = (...roles) => {
    return async (req, res, next) => {
        try {
            const projectId = req.params.projectId || req.params.id;
            const role = await ProjectMember.getUserRole(projectId, req.user._id);

            if (!role || !roles.includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: `This action requires one of these roles: ${roles.join(', ')}`
                });
            }

            req.projectRole = role;
            next();
        } catch (error) {
            console.error('Role check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking role'
            });
        }
    };
};

module.exports = {
    hasProjectAccess,
    canEditProject,
    isProjectOwner,
    requireRole
};
