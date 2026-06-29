// Load environment variables from .env file
require('dotenv').config();

// Core Node.js modules
const http = require('http');
const path = require('path');

// NPM packages
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const axios = require('axios');

// Local module imports
const { Route, Bus } = require('./models');
const setupAdminSocketListeners = require('./routes/admin');
const staffApiRouter = require('./routes/staff');
const userApiRouter = require('./routes/user'); // This line already exists, which is great.
const smsApiRouter = require('./routes/sms');
const { calculateETAs } = require('./utils/etaCalculator');

// --- Server & App Initialization ---
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// --- Constants and Configuration ---
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bus-tracker';
const ORS_API_KEY = process.env.ORS_API_KEY;

// --- Database Connection ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('Successfully connected to local MongoDB.'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// --- Body Parser Middleware ---
app.use(express.json());

// --- Custom Cookie Parser Middleware ---
app.use((req, res, next) => {
    const cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            if (parts[0]) {
                cookies[parts[0].trim()] = (parts[1] || '').trim();
            }
        });
    }
    req.cookies = cookies;
    next();
});

// --- Admin Authentication Check Middleware ---
const adminAuth = (req, res, next) => {
    const token = req.cookies.adminToken;
    if (!token) {
        return res.redirect('/admin/login');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'admin') {
            next();
        } else {
            res.redirect('/admin/login');
        }
    } catch (err) {
        res.redirect('/admin/login');
    }
};

// Route for serving the admin page securely
app.get(['/admin', '/admin.html'], adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

// Route for serving the admin login page
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// API for Admin Login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password === adminPassword) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: false, // Set to true if HTTPS
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        return res.json({ success: true });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// API for Admin Logout
app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('adminToken');
    return res.json({ success: true });
});

// --- Middleware Setup ---
app.use(express.static('public', { extensions: ['html'] }));

// --- API Endpoints ---

// Handles staff login and fetching staff data
app.use('/api/staff', staffApiRouter);

// --- THIS IS THE FIX ---
// Handles user (passenger) login
app.use('/api/user', userApiRouter);
// --- END OF FIX ---

// SMS location updates — inject io and busLocations via middleware
app.use('/api/sms', (req, res, next) => {
    req.io = io;
    req.busLocations = busLocations;
    next();
}, smsApiRouter);

// Lightweight ping for heartbeat checks
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Config endpoint for frontend to fetch SMS server number
app.get('/api/config/sms-number', (req, res) => {
    res.json({ phoneNumber: process.env.SMS_SERVER_PHONE || '' });
});


// Provides all routes to the passenger frontend
app.get('/api/routes', async (req, res) => {
    try {
        const routes = await Route.find();
        res.json(routes);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching routes' });
    }
});

app.get('/api/route/:id', async (req, res) => {
    try {
        const { id } = req.params; // Get the id from the URL, e.g., /api/route/route_12345
        const route = await Route.findOne({ id: id });

        if (!route) {
            return res.status(404).json({ message: 'Route not found.' });
        }
        res.json(route);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching route data' });
    }
});

// Provides automatic route generation for the admin panel
app.post('/api/autoroute', async (req, res) => {
    try {
        if (!ORS_API_KEY) {
            throw new Error('OpenRouteService API Key is not configured on the server.');
        }
        const { stops } = req.body;
        if (!stops || stops.length < 2) {
            return res.status(400).json({ error: 'At least two stops are required.' });
        }
        
        const coords = stops.map(stop => [stop.lng, stop.lat]);
        const orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
        const requestBody = { coordinates: coords };
        const headers = { 'Authorization': ORS_API_KEY };

        const response = await axios.post(orsUrl, requestBody, { headers });
        
        const geometry = response.data.features[0].geometry.coordinates;
        const leafletPolyline = geometry.map(coord => [coord[1], coord[0]]); // Swap lng,lat to lat,lng
        
        res.json({ polyline: leafletPolyline });

    } catch (error) {
        console.error('OpenRouteService API Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate route from OpenRouteService.' });
    }
});


// --- API: Get all active buses ---
app.get('/api/buses/active', (req, res) => {
    const activeBuses = Object.values(busLocations);
    res.json(activeBuses);
});

// --- Real-time Socket.IO Logic ---
const busLocations = {}; // In-memory store for live bus locations

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Delegate all admin-related events to the admin module
    setupAdminSocketListeners(socket, io);

    // --- NON-ADMIN EVENTS (Bus/Conductor and Passenger) ---
    
    // Handles live location updates from a bus conductor
    socket.on('updateLocation', async (data) => {
        // Find the bus by its number (busId from the client is the busNumber)
        const bus = await Bus.findOne({ busNumber: data.busId });
        if (bus && bus.assignedRoute) {
            const locationData = { ...data, routeId: bus.assignedRoute, timestamp: Date.now() };
            busLocations[data.busId] = locationData;
            
            // Emit only to passengers subscribed to this specific route
            io.to(bus.assignedRoute).emit('locationUpdate', locationData);
            // Also emit to the global live-buses room for the route map
            io.to('live-buses-global').emit('globalLocationUpdate', locationData);
        }
    });

    // Handles a passenger subscribing to a specific route's updates
    socket.on('subscribeToRoute', (routeId) => {
        socket.join(routeId);
        // Immediately send current bus locations for this route to the new subscriber
        const relevantBuses = Object.values(busLocations).filter(bus => bus.routeId === routeId);
        socket.emit('initialBusLocations', relevantBuses);
    });

    // Handles subscribing to ALL live bus updates (for route map page)
    socket.on('subscribeToAllBuses', () => {
        socket.join('live-buses-global');
        // Send all current bus locations immediately
        const allBuses = Object.values(busLocations);
        socket.emit('allBusLocations', allBuses);
    });

    socket.on('unsubscribeFromAllBuses', () => {
        socket.leave('live-buses-global');
    });

    // Handles a passenger unsubscribing from a route
    socket.on('unsubscribeFromRoute', (routeId) => {
        socket.leave(routeId);
    });

    // Handles ETA requests from a passenger
    socket.on('requestETAs', async ({ routeId, stopName }) => {
        try {
            console.log(`[ETA REQUEST] routeId: "${routeId}", stopName: "${stopName}"`);

            const route = await Route.findOne({ id: routeId });
            if (!route) {
                console.log(`[ETA REQUEST] Route NOT found for id: "${routeId}"`);
                return;
            }

            // Use robust lookup for the stop name — use .includes() for partial match
            const normalizedStopName = stopName.trim().toLowerCase();
            const passengerStop = route.stops.find(s => s.name.toLowerCase() === normalizedStopName);
            if (!passengerStop) {
                console.log(`[ETA REQUEST] Stop NOT found: "${stopName}" in route stops: [${route.stops.map(s => s.name).join(', ')}]`);
                // Fallback: try partial match (user may have typed a substring)
                const partialMatch = route.stops.find(s => s.name.toLowerCase().includes(normalizedStopName) || normalizedStopName.includes(s.name.toLowerCase()));
                if (!partialMatch) {
                    console.log(`[ETA REQUEST] Partial match also failed. Emitting empty ETAs.`);
                    socket.emit('etasUpdated', []);
                    return;
                }
                console.log(`[ETA REQUEST] Partial match found: "${partialMatch.name}" for input "${stopName}"`);
                // Use the partial match
                const busesOnRoute = Object.values(busLocations).filter(bus => bus.routeId === routeId);
                console.log(`[ETA REQUEST] Buses on route: ${busesOnRoute.length}`);
                const etas = calculateETAs(route, busesOnRoute, partialMatch);
                console.log(`[ETA REQUEST] ETAs computed:`, JSON.stringify(etas));
                socket.emit('etasUpdated', etas);
                return;
            }

            console.log(`[ETA REQUEST] Stop found: "${passengerStop.name}"`);
            const busesOnRoute = Object.values(busLocations).filter(bus => bus.routeId === routeId);
            console.log(`[ETA REQUEST] Buses on route: ${busesOnRoute.length}`);
            const etas = calculateETAs(route, busesOnRoute, passengerStop);
            console.log(`[ETA REQUEST] ETAs computed:`, JSON.stringify(etas));
            
            // Send the ETAs back ONLY to the passenger who asked for them
            socket.emit('etasUpdated', etas);
        } catch (error) {
            console.error("Error calculating ETAs:", error);
        }
    });

    // Handles user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// --- Start the Server ---
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});