const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const verifyToken = require('../middleware/auth'); // We need our security middleware

const router = express.Router();

// --- Public Route: User Login ---
// Handles POST requests to /api/user/login
router.post('/login', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        // Basic validation for the phone number
        if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({ message: 'A valid 10-digit phone number is required.' });
        }

        // 1. Find if the user already exists
        let user = await User.findOne({ phoneNumber });

        // 2. If user does NOT exist, create them with a temporary name
        if (!user) {
            console.log(`New user detected. Creating account for ${phoneNumber}`);
            // Generate temporary name: last 4 digits + 4 random chars
            const tempName = `${phoneNumber.slice(-4)}_${Math.random().toString(36).substring(2, 6)}`;
            
            user = new User({
                phoneNumber: phoneNumber,
                name: tempName
            });
            await user.save();
        }

        // 3. Create a JWT for the user (existing or new)
        const payload = {
            id: user._id,
            name: user.name,
            role: 'passenger' // IMPORTANT: Define the role
        };
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET || 'your_default_secret', 
            { expiresIn: '30d' } // Token is valid for 30 days
        );

        res.json({ message: 'Login successful!', token });

    } catch (error) {
        console.error("User Login Error:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// --- Secure Routes: Profile Management ---
// This uses router.route() to chain handlers for the same URL ('/profile') but different methods (GET, PUT)
router.route('/profile')
    // GET /api/user/profile - Fetches the logged-in user's profile
    .get(verifyToken, async (req, res) => {
        try {
            // req.user.id comes from the decoded JWT in our verifyToken middleware
            const user = await User.findById(req.user.id).select('-__v'); // Exclude the __v field
            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }
            res.json(user);
        } catch (error) {
            console.error("Get Profile Error:", error);
            res.status(500).json({ message: 'Server error fetching profile.' });
        }
    })
    // PUT /api/user/profile - Updates the logged-in user's profile
    .put(verifyToken, async (req, res) => {
        try {
            const userId = req.user.id;
            
            // These are the only fields a user is allowed to update via this endpoint
            const { name, email, address, emergencyContact, dob, gender } = req.body;

            // Basic validation for the name field
            if (!name || name.trim() === '') {
                return res.status(400).json({ message: 'Name cannot be empty.' });
            }

            const updatedData = {
                name,
                email,
                address,
                emergencyContact,
                dob,
                gender
            };

            const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { 
                new: true, // This option ensures the updated document is returned
                runValidators: true // This runs schema validators (e.g., for email uniqueness)
            }).select('-__v');

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found.' });
            }

            res.json({ message: 'Profile updated successfully!', user: updatedUser });
        } catch (error) {
            // Handle potential duplicate email error specifically
            if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
                return res.status(400).json({ message: 'This email address is already in use by another account.' });
            }
            console.error("Update Profile Error:", error);
            res.status(500).json({ message: 'Server error updating profile.' });
        }
    });

module.exports = router;