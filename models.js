const mongoose = require('mongoose');

// --- Blueprint for a Staff Member ---
const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// --- Blueprint for a Bus ---
const BusSchema = new mongoose.Schema({
    busNumber: { type: String, required: true, unique: true }, // The unique key is busNumber
    seats: { type: Number, default: 40 },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
    assignedRoute: { type: String, default: null }
});

// --- Blueprint for a Route ---
const RouteSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    polyline: { type: Array, required: true },
    stops: [ // An array of stop objects
        {
            name: String,
            lat: Number,
            lng: Number
        }
    ],
    // Field for ETA calculation, defaulting to 30 km/h
    averageSpeed: { type: Number, default: 30 }
});

const UserSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    // These fields are optional and can be filled in later from the profile page
    email: { type: String, unique: true, sparse: true }, // sparse allows multiple null emails
    address: { type: String },
    emergencyContact: {
        name: String,
        phone: String
    },
    dob: { type: Date },
    gender: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Route = mongoose.model('Route', RouteSchema);
const Bus = mongoose.model('Bus', BusSchema);
const Staff = mongoose.model('Staff', StaffSchema);
const User = mongoose.model('User', UserSchema);

module.exports = { Route, Bus, Staff, User };