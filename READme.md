# MedPilot Backend API

> A medication management and reminder platform that helps patients track medications, receive timely reminders, confirm doses, and manage prescription refills.

## 🔗 Links

| | |
|---|---|
| **Live API** | https://medpilot-backend.onrender.com |
| **API Documentation** | https://documenter.getpostman.com/view/50244835/2sBXionW5t |
| **Health Check** | https://medpilot-backend.onrender.com/health |

---

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Features](#features)
- [Automated Schedulers](#automated-schedulers)
- [Testing](#testing)

---

## Overview

MedPilot is a mobile-first medication management platform supported by a web dashboard. It enables patients to manage medications, receive reminders, track adherence, and request prescription refills.

**MVP Features:**
- Medication management
- Smart medication reminders
- Dose confirmation and tracking
- Refill prediction alerts
- Pharmacy refill requests
- Medication adherence dashboard

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express.js | Server framework |
| MongoDB + Mongoose | Database |
| JWT | Authentication |
| Joi | Input validation |
| node-cron | Automated schedulers |
| Resend API | Email notifications |
| node-fetch | HTTP requests |
| bcryptjs | Password hashing |

---

## Project Structure
```
medPilot-backend/
├── src/
│   ├── config/
│   │   ├── db.js                    ← MongoDB connection
│   │   └── seed.js                  ← Admin seeder
│   ├── controllers/
│   │   ├── auth.controller.js       ← Auth logic
│   │   ├── medication.controller.js ← Medication CRUD
│   │   ├── dose.controller.js       ← Dose tracking
│   │   ├── refill.controller.js     ← Refill management
│   │   └── dashboard.controller.js  ← Analytics
│   ├── models/
│   │   ├── user.model.js
│   │   ├── medications.model.js
│   │   ├── doseLog.model.js
│   │   └── refillRequest.model.js
│   ├── routes/
│   │   ├── auth.route.js
│   │   ├── medication.route.js
│   │   ├── dose.route.js
│   │   ├── refill.route.js
│   │   └── dashboard.route.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   └── validateObjectID.js
│   ├── services/
│   │   ├── reminder.service.js
│   │   └── email.service.js
│   ├── templates/
│   │   └── email.templates.js
│   ├── validations/
│   │   ├── auth.validation.js
│   │   ├── medication.validation.js
│   │   ├── dose.validation.js
│   │   ├── refill.validation.js
│   │   └── dashboard.validation.js
│   └── utils/
│       ├── jwt.js
│       ├── bcrypt.js
│       ├── response.js
│       └── validateRequest.js
├── logs/
│   └── .gitkeep
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account or local MongoDB
- Resend account for emails

### Installation

**1. Clone the repository:**
```bash
git clone <repo-url>
cd medPilot-backend
```

**2. Install dependencies:**
```bash
npm install
```

**3. Set up environment variables:**
```bash
cp .env.example .env
```
Fill in your values in `.env`

**4. Seed the admin account:**
```bash
npm run seed
```

**5. Start the server:**
```bash
# Development
npm run dev

# Production
npm start
```

---

## Environment Variables
```env
PORT=4000
NODE_ENV=development

# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# Bcrypt
BCRYPT_ROUNDS=12

# Resend
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=MedPilot <no-reply@yourdomain.com>

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/verify-otp` | Verify email OTP | ❌ |
| POST | `/api/auth/resend-otp` | Resend OTP | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| POST | `/api/auth/forgot-password` | Request password reset | ❌ |
| POST | `/api/auth/reset-password` | Reset password | ❌ |
| GET | `/api/auth/profile` | Get profile | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |
| PUT | `/api/auth/change-password` | Change password | ✅ |
| DELETE | `/api/auth/delete-account` | Delete account | ✅ |

### Medications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/medications` | Get all medications | ✅ |
| POST | `/api/medications` | Add medication | ✅ Patient |
| GET | `/api/medications/refill-status` | Check refill status | ✅ |
| GET | `/api/medications/:id` | Get single medication | ✅ |
| PUT | `/api/medications/:id` | Update medication | ✅ Patient |
| DELETE | `/api/medications/:id` | Deactivate medication | ✅ Patient |

### Doses

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/doses` | Get all dose logs | ✅ |
| POST | `/api/doses` | Log a dose | ✅ Patient |
| GET | `/api/doses/:id` | Get single dose log | ✅ |
| PUT | `/api/doses/:id` | Update dose log | ✅ Patient |
| DELETE | `/api/doses/:id` | Delete dose log | ✅ Patient |

### Refills

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/refills` | Get all refill requests | ✅ |
| POST | `/api/refills` | Create refill request | ✅ |
| GET | `/api/refills/:id` | Get single request | ✅ |
| PUT | `/api/refills/:id` | Update refill request | ✅ |
| DELETE | `/api/refills/:id` | Cancel refill request | ✅ |
| PUT | `/api/refills/:id/status` | Update status | ✅ Admin |

### Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard` | Get dashboard overview | ✅ |
| GET | `/api/dashboard/adherence-history` | Get adherence history | ✅ |

---

## Authentication Flow
```
Register → OTP sent to email
        ↓
Verify OTP → account activated
        ↓
Login → access token + refresh token returned
        ↓
Use access token in Authorization header
        ↓
Token expires → use refresh token to get new access token
```

**Request header format:**
```
Authorization: Bearer <access_token>
```

---

## Features

### Medication Management
- Add medications with dosage, frequency, and schedule
- Remaining quantity tracked automatically
- Refill threshold alerts when pills run low
- Soft delete preserves dose history

### Dose Tracking
- Log doses as taken, skipped, or missed
- Pill count decrements automatically on taken
- Duplicate dose prevention
- Missed doses marked automatically at midnight

### Refill System
- Submit refill requests to pharmacy
- Admin approval workflow
- Pill count restocked on completion
- Confirmation email sent automatically

### Dashboard
- Today's doses overview
- 30-day adherence rate
- Medications needing refill
- Day-by-day adherence history for charts

---

## Automated Schedulers

| Schedule | Job |
|---|---|
| Every minute | Check and send dose reminder emails |
| Daily 8:00 AM | Send refill alert emails for low stock |
| Daily 12:05 AM | Mark unlogged doses as missed |

---

## Testing

Import the Postman collection and set these environment variables:

| Variable | Value |
|---|---|
| `BASE_URL` | `http://localhost:4000` |
| `ACCESS_TOKEN` | Patient JWT token |
| `ADMIN_TOKEN` | Admin JWT token |
| `MEDICATION_ID` | ID of a test medication |
| `DOSE_ID` | ID of a test dose log |
| `REFILL_ID` | ID of a test refill request |

**Seed admin account:**
```bash
npm run seed
```

**Admin credentials:**
```
Email:    admin@medpilot.com
Password: Admin@1234
```

---

## Scripts
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run seed     # Create admin account
```

---

*MedPilot — BeTechified Capstone · Group 2 · Healthcare Technology · 2026*

---

## License

MIT License

Copyright (c) 2026 BeTechified Capstone Group 2

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.