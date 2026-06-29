require('dotenv').config();
const mongoose = require('mongoose');
const { Route } = require('./models');
const { calculateETAs } = require('./utils/etaCalculator');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bus-tracker';

async function test() {
    await mongoose.connect(MONGO_URI);
    const route = await Route.findOne({ name: 'AMR-PHG' });
    console.log('Route from DB:', {
        id: route.id,
        name: route.name,
        averageSpeed: route.averageSpeed
    });

    const passengerStop = route.stops.find(s => s.name === 'Jalandhar');
    const busAtBeas = {
        busId: 'PB-08-DB-2908',
        lat: 31.518155,
        lng: 75.289224,
        routeId: route.id
    };

    const etas = calculateETAs(route, [busAtBeas], passengerStop);
    console.log('Result ETAs from DB route:', etas);

    await mongoose.disconnect();
}

test().catch(console.error);
