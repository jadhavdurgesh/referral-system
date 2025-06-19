# Multi-Level Referral and Earning System

## Overview

This system enables users to refer up to 8 people directly and facilitates profit sharing based on a multi-level referral hierarchy. Earnings are tracked and distributed in real-time with live data updates for parent users whenever a leg user completes a purchase.

## Features

- User registration/login with referral codes
- Up to 8 direct referrals per user
- Profit sharing: 5% for direct referrals (Level 1), 1% for indirect (Level 2)
- Real-time earnings updates via Socket.io
- Purchase validation (only >1000Rs count for profit)
- Inactive user and edge case handling
- Detailed analytics and referral tree APIs

## Tech Stack

- Node.js, Express.js
- MongoDB (Mongoose)
- Socket.io (real-time updates)
- JWT (authentication)

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Set up a `.env` file with your MongoDB URI and JWT secret:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server: `node server.js`

## API Endpoints

### Auth & Users

- `POST /users/register` — Register a new user (optionally with referral code)
- `POST /users/login` — Login and receive JWT

### Purchases

- `POST /purchases/` — Record a purchase (requires JWT)
  - Body: `{ userId, amount, description }`

### Analytics

- `GET /analytics/earnings/:userId` — Get earnings breakdown
- `GET /analytics/referral-tree/:userId` — Get referral tree (direct and indirect)
- `GET /analytics/earning-sources/:userId` — Get earnings sources by purchase

## Real-Time Updates

- Connect to Socket.io with JWT token
- Receive `earningUpdate` events when you earn from referrals

## Data Models

### User

- userId, name, email, password, referralCode, parentId, referrals[], isActive, createdAt

### Earning

- earningId, userId, sourceUserId, purchaseId, amount, level, timestamp

### Purchase

- purchaseId, userId, amount, description, timestamp

## Edge Cases & Privacy

- Inactive users cannot refer or earn
- Referral limit (8) enforced
- Passwords hashed, JWT for auth
- No sensitive data exposed in analytics

## License

MIT
