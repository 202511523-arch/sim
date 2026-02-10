const express = require('express');
const router = express.Router();
const WorkSession = require('../models/WorkSession');
const Project = require('../models/Project');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/sessions/start
 * Start or resume a session for a project
 */
router.post('/start', authenticate, async (req, res) => {
    try {
        const { projectId, category } = req.body;

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'Project ID is required' });
        }

        // Check for an active session (updated within last 5 minutes)
        // If exists, just return it (resume)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        let session = await WorkSession.findOne({
            userId: req.user._id,
            projectId,
            lastHeartbeat: { $gt: fiveMinutesAgo }
        });

        if (!session) {
            // Create new session
            // If category not provided, try to fetch from project
            let sessionCategory = category;
            if (!sessionCategory) {
                const project = await Project.findById(projectId);
                sessionCategory = project ? project.category : 'unknown';
            }

            session = await WorkSession.create({
                userId: req.user._id,
                projectId,
                category: sessionCategory,
                startTime: new Date(),
                endTime: new Date(),
                duration: 0
            });
        } else {
            // Update hearbeat
            session.lastHeartbeat = new Date();
            // Recalculate duration just in case
            const diff = (session.lastHeartbeat - session.startTime) / 1000 / 60; // minutes
            session.duration = Math.max(0, Math.round(diff));
            session.endTime = session.lastHeartbeat;
            await session.save();
        }

        res.json({ success: true, data: { sessionId: session._id } });
    } catch (error) {
        console.error('Start session error:', error);
        res.status(500).json({ success: false, message: 'Failed to start session' });
    }
});

/**
 * POST /api/sessions/heartbeat
 * Update session duration
 */
router.post('/heartbeat', authenticate, async (req, res) => {
    try {
        const { sessionId } = req.body;

        let session;
        if (sessionId) {
            session = await WorkSession.findById(sessionId);
        } else {
            // Fallback: try to find active session by projectId if provided, or just most recent
            const { projectId } = req.body;
            if (projectId) {
                session = await WorkSession.findOne({
                    userId: req.user._id,
                    projectId
                }).sort({ lastHeartbeat: -1 });
            }
        }

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        // Verify ownership
        if (session.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Update
        const now = new Date();
        session.lastHeartbeat = now;
        session.endTime = now;

        // Duration in minutes
        const diffMs = session.endTime - session.startTime;
        session.duration = Math.max(0, Math.floor(diffMs / 1000 / 60));

        await session.save();

        res.json({ success: true, data: { duration: session.duration } });
    } catch (error) {
        console.error('Heartbeat error:', error);
        res.status(500).json({ success: false, message: 'Heartbeat failed' });
    }
});

module.exports = router;
