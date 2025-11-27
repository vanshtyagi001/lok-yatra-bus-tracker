const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import necessary models from the models.js file
const { Staff, Bus } = require('../models');

// Import our authentication middleware
const verifyToken = require('../middleware/auth');

// Create a new router instance
const router = express.Router();

/**
 * @route   POST /api/staff/login
 * @desc    Authenticate a staff member and return a token
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Find the staff member by their unique username
        const staff = await Staff.findOne({ username });
        if (!staff) {
            // Use a generic message to prevent revealing which field was incorrect
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // 2. Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, staff.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // 3. If credentials are correct, create a JWT payload
        const payload = {
            id: staff._id,      // User's unique MongoDB ID
            name: staff.name,
            role: 'staff'       // IMPORTANT: Define the role for staff
        };

        // 4. Sign the token with the secret key, setting an expiration time
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET || 'your_default_secret', // Fallback secret for safety
            { expiresIn: '1d' } // Token is valid for 1 day
        );

        // 5. Send the successful response with the token
        res.json({ message: 'Login successful!', token });

    } catch (error) {
        console.error("Staff Login Error:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

/**
 * @route   GET /api/staff/me
 * @desc    Get the details of the currently logged-in staff member and their assigned bus
 * @access  Private (requires a valid token)
 */
router.get('/me', verifyToken, async (req, res) => {
    try {
        // req.user is attached by the verifyToken middleware after decoding the token
        const staffId = req.user.id;

        // Find the staff member's details, but exclude their password from the response for security
        const staff = await Staff.findById(staffId).select('-password');
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        // Find the bus that this staff member is currently assigned to
        const assignedBus = await Bus.findOne({ assignedStaff: staffId });

        // Send back the staff details and their assigned bus (which can be null)
        res.json({ staff, assignedBus });

    } catch (error) {
        console.error("Error fetching staff 'me' data:", error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;