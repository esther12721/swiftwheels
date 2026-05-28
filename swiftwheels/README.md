# SwiftWheels Fleet Management System

A full-stack fleet management web application built with React.js, Node.js, Express.js, and MongoDB.

---

## Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **MongoDB** — https://www.mongodb.com/try/download/community
  - Install and start MongoDB locally, OR use a free Atlas cluster

---

## Quick Start

### 1. Start MongoDB

Make sure MongoDB is running locally:
```bash
mongod
```
Or update `backend/.env` with your MongoDB Atlas URI.

---

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at: **http://localhost:5000**

---

### 3. Start Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## First Time Setup

1. Open **http://localhost:5173** in your browser
2. Click **"Create one free"** to register an account
3. Choose your role (Admin recommended for full access)
4. Log in and start managing your fleet!

---

## Features

| Module | Description |
|--------|-------------|
| 🔐 Authentication | Register, login, JWT-based auth, role-based access |
| 🚛 Vehicles | Add/edit/delete vehicles, track status & mileage |
| 👤 Drivers | Manage driver records, licenses, assignments |
| 🗺️ Trips | Record & track trips, routes, costs, status |
| ⛽ Fuel | Log fuel fills, monitor costs & consumption |
| 🔧 Maintenance | Schedule services, track repairs & costs |
| 📊 Dashboard | Live stats overview with recent activity |

---

## Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcryptjs
- **Styling**: Custom CSS (dark theme)

---

## Environment Variables

`backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/swiftwheels
JWT_SECRET=swiftwheels_super_secret_key_2024
NODE_ENV=development
```

Change `MONGO_URI` if using MongoDB Atlas:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/swiftwheels
```

---

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all modules |
| **Fleet Manager** | Manage vehicles, drivers, trips, view reports |
| **Driver** | View assigned trips, record fuel usage |

---

## API Endpoints

```
POST   /api/auth/register     — Register user
POST   /api/auth/login        — Login
GET    /api/auth/me           — Get current user

GET    /api/vehicles          — List vehicles
POST   /api/vehicles          — Add vehicle
PUT    /api/vehicles/:id      — Update vehicle
DELETE /api/vehicles/:id      — Delete vehicle

GET    /api/drivers           — List drivers
POST   /api/drivers           — Add driver
PUT    /api/drivers/:id       — Update driver
DELETE /api/drivers/:id       — Delete driver

GET    /api/trips             — List trips
POST   /api/trips             — Add trip
PUT    /api/trips/:id         — Update trip
DELETE /api/trips/:id         — Delete trip

GET    /api/fuel              — List fuel records
POST   /api/fuel              — Add fuel record
PUT    /api/fuel/:id          — Update record
DELETE /api/fuel/:id          — Delete record

GET    /api/maintenance       — List maintenance
POST   /api/maintenance       — Schedule maintenance
PUT    /api/maintenance/:id   — Update record
DELETE /api/maintenance/:id   — Delete record

GET    /api/dashboard/stats   — Dashboard statistics
```
