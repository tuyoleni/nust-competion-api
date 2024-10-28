import express from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/index.js';
import { body, query, validationResult } from 'express-validator';
import isAdmin from '../middleware/middleware.js';

const router = express.Router();
const dbConnection = mysql.createPool(dbConfig);


// Create Team
router.post('/create',
    body('team_name').notEmpty().withMessage('Team name is required'),
    body('leader_id').isNumeric().withMessage('Leader ID must be a number'),
    body('school_name').notEmpty().withMessage('School name is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { team_name, leader_id, school_name } = req.body;

        try {
            const [result] = await dbConnection.execute(
                'INSERT INTO Teams (team_name, leader_id, school_name) VALUES (?, ?, ?)',
                [team_name, leader_id, school_name]
            );

            res.status(201).json({
                message: "Team created successfully.",
                team_id: result.insertId
            });
        } catch (error) {
            console.error('Error creating team:', error);
            res.status(500).json({ message: 'Failed to create team', error });
        }
    }
);

// Get Team Details
router.get('/teams/details',
    query('teamId').optional().isNumeric().withMessage('Team ID must be a number'),
    query('school_name').optional().isString().withMessage('School name must be a string'),
    async (req, res) => {
        const { teamId, school_name } = req.query;

        try {
            let query = 'SELECT * FROM Teams';
            const params = [];

            if (teamId) {
                query += ' WHERE team_id = ?';
                params.push(teamId);
            } else if (school_name) {
                query += ' WHERE school_name = ?';
                params.push(school_name);
            }

            const [teams] = await dbConnection.execute(query, params);

            if (teams.length === 0) {
                return res.status(404).json({ message: 'No teams found' });
            }

            res.status(200).json(teams);
        } catch (error) {
            console.error('Error retrieving team details:', error);
            res.status(500).json({ message: 'Failed to retrieve team details', error });
        }
    }
);

// Update Team
router.patch('/teams/:teamId/update',
    body('team_name').optional().isString().notEmpty().withMessage('Team name must be a non-empty string'),
    body('school_name').optional().isString().notEmpty().withMessage('School name must be a non-empty string'),
    async (req, res) => {
        const teamId = req.params.teamId;
        const { team_name, school_name } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        try {
            const updates = [];
            const params = [];

            if (team_name) {
                updates.push('team_name = ?');
                params.push(team_name);
            }

            if (school_name) {
                updates.push('school_name = ?');
                params.push(school_name);
            }

            if (updates.length > 0) {
                await dbConnection.execute(`UPDATE Teams SET ${updates.join(', ')} WHERE team_id = ?`, [...params, teamId]);
            }

            res.status(200).json({ message: 'Team updated successfully.' });
        } catch (error) {
            console.error('Error updating team:', error);
            res.status(500).json({ message: 'Failed to update team', error });
        }
    }
);

// Register for Competition
router.post('/registrations/register',
    body('competition_id').isNumeric().withMessage('Competition ID must be a number'),
    body('user_id').isNumeric().withMessage('User ID must be a number'),
    body('team_id').isNumeric().withMessage('Team ID must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { competition_id, user_id, team_id } = req.body;

        try {
            const [result] = await dbConnection.execute(
                'INSERT INTO Registrations (competition_id, user_id, team_id) VALUES (?, ?, ?)',
                [competition_id, user_id, team_id]
            );

            res.status(201).json({
                message: "Registration successful.",
                registration_id: result.insertId
            });
        } catch (error) {
            console.error('Error registering for competition:', error);
            res.status(500).json({ message: 'Failed to register', error });
        }
    }
);

// Deregister from Competition (Admin Only)
router.delete('/registrations/:registrationId/deregister', isAdmin, async (req, res) => {
    const registrationId = req.params.registrationId;

    try {
        const [result] = await dbConnection.execute('DELETE FROM Registrations WHERE registration_id = ?', [registrationId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        res.status(200).json({ message: "Deregistration successful." });
    } catch (error) {
        console.error('Error deregistering:', error);
        res.status(500).json({ message: 'Failed to deregister', error });
    }
});

// Update Registration Status (Admin Only)
router.patch('/registrations/:registrationId/status', isAdmin,
    body('status').isIn(['pending', 'approved', 'withdrawn']).withMessage('Status must be either pending, approved, or withdrawn'),
    async (req, res) => {
        const registrationId = req.params.registrationId;
        const { status } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        try {
            await dbConnection.execute('UPDATE Registrations SET status = ? WHERE registration_id = ?', [status, registrationId]);
            res.status(200).json({ message: 'Registration status updated successfully.' });
        } catch (error) {
            console.error('Error updating registration status:', error);
            res.status(500).json({ message: 'Failed to update registration status', error });
        }
    }
);

export default router;
