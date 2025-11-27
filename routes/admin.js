// Import necessary models and libraries
const { Route, Bus, Staff } = require('../models'); // Note the '../' to go up one directory
const bcrypt = require('bcryptjs');

// This function will be exported and called from our main server.js
function setupAdminSocketListeners(socket, io) {
    console.log('Admin listeners are being set up for socket:', socket.id);

    // This function will be called often to keep all admins in sync
    async function sendUpdatedData() {
        try {
            const routes = await Route.find();
            const buses = await Bus.find().populate('assignedStaff'); 
            const staff = await Staff.find();
            io.emit('initialData', { routes, buses, staff });
        } catch (error) {
            console.error("Error sending updated data:", error);
        }
    }

    // Listen for all admin-specific events
    socket.on('requestInitialData', async () => {
        try {
            const routes = await Route.find();
            const buses = await Bus.find().populate('assignedStaff');
            const staff = await Staff.find();
            socket.emit('initialData', { routes, buses, staff });
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    });

    // --- Route Management ---
    socket.on('createRoute', async (routeData) => {
        const newRoute = new Route({ id: `route_${Date.now()}`, ...routeData });
        await newRoute.save();
        sendUpdatedData();
    });
    socket.on('deleteRoute', async (routeId) => {
        await Route.findOneAndDelete({ id: routeId });
        await Bus.updateMany({ assignedRoute: routeId }, { $set: { assignedRoute: null } });
        sendUpdatedData();
    });

    // --- Bus Management ---
    socket.on('createBus', async (busData) => {
        const newBus = new Bus(busData);
        await newBus.save();
        sendUpdatedData();
    });
    socket.on('deleteBus', async (busId) => {
        await Bus.findByIdAndDelete(busId);
        sendUpdatedData();
    });

    // --- Staff Management ---
    socket.on('createStaff', async (staffData) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(staffData.password, salt);
        const newStaff = new Staff({ ...staffData, password: hashedPassword });
        await newStaff.save();
        sendUpdatedData();
    });
    socket.on('deleteStaff', async (staffId) => {
        await Staff.findByIdAndDelete(staffId);
        await Bus.updateMany({ assignedStaff: staffId }, { $set: { assignedStaff: null } });
        sendUpdatedData();
    });

    // --- Assignment Logic ---
    socket.on('assignStaffToBus', async ({ busId, staffId }) => {
        await Bus.findByIdAndUpdate(busId, { $set: { assignedStaff: staffId || null } });
        sendUpdatedData();
    });
    socket.on('assignRouteToBus', async ({ busId, routeId }) => {
        await Bus.findByIdAndUpdate(busId, { $set: { assignedRoute: routeId || null } });
        sendUpdatedData();
    });
}

// Export the setup function
module.exports = setupAdminSocketListeners;