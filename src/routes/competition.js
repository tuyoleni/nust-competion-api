import express from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/index.js';
import { body, validationResult } from 'express-validator';
import isAdmin from '../middleware/middleware.js';

const router = express.Router();
const dbConnection = mysql.createPool(dbConfig);

// Create competition (Admin only)
router.post('/',
    isAdmin, // Middleware to check for admin access
    body('name').notEmpty().withMessage('Competition name is required'),
    body('description').optional().isString(),
    body('start_date').notEmpty().isISO8601().withMessage('Valid start date is required'),
    body('end_date').notEmpty().isISO8601().withMessage('Valid end date is required'),
    body('status').isIn(['upcoming', 'active', 'completed']).withMessage('Invalid status'),
    body('category').isIn(['high_school', 'tertiary']).withMessage('Invalid category'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { name, description, start_date, end_date, status, category } = req.body;

        try {
            const [result] = await dbConnection.execute(
                'INSERT INTO Competitions (name, description, start_date, end_date, status, category) VALUES (?, ?, ?, ?, ?, ?)',
                [name, description, start_date, end_date, status, category]
            );
            res.status(201).json({ message: 'Competition created successfully', competition_id: result.insertId });
        } catch (error) {
            console.error('Error creating competition:', error);
            res.status(500).json({ message: 'Failed to create competition', error });
        }
    }
);

// Get all competitions
router.get('/', async (req, res) => {
    try {
        const [competitions] = await dbConnection.execute('SELECT * FROM Competitions');
        res.status(200).json(competitions);
    } catch (error) {
        console.error('Error retrieving competitions:', error);
        res.status(500).json({ message: 'Failed to retrieve competitions', error });
    }
});

// Update competition (Admin only)
router.patch('/:id',
    isAdmin,
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601(),
    body('status').optional().isIn(['upcoming', 'active', 'completed']),
    body('category').optional().isIn(['high_school', 'tertiary']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const updates = req.body;
        const competitionId = req.params.id;
        const validFields = ['name', 'description', 'start_date', 'end_date', 'status', 'category'];
        const keys = Object.keys(updates);
        const hasInvalidFields = keys.some(key => !validFields.includes(key));

        if (hasInvalidFields) {
            return res.status(400).json({ message: 'Invalid fields provided', invalidFields: keys.filter(key => !validFields.includes(key)) });
        }

        try {
            const updateQueries = keys.map(key => `${key} = ?`).join(', ');
            const updateValues = keys.map(key => updates[key]);
            updateValues.push(competitionId);

            await dbConnection.execute(
                `UPDATE Competitions SET ${updateQueries} WHERE competition_id = ?`,
                updateValues
            );

            res.status(200).json({ message: 'Competition updated successfully' });
        } catch (error) {
            console.error('Error updating competition:', error);
            res.status(500).json({ message: 'Failed to update competition', error });
        }
    }
);

// Delete competition (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    const competitionId = req.params.id;

    try {
        const [result] = await dbConnection.execute('DELETE FROM Competitions WHERE competition_id = ?', [competitionId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Competition not found' });
        }

        res.status(200).json({ message: 'Competition deleted successfully' });
    } catch (error) {
        console.error('Error deleting competition:', error);
        res.status(500).json({ message: 'Failed to delete competition', error });
    }
});

export default router;
