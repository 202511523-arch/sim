const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Note = require('../models/Note');
const Asset = require('../models/Asset');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/dashboard/stats
 * Get aggregated dashboard statistics
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const { category } = req.query;

        // Base project query logic
        let projectQuery = { userId };

        // If category provided, we need to filter projects by category
        // But ProjectMember only has projectId. We need to find projects first.

        // 1. Get all projects I am associated with (Owner OR Member)
        const memberships = await ProjectMember.find({ userId }).select('projectId');
        const memberProjectIds = memberships.map(m => m.projectId);

        // Find projects where I am owner OR I am a member
        const allMyProjects = await Project.find({
            $or: [
                { ownerId: userId },
                { _id: { $in: memberProjectIds } }
            ]
        }).select('_id category');

        const finalProjectIds = allMyProjects.map(p => p._id);

        // Filter by category if needed
        let filteredProjectIds = finalProjectIds;
        if (category) {
            filteredProjectIds = allMyProjects
                .filter(p => p.category === category)
                .map(p => p._id);
        }

        // 2. Storage Usage (Sum of all assets uploaded by user)
        // Note: Assets usually don't have category directly, unless linked to project. 
        // For simplicity, we show total storage for now, or filter by project if possible.
        // Let's keep storage global or filter by filtered projects.
        // Assuming Asset has 'projectId'.

        const storageMatch = { uploadedBy: userId };
        if (category) {
            storageMatch.projectId = { $in: filteredProjectIds };
        }

        const storageResult = await Asset.aggregate([
            { $match: storageMatch },
            { $group: { _id: null, totalSize: { $sum: '$size' } } }
        ]);
        const totalStorageBytes = storageResult[0]?.totalSize || 0;

        // Format storage
        let storageDisplay = '0 B';
        if (totalStorageBytes < 1024) storageDisplay = totalStorageBytes + ' B';
        else if (totalStorageBytes < 1024 * 1024) storageDisplay = (totalStorageBytes / 1024).toFixed(1) + ' KB';
        else if (totalStorageBytes < 1024 * 1024 * 1024) storageDisplay = (totalStorageBytes / (1024 * 1024)).toFixed(1) + ' MB';
        else storageDisplay = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';


        // 3. Project Count
        const projectCount = filteredProjectIds.length;

        // 4. Collaborators (Unique users in filtered projects)
        const uniqueCollaborators = await ProjectMember.distinct('userId', {
            projectId: { $in: filteredProjectIds },
            userId: { $ne: userId }
        });
        const collaboratorCount = uniqueCollaborators.length;

        // 5. Work Time (Real Data from WorkSession)
        // Calculate total duration for this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const sessionMatch = {
            userId,
            startTime: { $gte: oneWeekAgo }
        };

        // If filtering by dashboard category (which maps to session category roughly)
        if (category) {
            // Note: Dashboard category might match session category directly
            sessionMatch.category = category;
        }

        const sessionResult = await require('../models/WorkSession').aggregate([
            { $match: sessionMatch },
            { $group: { _id: null, totalMinutes: { $sum: '$duration' } } }
        ]);

        const totalMinutes = sessionResult[0]?.totalMinutes || 0;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const workTimeDisplay = `${hours}h ${mins}m`;

        res.json({
            success: true,
            data: {
                storage: storageDisplay,
                projects: projectCount,
                collaborators: collaboratorCount,
                workTime: workTimeDisplay
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to get stats' });
    }
});

/**
 * GET /api/dashboard/activity
 * Get recent activity feed
 */
router.get('/activity', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const { category } = req.query;
        const limit = 10;

        // 1. Project Updates (Last edited projects)
        const myMemberships = await ProjectMember.find({ userId }).select('projectId');
        const myProjectIds = myMemberships.map(m => m.projectId);

        const projectQuery = {
            _id: { $in: myProjectIds }
        };
        if (category) {
            projectQuery.category = category;
        }

        const recentProjects = await Project.find(projectQuery)
            .sort({ 'stats.lastEditedAt': -1 })
            .limit(limit)
            .populate('stats.lastEditedBy', 'name avatar')
            .select('name stats.lastEditedAt stats.lastEditedBy');

        // 2. New Notes
        const recentNotes = await Note.find({ userId })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select('title updatedAt');

        // Combine and sort
        const activities = [];

        recentProjects.forEach(p => {
            if (p.stats && p.stats.lastEditedAt) {
                activities.push({
                    type: 'project_edit',
                    title: p.name,
                    user: p.stats.lastEditedBy || { name: 'Unknown' },
                    time: p.stats.lastEditedAt,
                    message: `modified the project`
                });
            }
        });

        recentNotes.forEach(n => {
            activities.push({
                type: 'note_edit',
                title: n.title,
                user: req.user,
                time: n.updatedAt,
                message: `created a memo`
            });
        });

        // Sort by time desc
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({
            success: true,
            data: {
                activities: activities.slice(0, limit)
            }
        });
    } catch (error) {
        console.error('Dashboard activity error:', error);
        res.status(500).json({ success: false, message: 'Failed to get activities' });
    }
});

/**
 * GET /api/dashboard/report
 * Get graph data for progress/activity (Real Data)
 */
router.get('/report', authenticate, async (req, res) => {
    try {
        const { category, timeframe = 'week' } = req.query;
        const userId = req.user._id;
        const WorkSession = require('../models/WorkSession');

        // Determine date range
        const now = new Date();
        const past = new Date();
        let days = 7;

        if (timeframe === 'month') {
            days = 30;
            past.setDate(past.getDate() - 30);
        } else {
            past.setDate(past.getDate() - 7);
        }

        const match = {
            userId,
            startTime: { $gte: past, $lte: now }
        };
        if (category) match.category = category;

        // Aggregate by day
        const sessions = await WorkSession.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
                    totalMinutes: { $sum: "$duration" }
                }
            }
        ]);

        // Fill in missing days with 0
        const labels = [];
        const dataPoints = [];

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue

            const found = sessions.find(s => s._id === dateStr);
            labels.push(dayLabel);
            // Convert to hours for the graph
            dataPoints.push(found ? Number((found.totalMinutes / 60).toFixed(1)) : 0);
        }

        res.json({
            success: true,
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Learning Hours',
                        data: dataPoints,
                        fill: true,
                        borderColor: '#4facfe',
                        backgroundColor: 'rgba(79, 172, 254, 0.2)',
                        tension: 0.4
                    }
                ]
            }
        });

    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ success: false, message: 'Failed to get report' });
    }
});

module.exports = router;
