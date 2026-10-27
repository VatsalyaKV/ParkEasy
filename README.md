ParkEasy – Smart Parking Management and Reservation System
ParkEasy is a full-stack smart parking management and reservation system built with React, Vite, Node.js, Express.js, MongoDB, and Socket.IO. It helps drivers find parking facilities, reserve slots, manage vehicles, and use QR-based parking passes.

The application provides separate dashboards for drivers, parking owners, and administrators. It also includes Parking Space Handover, Smart Arrival, EcoPark rewards, notifications, and parking analytics.
Project status: Academic/demo project. The included payment flow is simulated and does not process real payments.

Features
Driver Features
- User registration, login, and profile management
- Search for parking facilities and view slot availability
- Vehicle management and booking history
- Parking slot reservation
- Simulated payment flow
- QR parking passes and gate check-in/check-out
- Parking Space Handover
- Smart Arrival recommendations
- EcoPark rewards and Eco Points
- Notifications and real-time updates
Parking Owner Features
- Manage parking facilities and slots
- Configure parking prices
- View and manage reservations
- View revenue and booking analytics
Administrator Features
- Manage users, owners, parking locations, bookings, and payments
- View platform analytics and revenue information
Real-Time Features
- Socket.IO communication
- Parking status updates
- Reconnection support and location snapshots
Technology Stack
Area	Technology
Frontend	React, Vite
Styling	Tailwind CSS
Backend	Node.js, Express.js
Database	MongoDB, Mongoose
Real-time communication	Socket.IO
AI integration	Gemini API, when configured
Parking pass	QR-based verification


Project Structure
ParkEasy/
├── client/                 # React frontend
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       └── services/
├── server/                 # Express backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed/
│   ├── services/
│   └── server.js
├── package.json
├── .env.example
├── PRODUCTION_READINESS.md
└── README.md
Getting Started
Prerequisites
- Node.js and npm
- MongoDB Community Server or MongoDB Atlas
- Git
1. Clone the Repository
git clone https://github.com/VatsalyaKV/ParkEasy.git
cd ParkEasy
2. Install Dependencies
Run these commands from the project root:
npm install
npm install --prefix server
npm install --prefix client
3. Configure Environment Variables
Review the environment templates:
- .env.example
- server/.env.example
- client/.env.example
Create the local environment files required by the application and use the variable names expected by the code. For a local MongoDB instance, the database URI may look like this:
MONGODB_URI=mongodb://127.0.0.1:27017/parkeasy
PORT=5000
CLIENT_URL=http://localhost:5173
These are example values only. Check server/.env.example for the complete backend configuration. Do not commit real secrets, passwords, API keys, or production environment files.
4. Start the Backend
cd server
npm run dev
If the project does not provide a dev script, check server/package.json for the available scripts.
5. Start the Frontend
Open a second terminal from the project root:
cd client
npm run dev
Open the local URL printed by Vite, commonly http://localhost:5173.

Check the root, server/package.json, and client/package.json if a command is unavailable.
API Health Checks
The backend may expose these health endpoints, depending on the current configuration:
- GET /api/health — service health
- GET /api/ready — readiness status
Use the actual server responses to confirm service and database status.
Reliability and Security Notes
The project includes implementation intended to improve reservation consistency, access control, and error handling. Test these behaviors in your own environment before relying on them in production.
- Slot reservations use database updates intended to prevent two users from reserving the same slot.
- Reservation holds can expire and release slots when payment is not completed.
- The server should calculate payment amounts from booking records rather than trusting client-submitted amounts.
- User, owner, and administrator access should be restricted according to role and resource ownership.
- Socket.IO delivers real-time updates; persisted database state should remain the source of truth.
- Configure allowed frontend origins and authentication secrets through environment variables.
- Use HTTPS and secure cookie settings when deploying publicly.
MongoDB Transactions
Full multi-document transaction support requires MongoDB Atlas or a MongoDB replica-set deployment. A standalone local MongoDB server does not support multi-document transactions. Test the application's fallback behavior in the environment you intend to use.
Payment Limitation
The included payment gateway is simulated/test-only and does not transfer real money. Before accepting real payments, integrate a payment provider and implement server-side payment verification, webhook/signature validation, idempotency, and reconciliation.
Scaling Limitations
- An in-memory rate limiter is suitable for a single-server demo; distributed deployments need a shared store.
- Multi-instance Socket.IO deployments may need a shared adapter.
- Physical parking sensors, cameras, number-plate recognition, and boom barriers are not connected unless separately integrated.
Testing Checklist
Use this checklist to test the application manually:
- [ ] Register and log in
- [ ] Add a vehicle
- [ ] Search for a parking facility
- [ ] View available slots
- [ ] Create a reservation
- [ ] Complete a simulated payment
- [ ] Open the QR parking pass
- [ ] Check in and verify the slot state
- [ ] Check out and verify the slot state
- [ ] Check booking history and notifications
- [ ] Verify Eco Points behavior
- [ ] Test simultaneous reservation attempts for the same slot
- [ ] Test expired payment holds
- [ ] Test access to another user's booking
- [ ] Test owner access to facilities they do not own
- [ ] Disconnect and reconnect Socket.IO and verify the latest state
These are suggested test steps, not a claim that every test has passed.
ParkEasy AI and Location Setup
AI and location features require the relevant integrations and configuration.
1. Review server/.env.example.
2. Add GEMINI_API_KEY to server/.env if the backend AI feature requires it.
3. Keep the API key on the server. Do not put it in frontend code or commit it to Git.
4. Allow browser location access when using location-based parking search.
5. Ensure parking facilities have valid location data for distance-based results.
Feature availability depends on environment configuration, permissions, and the implementation in the repository.
Known Limitations
1. Payments are simulated; no real payment provider is connected by default.
2. Physical sensors and gate hardware are not connected by default.
3. Live availability depends on application data unless a physical integration is implemented.
4. Production deployment requires environment-specific security and scaling configuration.
5. Run dependency installation, a production build, and functional tests locally before presenting or deploying the application.
Future Enhancements
- Real payment gateway integration
- Physical parking sensor and IoT integration
- Automatic number plate recognition
- Smart gate and boom-barrier integration
- Improved arrival-time and availability prediction
- Expanded EV charging support
- Cloud deployment, monitoring, and automated testing
Author
Vatsalya K V
B.Tech – Computer Science and Engineering

GitHub: VatsalyaKV
Repository
https://github.com/VatsalyaKV/ParkEasy
License
No license is currently specified. Add a LICENSE file if you want to define the terms under which others may use, modify, or distribute this project.