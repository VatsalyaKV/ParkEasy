# 🚗 ParkEasy – Smart Parking Management & Reservation System

> **Find. Reserve. Park. Go.** 🅿️✨

**ParkEasy** is a full-stack smart parking management and reservation platform designed to make urban parking **simpler, faster, and more convenient**.

Drivers can discover nearby parking facilities, check slot availability, reserve parking spaces, manage vehicles, make simulated payments, and access **QR-based parking passes** — all through a modern web interface.

The platform also provides dedicated dashboards for **Drivers, Parking Owners, and Administrators**, along with intelligent features such as **Parking Space Handover, Smart Arrival, EcoPark rewards, notifications, and real-time parking updates**.

> 🎓 **Project Status:** Academic / Demo Project  
> 💳 **Payment Status:** Simulated/Test Payment — No real money is processed.

---

## 🌟 Why ParkEasy?

Finding parking in busy areas can be time-consuming and frustrating.

ParkEasy aims to provide a centralized platform where users can:

🔎 **Discover** nearby parking facilities  
📍 **View** parking availability and location information  
🅿️ **Reserve** a parking slot in advance  
💳 **Complete** a simulated payment  
📱 **Access** a QR parking pass  
🚘 **Manage** vehicles and bookings  
🔄 **Receive** real-time parking updates  
🌱 **Earn** Eco Points through EcoPark  
🤝 **Handover** parking spaces when leaving  
🧠 **Plan** better arrival times using Smart Arrival

---

# ✨ Key Features

## 🚘 Driver Features

- 👤 User registration, login, and profile management
- 🔎 Search and discover parking facilities
- 📍 Location-based parking discovery
- 🅿️ View available parking slots
- 📅 Reserve parking slots
- 🚗 Add and manage vehicles
- 📋 View booking history
- 💳 Simulated payment flow
- 📱 QR-based parking passes
- 🚪 QR gate check-in and check-out
- 🔄 Parking Space Handover
- 🧠 Smart Arrival recommendations
- 🌱 EcoPark rewards and Eco Points
- 🔔 Notifications
- ⚡ Real-time parking status updates

---

## 🏢 Parking Owner Features

Parking owners can manage their parking facilities through a dedicated dashboard.

- 🏗️ Create and manage parking facilities
- 🅿️ Manage parking slots
- 💰 Configure parking prices
- 📊 View reservation statistics
- 📈 Monitor revenue and booking analytics
- 📋 Manage customer reservations
- 🔄 Monitor parking availability

---

## 🛡️ Administrator Features

Administrators have centralized control over the platform.

- 👥 Manage users
- 🏢 Manage parking owners
- 📍 Manage parking locations
- 📅 Monitor bookings
- 💳 Monitor payments
- 📊 View platform analytics
- 💰 View revenue information
- 🔐 Manage platform-level operations

---

# 🚀 Smart Features

## 🔄 Parking Space Handover

Parking Space Handover allows a driver who is preparing to leave a parking facility to indicate their **expected departure time**.

Another nearby driver can then discover the upcoming parking opportunity.

**Example:**

> 🚗 Driver A is leaving at 6:30 PM  
> 📍 Driver B is nearby  
> 🔄 ParkEasy can show the upcoming parking opportunity

This helps improve parking utilization and reduces unnecessary searching.

---

## 🧠 Smart Arrival

Smart Arrival helps drivers make better parking decisions by considering available parking information and expected departures.

It can help users:

- 📍 Identify suitable parking facilities
- 🅿️ Check availability
- ⏰ Consider expected parking-space availability
- 🔀 Explore alternative parking options
- 🚗 Plan their arrival more effectively

---

## 🌱 EcoPark

EcoPark introduces a sustainability-focused reward system.

Users can earn **Eco Points** based on supported eco-friendly parking activities.

🌱 Encourages sustainable mobility  
⚡ Supports EV-oriented parking experiences  
🏆 Provides reward-based engagement  
📊 Tracks Eco Points through the user dashboard

---

# ⚡ Real-Time System

ParkEasy uses **Socket.IO** for real-time communication.

### Real-time capabilities include:

- ⚡ Parking status updates
- 🔄 Slot availability updates
- 🔌 Socket reconnection support
- 📍 Location/state snapshots
- 🔔 Real-time notifications where supported

The database remains the **source of truth**, while Socket.IO helps deliver timely updates to connected clients.

---

# 🛠️ Technology Stack

| Area | Technology |
|---|---|
| 🎨 Frontend | React + Vite |
| 💅 Styling | Tailwind CSS |
| ⚙️ Backend | Node.js + Express.js |
| 🗄️ Database | MongoDB + Mongoose |
| ⚡ Real-Time | Socket.IO |
| 🤖 AI | Gemini API, when configured |
| 📱 Parking Pass | QR-based verification |
| 🔐 Authentication | Application authentication system |

---

# 📁 Project Structure

```text
ParkEasy/
│
├── client/                         # 🎨 React Frontend
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       └── services/
│
├── server/                         # ⚙️ Express Backend
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── seed/
│   ├── services/
│   └── server.js
│
├── package.json
├── .env.example
├── PRODUCTION_READINESS.md
└── README.md
```

---

# 🚀 Getting Started

## 📋 Prerequisites

Before running ParkEasy, make sure you have:

- 🟢 **Node.js**
- 📦 **npm**
- 🍃 **MongoDB Community Server** or **MongoDB Atlas**
- 🔧 **Git**

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/VatsalyaKV/ParkEasy.git
cd ParkEasy
```

---

## 2️⃣ Install Dependencies

From the project root:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

---

## 3️⃣ Configure Environment Variables

Review the available environment templates:

```text
.env.example
server/.env.example
client/.env.example
```

Create the required local environment files using the variable names expected by the application.

For example, a local MongoDB configuration may look like:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/parkeasy
PORT=5000
CLIENT_URL=http://localhost:5173
```

> ⚠️ These are example values only.  
> Check `server/.env.example` for the complete backend configuration.

### 🔐 Important

**Never commit:**

- ❌ Database passwords
- ❌ API keys
- ❌ JWT secrets
- ❌ Production credentials
- ❌ `.env` files containing secrets

---

# ▶️ Running the Application

## 4️⃣ Start the Backend

Open a terminal:

```bash
cd server
npm run dev
```

If `npm run dev` is not available, check:

```text
server/package.json
```

for the available scripts.

---

## 5️⃣ Start the Frontend

Open a **second terminal**:

```bash
cd client
npm run dev
```

Vite will display the local development URL.

Usually:

```text
http://localhost:5173
```

Open that URL in your browser. 🌐

---

# ❤️ Application Flow

```text
👤 User
   │
   ▼
🔐 Login / Registration
   │
   ▼
🔎 Search Parking
   │
   ▼
📍 Select Parking Facility
   │
   ▼
🅿️ Choose Available Slot
   │
   ▼
📅 Create Reservation
   │
   ▼
💳 Simulated Payment
   │
   ▼
📱 QR Parking Pass
   │
   ▼
🚪 Check-In
   │
   ▼
🚗 Park
   │
   ▼
🚪 Check-Out
   │
   ▼
🌱 Eco Points / Booking History
```

---

# 🔐 Reliability & Security

ParkEasy includes implementation intended to improve reservation consistency, access control, and error handling.

### 🅿️ Reservation Safety

- Database updates are designed to prevent two users from reserving the same slot.
- Reservation/payment holds can expire.
- Expired holds can release the associated parking availability.
- Payment amounts should be calculated from server-side booking information.

### 👤 Access Control

Role-based access is used for:

- 🚗 Drivers
- 🏢 Parking Owners
- 🛡️ Administrators

Users should only be able to access resources permitted for their role and ownership.

### ⚡ Real-Time Communication

Socket.IO provides real-time updates.

However:

> 🗄️ **Persisted database state remains the source of truth.**

---

# 🗄️ MongoDB Transactions

Full multi-document transaction support requires:

- 🍃 MongoDB Atlas

or

- 🖥️ A MongoDB replica-set deployment

A standalone local MongoDB server does **not** support multi-document transactions in the same way.

Therefore, test the application's transaction/fallback behavior in the environment where you intend to run it.

---

# 💳 Payment Limitation

> ⚠️ **ParkEasy currently uses a simulated/test payment flow.**

The application does **not** transfer real money.

Before using the system for real payments, a production implementation would need:

- 💳 Real payment provider integration
- 🔐 Server-side payment verification
- 🪝 Webhook/signature validation
- 🔄 Idempotency handling
- 📊 Payment reconciliation
- 🛡️ Fraud and security controls

---

# 📡 Scaling Considerations

The current implementation is primarily intended for an academic/demo environment.

### Current limitations:

- 🧠 In-memory rate limiting is suitable for a single-server setup.
- 🌐 Distributed deployments would require a shared rate-limit store.
- ⚡ Multi-instance Socket.IO deployments may require a shared adapter.
- 🅿️ Physical parking sensors are not connected by default.
- 📷 Cameras and ANPR hardware are not connected by default.
- 🚧 Smart boom barriers are not connected by default.

---

# 🤖 AI & Location Setup

ParkEasy can use AI and location-based features when the required integrations are configured.

### 🤖 Gemini AI

1. Review:

```text
server/.env.example
```

2. Add the Gemini API key to the server environment if required:

```env
GEMINI_API_KEY=your_api_key_here
```

3. Keep the API key **on the server**.

4. Never place the API key inside frontend code.

5. Never commit the API key to GitHub. 🔐

### 📍 Location

For location-based parking discovery:

- Allow browser location permission.
- Ensure parking facilities contain valid latitude/longitude information.
- Location-based results depend on browser permissions and application configuration.

---

# 🧪 Testing Checklist

Use the following checklist when testing ParkEasy manually:

### 👤 Account

- [ ] Register a new account
- [ ] Log in
- [ ] Update profile

### 🚗 Vehicle

- [ ] Add a vehicle
- [ ] View vehicle information
- [ ] Manage vehicles

### 🅿️ Parking

- [ ] Search for a parking facility
- [ ] View available slots
- [ ] Select a parking slot
- [ ] Create a reservation

### 💳 Payment & QR

- [ ] Complete simulated payment
- [ ] Open QR parking pass
- [ ] Check in
- [ ] Verify slot state
- [ ] Check out
- [ ] Verify slot state

### 🔔 Smart Features

- [ ] Check booking history
- [ ] Check notifications
- [ ] Verify Eco Points
- [ ] Test Parking Space Handover
- [ ] Test Smart Arrival

### 🔐 Security & Reliability

- [ ] Test simultaneous reservation attempts for the same slot
- [ ] Test expired payment holds
- [ ] Attempt to access another user's booking
- [ ] Attempt unauthorized owner access
- [ ] Disconnect and reconnect Socket.IO
- [ ] Verify the latest parking state after reconnection

> 📝 These are suggested test cases and do not claim that every test has passed in every environment.

---

# ⚠️ Known Limitations

1. 💳 Payments are simulated; no real payment provider is connected by default.
2. 🅿️ Physical parking sensors are not connected by default.
3. 📷 Camera and automatic number plate recognition systems are not connected by default.
4. 🚧 Smart gates and boom barriers are not connected by default.
5. 📡 Live availability depends on application data unless physical integrations are implemented.
6. ☁️ Production deployment requires environment-specific security and scaling configuration.
7. 🧪 Production builds and functional tests should be performed before deployment.

---

# 🔮 Future Enhancements

ParkEasy can be extended with:

- 💳 Real payment gateway integration
- 📡 IoT-based parking sensors
- 📷 Automatic Number Plate Recognition (ANPR)
- 🚧 Smart gate and boom-barrier integration
- 🧠 Advanced parking availability prediction
- ⏰ Improved arrival-time prediction
- ⚡ Expanded EV charging support
- ☁️ Cloud deployment
- 📊 Advanced monitoring and analytics
- 🧪 Automated testing and CI/CD
- 🌍 Multi-city parking support
- 📱 Dedicated mobile application

---

# 🎓 Academic Project

ParkEasy was developed as a **B.Tech Computer Science and Engineering project** to demonstrate the practical application of:

- 🌐 Full-stack web development
- 🗄️ Database management
- 🔐 Authentication and authorization
- ⚡ Real-time communication
- 📱 QR-based verification
- 🤖 AI integration
- 📍 Location-based services
- 📊 Data-driven dashboards
- 🅿️ Smart parking management

The project is designed as an academic/demo implementation and should be further hardened before production use.

---

# 👨‍💻 Author

### **Vatsalya K V**

🎓 **B.Tech – Computer Science and Engineering**

🔗 **GitHub:**  
https://github.com/VatsalyaKV

📦 **Project Repository:**  
https://github.com/VatsalyaKV/ParkEasy

---

# 📜 License

**No license is currently specified.**

If you want others to legally use, modify, or distribute the project, add an appropriate `LICENSE` file to the repository.

---

<div align="center">

### 🚗 ParkEasy

**Smart Parking. Smarter Mobility. 🌱**

⭐ If you find this project interesting, consider giving it a star!

</div>