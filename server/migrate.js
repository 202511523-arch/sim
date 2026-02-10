const mongoose = require('mongoose');
require('dotenv').config();
const Project = require('./models/Project');
const ProjectMember = require('./models/ProjectMember');
const connectDB = require('./config/db');

async function migrate() {
    try {
        await connectDB();
        console.log('Connected to DB');

        // 1. Update Categories
        const catMap = {
            'mechanical': 'engineering',
            'medicine': 'medical',
            'earth': 'earthscience'
        };

        for (const [oldCat, newCat] of Object.entries(catMap)) {
            const result = await Project.updateMany({ category: oldCat }, { category: newCat });
            console.log(`Updated ${result.nModified || result.modifiedCount} projects from ${oldCat} to ${newCat}`);
        }

        // 2. Fix missing memberships for owners
        const projects = await Project.find({});
        let membershipsAdded = 0;

        for (const project of projects) {
            const membership = await ProjectMember.findOne({
                projectId: project._id,
                userId: project.ownerId
            });

            if (!membership) {
                await ProjectMember.create({
                    projectId: project._id,
                    userId: project.ownerId,
                    role: 'owner',
                    addedBy: project.ownerId
                });
                membershipsAdded++;
            }
        }
        console.log(`Added ${membershipsAdded} missing memberships for owners`);

        console.log('Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
