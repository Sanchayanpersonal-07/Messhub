# MessHub Frontend

This is the React frontend for **MessHub**, a role-based hostel mess management system.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

## Main Routes

- Public: `/`, `/login`, `/signup`
- Student: `/student/*`
- Manager: `/manager/*`
- Warden: `/warden/*`

Route protection is handled through `ProtectedRoute` using role checks.

## Setup

```bash
cd /home/runner/work/Messhub/Messhub/frontend
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

## Scripts

- `npm run dev` — start development server
- `npm run build` — type-check and build
- `npm run lint` — run ESLint
- `npm run preview` — preview production build

## Backend Connection

The frontend consumes backend APIs under `/api/*` and expects a JWT token in local storage after login.
Ensure backend CORS `CLIENT_URL` matches frontend origin.
