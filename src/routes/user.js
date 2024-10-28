// src/routes/user.js
import express from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/index.js';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import isAdmin from '../middleware/middleware.js'

const router = express.Router();
const dbConnection = mysql.createPool(dbConfig);

// User registration endpoint
router.post('/register', 
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phone').optional().notEmpty().withMessage('Phone number is required'),
    body('type_of_institution').notEmpty().withMessage('Type of institution is required'),
    body('affiliation').optional().notEmpty().withMessage('Affiliation is required'),
    body('programming_language').optional().notEmpty().withMessage('Preferred programming language is required'),
    body('preferred_ide').optional().notEmpty().withMessage('Preferred IDE is required'),
    body('mentor_details').optional().notEmpty().withMessage('Mentor details are required'),
    body('is_admin').optional().isBoolean().withMessage('is_admin must be a boolean value'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { name, email, password, phone, type_of_institution, affiliation, programming_language, preferred_ide, mentor_details, is_admin } = req.body;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            // Set is_admin to 0 if not provided
            const adminStatus = is_admin ? 1 : 0; 
            const [result] = await dbConnection.execute(
                'INSERT INTO Users (name, email, password_hash, phone, type_of_institution, affiliation, programming_language, preferred_ide, mentor_details, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, email, hashedPassword, phone, type_of_institution, affiliation, programming_language, preferred_ide, mentor_details, adminStatus]
            );
            res.status(201).json({ message: 'User registered successfully', user_id: result.insertId });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'User registration failed', error });
        }
    }
);

// Update user profile endpoint
router.patch('/profile/update', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const updates = req.body; // Get all fields from request body
    const validFields = ['name', 'email', 'phone', 'type_of_institution', 'affiliation', 'programming_language', 'preferred_ide', 'mentor_details', 'is_admin'];

    // Check for valid fields
    const keys = Object.keys(updates);
    const hasInvalidFields = keys.some(key => !validFields.includes(key));

    if (hasInvalidFields) {
        return res.status(400).json({ message: 'Invalid fields provided', invalidFields: keys.filter(key => !validFields.includes(key)) });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const updateQueries = keys.map(key => `${key} = ?`).join(', ');
        const updateValues = keys.map(key => updates[key]);

        // Set is_admin to 0 if not provided
        if (updates.is_admin !== undefined) {
            updateValues.push(updates.is_admin ? 1 : 0); 
        }

        updateValues.push(decoded.user_id);

        await dbConnection.execute(
            `UPDATE Users SET ${updateQueries} WHERE user_id = ?`,
            updateValues
        );

        res.status(200).json({ message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Failed to update profile', error });
    }
});


// User login endpoint
router.post('/login', 
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const [user] = await dbConnection.execute('SELECT * FROM Users WHERE email = ?', [email]);
            if (user.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const isPasswordValid = await bcrypt.compare(password, user[0].password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Include is_admin in the token payload
            const token = jwt.sign({ user_id: user[0].user_id, is_admin: user[0].is_admin }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.status(200).json({ token, user_id: user[0].user_id, message: 'Login successful' });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Login failed', error });
        }
    }
);


// Get user profile endpoint
router.get('/profile', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [user] = await dbConnection.execute('SELECT * FROM Users WHERE user_id = ?', [decoded.user_id]);

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user[0]); // Return user profile details
    } catch (error) {
        console.error('Profile retrieval error:', error);
        res.status(500).json({ message: 'Failed to retrieve profile', error });
    }
});



// List all users (Admin only)
router.get('/list', isAdmin, async (req, res) => {
    try {
        const [users] = await dbConnection.execute('SELECT * FROM Users');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error retrieving user list:', error);
        res.status(500).json({ message: 'Failed to retrieve users', error });
    }
});



// Delete user endpoint (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
    const userId = req.params.id; // Get user ID from the URL

    try {
        const [result] = await dbConnection.execute('DELETE FROM Users WHERE user_id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete user', error });
    }
});


export default router;
