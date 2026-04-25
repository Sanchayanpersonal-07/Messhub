# MessHub

MessHub is a full-stack hostel mess management system built for student use-cases.  
It provides role-based workflows for **students**, **mess managers**, and **wardens** to handle menus, attendance, feedback, duties, notifications, and billing.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + WebAuthn (fingerprint/passkey attendance flow)

## Core Features

### Student
- Daily meals and menu access
- Meal attendance history and counts
- Feedback submission (with optional image upload)
- Duty assignments and duty report submission
- Mess bill viewing and bill issue reporting
- Notifications

### Manager
- Meal management
- Feedback moderation
- Student list and duty report monitoring
- Attendance view
- Notifications management
- Meal demand prediction (next 7 days + accuracy)
- Weekly menu chart upload (OCR-assisted flow)

### Warden
- Analytics dashboard
- Duty assignment and verification
- Feedback oversight
- Bill upload from Excel, issue handling, and monthly bill management

## Project Structure

```text
Messhub/
├── backend/     # Express API, Mongo models, controllers, routes
└── frontend/    # React application (role-based dashboards)
```

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection URI

## Environment Variables (Backend)

Create `/home/runner/work/Messhub/Messhub/backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

# Optional (notifications)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Optional (menu OCR / AI extraction)
OPENROUTER_API_KEY=your_openrouter_key

# Optional (WebAuthn)
RP_ID=localhost
```

## Local Setup

### 1) Backend

```bash
cd /home/runner/work/Messhub/Messhub/backend
npm install
npm run dev
```

Backend runs by default at: `http://localhost:5000`

### 2) Frontend

```bash
cd /home/runner/work/Messhub/Messhub/frontend
npm install
npm run dev
```

Frontend runs by default at: `http://localhost:5173`

## Available Scripts

### Backend

- `npm run dev` — start with nodemon
- `npm start` — start with node

### Frontend

- `npm run dev` — start Vite dev server
- `npm run build` — type-check + production build
- `npm run lint` — run ESLint
- `npm run preview` — preview built app

## API Base Path

- Base URL (local): `http://localhost:5000`
- Main route groups:
  - `/api/auth`
  - `/api/student`
  - `/api/manager`
  - `/api/warden`
  - `/api/dashboard`
  - `/api/menu`
  - `/api/attendance`
  - `/api/notifications`
  - `/api/prediction`

## Notes

- Role-based protection is enforced on both frontend routes and backend APIs.
- Uploaded files are served from `/uploads`.
- Ensure `CLIENT_URL` matches your frontend origin in local/dev deployments.
