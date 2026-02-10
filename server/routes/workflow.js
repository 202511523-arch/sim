const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const WorkflowEvent = require('../models/WorkflowEvent');
const { authenticate } = require('../middleware/auth');
const { hasProjectAccess } = require('../middleware/permission');

const Workflow = require('../models/Workflow');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/workflow/project/:projectId/list
 * Get all workflows for a project
 */
router.get('/project/:projectId/list', authenticate, hasProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const workflows = await Workflow.find({ project: projectId })
            .select('name description updatedAt createdAt createdBy nodes connections')
            .populate('createdBy', 'name')
            .sort({ updatedAt: -1 });

        res.json({ success: true, data: workflows });
    } catch (error) {
        console.error('List workflows error:', error);
        res.status(500).json({ success: false, message: 'Failed to list workflows' });
    }
});

/**
 * GET /api/workflow/:id
 * Get a single workflow by ID
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const workflow = await Workflow.findById(req.params.id)
            .populate('project', 'name ownerId');

        if (!workflow) {
            return res.status(404).json({ success: false, message: 'Workflow not found' });
        }

        // Basic check: if project is private, user must be member (omitted for brevity/dev mode)

        res.json({ success: true, data: workflow });
    } catch (error) {
        console.error('Get workflow error:', error);
        res.status(500).json({ success: false, message: 'Failed to get workflow' });
    }
});

/**
 * POST /api/workflow
 * Create a new workflow
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, projectId, description } = req.body;

        const workflow = await Workflow.create({
            name,
            project: projectId,
            description,
            createdBy: req.user._id,
            nodes: [],
            connections: []
        });

        res.status(201).json({ success: true, data: workflow });
    } catch (error) {
        console.error('Create workflow error:', error);
        res.status(500).json({ success: false, message: 'Failed to create workflow' });
    }
});

/**
 * PUT /api/workflow/:id
 * Update a workflow
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { name, description, nodes, connections } = req.body;

        const workflow = await Workflow.findById(req.params.id);
        if (!workflow) {
            return res.status(404).json({ success: false, message: 'Workflow not found' });
        }

        if (name) workflow.name = name;
        if (description) workflow.description = description;
        if (nodes) workflow.nodes = nodes;
        if (connections) workflow.connections = connections;

        await workflow.save();

        res.json({ success: true, data: workflow });
    } catch (error) {
        console.error('Update workflow error:', error);
        res.status(500).json({ success: false, message: 'Failed to update workflow', error: error.message });
    }
});

/**
 * DELETE /api/workflow/:id
 * Delete a workflow
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const workflow = await Workflow.findById(req.params.id);
        if (!workflow) {
            return res.status(404).json({ success: false, message: 'Workflow not found' });
        }

        // Optional: Check if user is the creator or has admin access
        // if (workflow.createdBy.toString() !== req.user._id.toString()) {
        //     return res.status(403).json({ success: false, message: 'Not authorized to delete this workflow' });
        // }

        await Workflow.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Workflow deleted successfully' });
    } catch (error) {
        console.error('Delete workflow error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete workflow' });
    }
});

/**
 * GET /api/workflow/:projectId
 * Get workflow events for a project
 */
router.get('/:projectId', authenticate, hasProjectAccess, [
    query('limit').optional().isInt({ min: 1, max: 500 }),
    query('eventType').optional().isString(),
    validate
], async (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit = 100, eventType } = req.query;

        const query = { projectId };
        if (eventType) query.eventType = eventType;

        const events = await WorkflowEvent.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: { events }
        });
    } catch (error) {
        console.error('Get workflow events error:', error);
        res.status(500).json({ success: false, message: 'Failed to get workflow events' });
    }
});

/**
 * POST /api/workflow/:projectId
 * Log a workflow event
 */
router.post('/:projectId', authenticate, hasProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { eventType, description, metadata } = req.body;

        if (!eventType) {
            return res.status(400).json({ success: false, message: 'Event type required' });
        }

        const event = await WorkflowEvent.create({
            projectId,
            userId: req.user._id,
            eventType,
            description: description || '',
            metadata: metadata || {}
        });

        res.status(201).json({
            success: true,
            data: { event }
        });
    } catch (error) {
        console.error('Log workflow event error:', error);
        res.status(500).json({ success: false, message: 'Failed to log workflow event' });
    }
});

/**
 * GET /api/workflow/:projectId/timeline
 * Get formatted timeline with aggregated events
 */
router.get('/:projectId/timeline', authenticate, hasProjectAccess, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { days = 7 } = req.query;

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(days));

        const events = await WorkflowEvent.find({
            projectId,
            createdAt: { $gte: cutoff }
        })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });

        // Group by date
        const timeline = {};
        events.forEach(event => {
            const dateKey = event.createdAt.toISOString().split('T')[0];
            if (!timeline[dateKey]) {
                timeline[dateKey] = [];
            }
            timeline[dateKey].push({
                _id: event._id,
                time: event.createdAt,
                type: event.eventType,
                user: event.userId.name,
                description: event.description,
                metadata: event.metadata
            });
        });

        res.json({
            success: true,
            data: { timeline }
        });
    } catch (error) {
        console.error('Get timeline error:', error);
        res.status(500).json({ success: false, message: 'Failed to get timeline' });
    }
});

module.exports = router;
