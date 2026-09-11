# Technical Architecture

## 1. High-Level Architecture
The application uses a standard Client-Server model with a decoupled REST API.
- **Client (Frontend):** A Single Page Application (SPA) built with React and TypeScript.
- **Server (Backend):** A RESTful API built with Node.js, Express, and JavaScript.
- **Database:** MongoDB Atlas (Cloud).

## 2. Directory Structure
```
/Get-it-done
│
├── /frontend               # React UI (TypeScript)
│   ├── /src
│   │   ├── /components     # Reusable UI components (Navbar, Modals)
│   │   ├── /features       # Domain features (today, analytics, goals, strikes, rewards, projects)
│   │   ├── /services       # Typed Fetch API clients & status listeners
│   │   └── /types          # TypeScript interfaces & domain types
│   └── vite.config.ts
│
├── /backend                # Express API (JavaScript)
│   ├── /models             # Mongoose schemas (Task, Gamification, DailyRecord, Strike, Consequence, ActiveTimer)
│   ├── /services           # Domain services (dailyService, strikeService, goalService, etc.)
│   ├── /routes             # Express routers (index.js, analytics, daily, timer)
│   └── server.js
│
└── /docs                   # Project documentation
```

## 3. Data Flow & Connection Lifecycle
1. **User Interaction:** User interacts with a React component in `/frontend/src/features`.
2. **API Dispatch & Interception:** The component dispatches a request via `/frontend/src/services/api.ts`. Fetch requests pass through an active status listener:
   - Successful `HTTP 200` responses broadcast `● Operational`.
   - Network timeouts, connection drops, or `502/503` responses broadcast `○ Standby / Sleeping`.
3. **Timer-Bound Keep-Alive:** While an active stopwatch timer is running, the client sends a background keep-alive ping to `/api/health` every 9 minutes to prevent cloud instances (Render) from spinning down during focus sessions.
4. **Routing & Concurrency:** Requests hit `/backend/routes/index.js`, executing concurrent `.lean()` queries with `Promise.all` across MongoDB Atlas collections.
5. **Response & Optimistic Recovery:** JSON data is returned to the frontend. In case of unexpected server cold-starts, pending timer stops are preserved optimistically in `localStorage` until the server handshakes.
