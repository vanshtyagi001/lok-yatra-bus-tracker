# Travel Saathi: A Real-Time Public Transport Ecosystem

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-travelsaathi.vercel.app-2563EB?style=for-the-badge&logo=vercel&logoColor=white)](https://travelsaathi.vercel.app/)
[![Watch Video](https://img.shields.io/badge/Watch_Video-Demo_Tour-E4405F?style=for-the-badge&logo=google-drive&logoColor=white)](https://drive.google.com/file/d/17YNZPYkkkY7wxMgwtxNKTOAddkmbMG0j/view?usp=drive_link)

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

</div>

---

## 📖 Overview

**Travel Saathi** (formerly Lok Yatra) is a full-stack, real-time logistics and public transit ecosystem designed to modernize public bus networks in emerging smart cities. The platform bridges the information gap between transit administrators, bus staff (conductors), and commuters by offering live GPS tracking, dynamic ETA predictions, and responsive admin management panels.

This project is built using pure **Vanilla JavaScript**, **Leaflet.js**, **Express**, **Socket.IO**, and **MongoDB**—demonstrating how a performant, dependency-light, and real-time application can be engineered from scratch without bulky frontend frameworks.

---

## ✨ Core Features

### 🚶 Passenger Portal
* **Secure Phone-Based Auth**: Passwordless login using a phone number with automatic account creation.
* **Intelligent Search & Autocomplete**: Location search with station autocompletion and a quick endpoints-swap action.
* **Live Commuter Dashboard**: Visualizes the chosen route, list of active buses, live positions, and ETA info.
* **Geospatial ETA Engine**: Employs mathematical algorithms and **Turf.js** to dynamically calculate the bus's ETA based on live positions.
* **Network Overview Map**: Includes a full Leaflet map illustrating all available routes in the city.
* **Official Survey of India Map Boundary**: Features a custom-rendered GeoJSON overlay that correctly and officially represents India's complete boundaries (including Jammu & Kashmir).
* **Emergency SOS System**: A press-and-hold SOS trigger that automatically dispatches emergency alerts containing the user's name and contact information.

### 👨✈️ Staff Portal (Bus Conductors)
* **Conductor Dashboard**: Automatically reads authorization details to identify the active conductor and their assigned vehicle.
* **Conductor GPS Control**: Features an explicit **Start Live Tracking** trigger, ensuring staff retain full visibility and control over when their location is broadcasted.
* **Location Smoothing & Filtering**: Filters high-frequency noise and GPS jumps using custom rolling averages, sending clean geographic signals to the server.

### ⚙️ Administrator Portal
* **Unified Control Center**: A single-page dashboard featuring CRUD management of routes, buses, and staff.
* **Dual-Mode Route Designer**:
  - **Manual Drafting**: Plot path coordinates directly onto the Leaflet map.
  - **Auto-Routing API**: Generate optimal driving paths between selected stops automatically using the **OpenRouteService API**.
* **Live Overview Map**: Visualizes the entire system network, allowing admins to highlight individual routes and view live bus performance.
* **Secure Navigation**: Serves dashboard views (`/admin`) privately by validating cookies and JWT roles.

---

## 🏗️ Technical Architecture & Security

```
                                  +-------------------+
                                  | Passenger Browser |
                                  +---------+---------+
                                            ^ (WebSockets / HTTP)
                                            v
+-------------------+ HTTP/WS     +---------+---------+     MongoDB      +------------------+
| Conductor Browser +-------------> Express Server +------------------> Mongoose database |
+-------------------+             +---------+---------+                  +------------------+
                                            ^ (WebSockets / HTTP)
                                            v
                                  +---------+---------+
                                  |  Admin Dashboard  |
                                  +-------------------+
```

### 🔒 Security Best Practices
- **Folder Protection**: Admin control templates are isolated under `/private` and cannot be accessed statically.
- **JWT Middleware**: Requests to `/admin` are intercepted by a backend routing guard validating an HTTP-Only, Secure, and SameSite token.
- **Bcrypt Hashing**: Staff credentials and credentials stored in DB are fully hashed using a 10-round salt.

---

## 🛠️ Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Leaflet.js | Lightweight, framework-less, fast SPA/MPA render |
| **Backend** | Node.js, Express.js | Modular API routers and secure static page serving |
| **Database** | MongoDB, Mongoose ODM | Local persistence for routes, buses, users, and staff |
| **Real-Time** | Socket.IO | Bi-directional WebSocket syncing of live GPS locations |
| **Geospatial** | Turf.js, OpenRouteService API | Path calculation, ETA estimation, and automated route drawing |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) (running locally on port `27017`)

### Installation & Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/vanshtyagi001/bus-tracker.git
   cd bus-tracker
   ```

2. **Install node dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database connection
   MONGO_URI=mongodb://localhost:27017/bus-tracker

   # JWT signing key
   JWT_SECRET=your_jwt_signing_secret_key

   # Dashboard access credentials
   ADMIN_PASSWORD=admin123

   # OpenRouteService API key (Optional: used for admin auto-route creation)
   ORS_API_KEY=your_openrouteservice_key_here
   ```

4. **Seed initial database entries (Routes, Buses, Staff)**
   ```bash
   node seed.js
   ```

5. **Launch the platform server**
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your browser.

---

## 📁 Repository Structure

```
.
├── middleware/
│   └── auth.js                 # JWT verification guards
├── models.js                   # Mongoose schemas (Route, Bus, Staff, User)
├── private/
│   └── admin.html              # Secure Admin control panel
├── public/
│   ├── components/
│   │   ├── footer.html         # Reusable HTML footer
│   │   └── navbar.html         # Reusable HTML header
│   ├── images/                 # Static graphical assets (Favicons, markers, logos)
│   ├── admin-login.html        # Admin authentication page
│   ├── bus.html                # Conductor GPS tracking tool
│   ├── emergency.html          # Commuter Emergency SOS layout
│   ├── homepage.html           # Commuter route finder & search inputs
│   ├── index.html              # Conductor & Passenger main gateway page
│   ├── map-boundary.js         # Custom Survey of India GeoJSON outline handler
│   ├── navbar.js               # Dynamic navbar component loader
│   ├── profile.html            # Commuter profile settings panel
│   ├── route-map.html          # Full transit network Leaflet viewer
│   └── tracking.html           # Real-time passenger live tracking display
├── routes/
│   ├── admin.js                # WebSocket & API route controllers for admin panels
│   ├── staff.js                # Conductor database endpoints
│   └── user.js                 # Passenger authentication endpoints
├── utils/
│   └── etaCalculator.js        # Turf.js-based dynamic ETA calculations
├── seed.js                     # Utility database populator
├── server.js                   # Node HTTP & Socket.IO server startup
├── package.json
└── README.md
```

---

## 🤝 Contributing

We welcome open-source contributions! If you have suggestions or would like to add features:
1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
