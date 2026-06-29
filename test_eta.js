const fs = require('fs');
const { calculateETAs } = require('./utils/etaCalculator');

// Load database.json
const db = JSON.parse(fs.readFileSync('database.json'));
const route = db.routes.find(r => r.name === 'AMR-PHG');

console.log('Route stops:');
route.stops.forEach((s, idx) => {
    console.log(`[${idx}] ${s.name}: lat=${s.lat}, lng=${s.lng}`);
});

// Let's simulate a passenger at Jalandhar
const passengerStop = route.stops.find(s => s.name === 'Jalandhar');

// Let's simulate a bus at Beas (before Jalandhar, moving forward towards Jalandhar)
const busAtBeas = {
    busId: 'PB-08-DB-2908',
    lat: 31.518155,
    lng: 75.289224,
    routeId: route.id
};

console.log('\n--- Simulating Bus at Beas (Passenger at Jalandhar) ---');
const etas1 = calculateETAs(route, [busAtBeas], passengerStop);
console.log('Result ETAs:', etas1);

// Let's simulate a bus at Jalandhar Cant (after Jalandhar, moving forward towards Phagwara)
const busAtJalandharCant = {
    busId: 'PB-08-DB-2908',
    lat: 31.307362,
    lng: 75.627062,
    routeId: route.id
};

console.log('\n--- Simulating Bus at Jalandhar Cant (Passenger at Jalandhar) ---');
const etas2 = calculateETAs(route, [busAtJalandharCant], passengerStop);
console.log('Result ETAs:', etas2);
