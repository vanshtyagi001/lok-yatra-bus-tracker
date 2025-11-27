// Load environment variables from .env file
require('dotenv').config();

// Core Node.js modules
const http = require('http');

// NPM packages
const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const axios = require('axios');

// Local module imports
const { Route, Bus } = require('./models');
const setupAdminSocketListeners = require('./routes/admin');
const staffApiRouter = require('./routes/staff');
const userApiRouter = require('./routes/user'); // This line already exists, which is great.
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

// --- Middleware Setup ---
app.use(express.static('public'));
app.use(express.json());

// --- API Endpoints ---

// Handles staff login and fetching staff data
app.use('/api/staff', staffApiRouter);

// --- THIS IS THE FIX ---
// Handles user (passenger) login
app.use('/api/user', userApiRouter);
// --- END OF FIX ---


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
        }
    });

    // Handles a passenger subscribing to a specific route's updates
    socket.on('subscribeToRoute', (routeId) => {
        socket.join(routeId);
        // Immediately send current bus locations for this route to the new subscriber
        const relevantBuses = Object.values(busLocations).filter(bus => bus.routeId === routeId);
        socket.emit('initialBusLocations', relevantBuses);
    });

    // Handles a passenger unsubscribing from a route
    socket.on('unsubscribeFromRoute', (routeId) => {
        socket.leave(routeId);
    });

    // Handles ETA requests from a passenger
    socket.on('requestETAs', async ({ routeId, stopName }) => {
        try {
            const route = await Route.findOne({ id: routeId });
            if (!route) return;

            // Use robust lookup for the stop name
            const normalizedStopName = stopName.trim().toLowerCase();
            const passengerStop = route.stops.find(s => s.name.toLowerCase() === normalizedStopName);
            if (!passengerStop) return;

            const busesOnRoute = Object.values(busLocations).filter(bus => bus.routeId === routeId);
            const etas = calculateETAs(route, busesOnRoute, passengerStop);
            
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