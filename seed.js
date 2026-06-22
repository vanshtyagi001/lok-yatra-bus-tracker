require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { Route, Bus, Staff, User } = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bus-tracker';

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully. Cleaning up database...');

        // Clear existing data
        await Promise.all([
            Route.deleteMany({}),
            Bus.deleteMany({}),
            Staff.deleteMany({}),
            User.deleteMany({})
        ]);
        console.log('Database cleaned.');

        // Load database.json
        const dataPath = path.join(__dirname, 'database.json');
        const dbData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        // 1. Seed Routes
        console.log('Seeding routes...');
        if (dbData.routes && Array.isArray(dbData.routes)) {
            await Route.insertMany(dbData.routes);
            console.log(`Successfully seeded ${dbData.routes.length} routes.`);
        }

        // 2. Create Staff members
        console.log('Seeding staff...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const staffMembers = [
            {
                name: 'Driver One',
                username: 'driver1',
                email: 'driver1@bus.com',
                password: hashedPassword
            },
            {
                name: 'Driver Two',
                username: 'driver2',
                email: 'driver2@bus.com',
                password: hashedPassword
            },
            {
                name: 'Driver Three',
                username: 'driver3',
                email: 'driver3@bus.com',
                password: hashedPassword
            }
        ];

        const savedStaff = await Staff.insertMany(staffMembers);
        console.log(`Successfully seeded ${savedStaff.length} staff members.`);

        // 3. Seed Buses
        console.log('Seeding buses...');
        const busesToInsert = [];
        if (dbData.buses && typeof dbData.buses === 'object') {
            const busKeys = Object.keys(dbData.buses);
            for (let i = 0; i < busKeys.length; i++) {
                const busNo = busKeys[i];
                const busInfo = dbData.buses[busNo];
                
                // Assign a staff member round-robin style if available
                const assignedStaffId = savedStaff[i % savedStaff.length]._id;

                busesToInsert.push({
                    busNumber: busNo,
                    seats: 40,
                    assignedStaff: assignedStaffId,
                    assignedRoute: busInfo.routeId
                });
            }
            await Bus.insertMany(busesToInsert);
            console.log(`Successfully seeded ${busesToInsert.length} buses.`);
        }

        console.log('Database seeding completed successfully!');
    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seed();
