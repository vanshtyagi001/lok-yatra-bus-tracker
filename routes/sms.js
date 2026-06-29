const express = require('express');
const { Bus } = require('../models');

const router = express.Router();

// Simple in-memory rate limiter for SMS endpoint
const smsRateLimits = {};

function smsRateLimit(req, res, next) {
    const busId = req.body.busId;
    if (!busId) return next();
    
    const now = Date.now();
    const lastUpdate = smsRateLimits[busId] || 0;
    
    if (now - lastUpdate < 5000) { // Minimum 5 seconds between updates per bus
        return res.status(429).json({ message: 'Too frequent. Wait a few seconds.' });
    }
    
    smsRateLimits[busId] = now;
    next();
}

/**
 * @route   POST /api/sms/location-update
 * @desc    Receives a parsed SMS location update from the Android receiver app
 * @access  Protected by SMS_API_SECRET
 */
router.post('/location-update', smsRateLimit, async (req, res) => {
    try {
        // 1. Validate the shared secret
        const apiSecret = req.headers['x-sms-api-secret'];
        if (apiSecret !== process.env.SMS_API_SECRET) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // 2. Extract location data
        const { busId, lat, lng, heading, timestamp } = req.body;

        // 3. Validate required fields
        if (!busId || lat === undefined || lng === undefined) {
            return res.status(400).json({ message: 'Missing required fields: busId, lat, lng' });
        }

        // 4. Validate coordinates
        if (typeof lat !== 'number' || typeof lng !== 'number' ||
            lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ message: 'Invalid coordinates' });
        }

        // 5. Look up the bus and its assigned route
        const bus = await Bus.findOne({ busNumber: busId });
        if (!bus || !bus.assignedRoute) {
            return res.status(404).json({ message: 'Bus not found or not assigned to a route' });
        }

        // 6. Build the location data object (same shape as Socket.IO updateLocation)
        const locationData = {
            busId: busId,
            lat: lat,
            lng: lng,
            heading: heading || null,
            routeId: bus.assignedRoute,
            timestamp: timestamp || Date.now(),
            source: 'sms' // Flag so we know this came via SMS
        };

        // 7. Update the in-memory bus locations store
        //    (busLocations is passed in via the module export pattern)
        if (req.busLocations) {
            req.busLocations[busId] = locationData;
        }

        // 8. Broadcast via Socket.IO to subscribed passengers
        if (req.io) {
            req.io.to(bus.assignedRoute).emit('locationUpdate', locationData);
            req.io.to('live-buses-global').emit('globalLocationUpdate', locationData);
        }

        console.log(`[SMS] Location updated for bus ${busId}: ${lat}, ${lng}`);

        res.json({ success: true, message: 'Location updated via SMS' });

    } catch (error) {
        console.error('[SMS] Error processing location update:', error);
        res.status(500).json({ message: 'Server error processing SMS location' });
    }
});

module.exports = router;
