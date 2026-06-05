# Aqua Flow — Water Cooler Distribution Management

Production-ready web application for managing water cooler distribution: areas, drivers, customers, daily deliveries, inventory, billing, and analytics.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, ShadCN UI, Recharts
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT
- **PDF**: PDFKit

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally or MongoDB Atlas connection string

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MONGODB_URI and JWT_SECRET
npm install
npm run dev
```

Server runs at `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Seed Owner Account

```bash
cd backend
npm run seed
```

Default owner: `owner@aquaflow.com` / `admin123`

## Documentation

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full schema, API design, and business rules.

## Project Structure

```
Aqua_Flow/
├── backend/     # Express API
├── frontend/    # React SPA
└── docs/        # Architecture & design
```
