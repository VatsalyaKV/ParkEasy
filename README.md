
### Security and deployment notes

- Authentication uses an HttpOnly session cookie; the frontend no longer stores JWTs in localStorage.
- State-changing requests are restricted to configured `CLIENT_URL` origins.
- Owner/location updates use an explicit field allow-list; system-controlled fields cannot be mass-assigned.
- Socket.IO authenticates from the same server session cookie.
- Security-sensitive transaction/voucher identifiers use Node crypto instead of `Math.random()`.
- The included payment gateway remains **simulated/test-only**. Configure a real provider and server-side signature/webhook verification before accepting real money.
- The in-memory rate limiter is suitable for a single academic/demo server. For multiple backend instances, replace the limiter with Redis/BullMQ-backed infrastructure.

# ParkEasy – Rebuilt Final

ParkEasy is a React + Node/Express + MongoDB + Socket.IO smart parking management system. This rebuild **extends the existing application** rather than replacing it.

## Preserved modules

- User registration/login and role-based dashboards
- Owner parking-location and slot management
- Admin management and analytics
- Parking search and maps/location
- Vehicle management
- Slot layout and reservation
- Simulated/test payment flow
- Secure QR parking pass and gate check-in/check-out
- Parking Space Handover
- Smart Arrival
- EcoPark and Eco Points
- Notifications
- Socket.IO real-time updates
- Analytics and revenue views

## Reliability improvements

### Reservation and slot concurrency

- Slot reservation uses an atomic `Available -> Reserved` database update.
- A reservation gets a short payment hold (`PAYMENT_HOLD_MINUTES`, default 8 minutes).
- Unpaid/abandoned holds are released automatically every 30 seconds.
- Booking, payment, slot and availability updates use MongoDB transactions when the deployment supports transactions.
- Standalone local MongoDB remains supported through atomic updates and compensating cleanup.
- Stored `availableSlots` is reconciled from actual slot state after state-changing operations, so it cannot be decremented below the real number of available bays.
- Manual owner/admin actions cannot directly force a slot into `Reserved`, `Occupied` or `Handover_Pending`; those are system-controlled states.

### Payment safety

- The payable amount always comes from the server-side booking record.
- One payment record is allowed per booking.
- Concurrent/double-click payment attempts are rejected using an atomic booking state transition.
- Payment states include pending, processing, success, failed and refunded.
- Expired holds cannot be paid.
- Eco Point redemption and booking rewards are processed with the payment state change where transactions are available.
- The gateway is explicitly a **ParkEasy simulated/test gateway**. It does not move real money.

### QR and gate

- QR passes contain a cryptographically random server-generated token.
- Gate verification requires an authenticated session.
- Users can verify only their own passes; owners can verify passes belonging to their own facilities; admins can verify platform-wide.
- Check-in validates payment, booking state and the configured arrival window.
- Check-out is atomic and can only happen once.
- Slot state must match the booking before a gate transition is accepted.
- `locationId` can be supplied by a future physical gate/scanner integration to prevent a pass being used at another facility.

### Handover

- Only an active paid parking session can announce departure.
- A waiting driver claims an available handover atomically.
- Two simultaneous claims cannot both succeed.
- Departure completion atomically closes the original session and releases the slot.
- The waiting driver is notified after the slot is actually released.

### Real-time architecture

- Socket.IO remains part of the application.
- Socket connections authenticate using the same JWT identity as the API.
- Location rooms are rejoined after reconnect.
- The server can send a complete `locationSnapshot` after reconnect/room join.
- Database state remains the source of truth; Socket.IO is only the delivery/update channel.
- Slot records include `availabilitySource` (`application`, `sensor`, or `camera`) and `sensorStatus`.
- The current project does **not fake IoT/sensor data**. Default availability is application-based. Sensor/camera integration can be added later without changing the booking state model.

### Security and API reliability

- JWT authentication and role authorization are preserved.
- User booking/payment access is scoped to the authenticated user.
- Owners are restricted to their own parking locations.
- Admin routes require the admin role.
- Request body size is limited.
- Strict CORS is enabled from `CLIENT_URL`.
- Security headers are applied with Helmet when the package is available, with a built-in secure-header fallback so the project remains self-contained.
- Authentication/API rate limiting is enabled without adding a runtime dependency.
- Invalid IDs, validation errors, duplicate keys and database outages return controlled API errors.
- `/api/health` reports service/database state.
- `/api/ready` is a readiness check suitable for deployment.
- MongoDB disconnect/reconnect events are logged.
- Graceful SIGINT/SIGTERM shutdown closes Socket.IO, HTTP and MongoDB cleanly.

## Important MongoDB deployment note

For full multi-document transaction guarantees, use MongoDB Atlas or a MongoDB replica set. A standalone local MongoDB server does not support transactions. ParkEasy detects this and falls back to atomic slot/booking transitions with compensating cleanup, so the academic local setup remains usable.

## Run locally

### 1. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/parkeasy
JWT_SECRET=replace_with_at_least_32_random_characters
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
PAYMENT_HOLD_MINUTES=8
MONGO_MAX_POOL_SIZE=20
```

Start:

```bash
npm run dev
```

or:

```bash
npm start
```

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

If the frontend and backend are hosted separately, configure:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Main API checks

```text
GET /api/health
GET /api/ready
```

Expected when MongoDB is ready:

```json
{
  "ready": true,
  "database": "connected"
}
```

## End-to-end demonstration checklist

### Normal flow

- [ ] Register
- [ ] Login
- [ ] Add vehicle
- [ ] Search parking
- [ ] Open parking location
- [ ] View live application-based slot state
- [ ] Select an available slot
- [ ] Create reservation
- [ ] Verify payment amount comes from the server
- [ ] Complete simulated payment
- [ ] Open QR parking pass
- [ ] Check in
- [ ] Verify slot becomes Occupied
- [ ] Check out
- [ ] Verify slot becomes Available
- [ ] Verify notification and booking history
- [ ] Verify Eco Points update

### Concurrency and failure tests

- [ ] Two users submit the same slot at the same time — only one receives the reservation.
- [ ] Start payment twice quickly — only one payment is captured.
- [ ] Submit a fake frontend amount — server still uses `booking.finalAmount`.
- [ ] Simulate payment failure — payment becomes failed and the hold remains retryable until timeout.
- [ ] Leave payment pending for the configured hold duration — booking expires and slot returns to Available.
- [ ] Request the same handover from two users — only one claim succeeds.
- [ ] Confirm the same handover twice — only the first request completes.
- [ ] Check in the same QR twice — second request is rejected.
- [ ] Check out the same QR twice — second request is rejected.
- [ ] Try another user's booking ID — access is rejected.
- [ ] Try another owner's location — owner access is rejected.
- [ ] Disconnect Socket.IO — reconnect and verify the latest slot snapshot is restored from the backend.
- [ ] Stop MongoDB — readiness changes to unavailable and API failures are controlled.

## Files changed in this rebuild

### Backend

- `server/server.js`
- `server/config/db.js`
- `server/middleware/auth.js`
- `server/middleware/errorHandler.js`
- `server/middleware/security.js`
- `server/services/parkingState.js`
- `server/controllers/bookingController.js`
- `server/controllers/paymentController.js`
- `server/controllers/handoverController.js`
- `server/controllers/slotController.js`
- `server/controllers/notificationController.js`
- `server/controllers/adminController.js`
- `server/controllers/ownerController.js`
- `server/models/Booking.js`
- `server/models/ParkingSlot.js`
- `server/models/Payment.js`
- `server/models/HandoverRequest.js`
- `server/models/ParkingLocation.js`
- `server/models/Notification.js`
- `server/routes/bookingRoutes.js`
- `server/.env.example`

### Frontend

- `client/src/services/socket.js`
- `client/src/context/SocketContext.jsx`

### Documentation

- `README.md`
- `.env.example`

## Remaining limitations

1. The payment gateway is intentionally simulated for the academic project; no real payment provider is connected.
2. Physical sensors, ANPR/cameras and boom-barrier controllers are not connected. Application slot state is clearly separated from future physical availability.
3. In-memory rate limiting is suitable for a university/demo deployment. A distributed deployment should use a shared store such as Redis.
4. A multi-instance Socket.IO deployment should use the Socket.IO Redis adapter.
5. MongoDB transactions require Atlas/replica-set deployment for full multi-document atomicity.
6. Frontend dependency installation/build could not be executed in the rebuild environment when dependencies were not present; run `npm install` followed by `npm run build` locally before demonstration/deployment.

## Project architecture

```text
React UI
  │
  ├── REST API ───────────────┐
  │                           │
  └── Authenticated Socket.IO │
                              ▼
                    Node / Express API
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
       Booking             Payment             Handover
       State Machine       State Machine        State Machine
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                         MongoDB
                     (source of truth)
                              │
                    Future sensor/camera
                    integration boundary
```

This rebuild intentionally keeps ParkEasy's existing UI and feature set while making its backend state transitions, concurrency handling, security and real-time behavior much closer to a real parking-management system.


## ParkEasy AI + Location Setup

1. Copy `server/.env.example` to `server/.env`.
2. Set `MONGODB_URI`, `JWT_SECRET` (32+ characters), and `CLIENT_URL`.
3. Add your Gemini key as `GEMINI_API_KEY` in **server/.env only**. Do not put the key in the React client. Google recommends environment variables for Gemini API keys. The current implementation uses the Gemini `generateContent` endpoint from the backend.
4. Start the API with `cd server && npm install && npm run dev`.
5. Start the frontend with `cd client && npm install && npm run dev`.
6. Sign in, open Driver Dashboard, and choose **Use my location**. ParkEasy sends the browser coordinates to the parking API and sorts approved ParkEasy facilities by distance.
7. The floating **ParkEasy AI** button uses the same live parking options to answer questions such as “Which nearby option is best for my EV?”

### Important
The uploaded package does not contain a Gemini API key. A real secret key should not be embedded in a ZIP or committed to source control. Add your own key to `server/.env` after extracting the project.
#   P a r k E a s y  
 