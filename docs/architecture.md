# Technical Architecture

## 1. High-Level Architecture
The application uses a secured Client-Server model with a decoupled REST API and Logical Multi-Tenancy:
- **Client (Frontend):** A Single Page Application (SPA) built with React, TypeScript, and Vite, authenticated via Firebase Web SDK.
- **Server (Backend):** A RESTful API built with Node.js and Express, enforcing zero-trust token validation via Firebase Admin SDK (`firebase-admin/auth`).
- **Database:** MongoDB Atlas (Cloud) logically partitioned across all collections using indexed `userId`.

## 2. Directory Structure
```
/Get-it-done
│
├── /frontend               # React UI (TypeScript)
│   ├── /src
│   │   ├── /components     # Reusable UI components (Navbar, Modals, Spinners)
│   │   ├── /context        # Global contexts (AuthContext.tsx)
│   │   ├── /features       # Domain features (today, tasks, quests, analytics, auth, goals, strikes, rewards, projects)
│   │   │   ├── /auth       # Light Split-Screen Auth Cockpit (AuthPage.tsx)
│   │   │   └── /quests     # Dedicated Quests page, today section, and creation modal
│   │   ├── /services       # Typed Fetch API clients & status listeners
│   │   │   └── /auth       # Firebase Auth services & interfaces
│   │   └── /types          # TypeScript interfaces & domain types
│   └── vite.config.ts
│
├── /backend                # Express API (JavaScript)
│   ├── /middleware         # Zero-trust auth middleware (auth.js verifying Bearer tokens)
│   ├── /models             # Mongoose schemas with indexed userId (User, Task, Quest, Strike, Consequence, etc.)
│   ├── /services           # Domain services (dailyService, strikeService, consequenceService, etc.)
│   ├── /routes             # Express routers (index.js, auth.js, quests.js)
│   ├── /scripts            # Utility scripts (backupData.js)
│   └── server.js
│
└── /docs                   # Project documentation
```

## 3. Authentication & Multi-Tenancy Architecture
1. **Client Identity Provider:** Authentication is managed via Firebase Authentication (Email/Password, Password Reset, and Google OAuth via `signInWithPopup`).
2. **Token Lifecycle:** Upon sign-in, the Firebase Web SDK manages JWT ID tokens and automatic silent background refreshes.
3. **Bearer Token Dispatch:** The client API adapter (`/frontend/src/services/api.ts`) injects `Authorization: Bearer <idToken>` on all outgoing HTTP requests.
4. **Zero-Trust Backend Verification:** The Express middleware (`/backend/middleware/auth.js`) intercepts requests and invokes `admin.auth().verifyIdToken(token)`. Decoded credentials stamp `req.userId` and `req.userEmail` onto the request.
5. **Logical Multi-Tenancy (Data Isolation):**
   - Every collection document has `userId: { type: String, required: true, index: true }`.
   - All Mongoose queries (`find`, `create`, `updateOne`, `deleteOne`) strictly scope by `{ userId: req.userId }`, preventing cross-tenant data leaks and Insecure Direct Object References (IDOR).
   - Background services use user-keyed cache maps (e.g. `lastEvaluatedDateByUser.set(userId, date)`) to eliminate cross-user state collisions during midnight rollovers.
6. **Guest Action Interception & Zero-Leak State Purging:**
   - Unauthenticated users can view a read-only preview of the application.
   - Any mutating trigger is wrapped in `requireAuth()`, which halts execution and smoothly switches the view to `AuthPage.tsx`.
   - On sign-out or account switch, `App.tsx` purges all 10 React state hooks and `localStorage` cache keys to prevent memory leaks across sessions.

## 4. Data Flow & Connection Lifecycle
1. **User Interaction:** User interacts with a React component in `/frontend/src/features`.
2. **API Dispatch & Interception:** The component dispatches a request via `/frontend/src/services/api.ts`. Fetch requests pass through an active status listener:
   - Successful `HTTP 200` responses broadcast `● Operational`.
   - Network timeouts, connection drops, or `502/503` responses broadcast `○ Standby / Sleeping`.
3. **Timer-Bound Keep-Alive:** While an active stopwatch timer is running, the client sends a background keep-alive ping to `/api/health` every 9 minutes to prevent cloud instances (Render) from spinning down during focus sessions.
4. **Routing & Concurrency:** Requests hit `/backend/routes/index.js`, executing concurrent `.lean()` queries with `Promise.all` across MongoDB Atlas collections scoped by `userId`.
5. **Response & Optimistic Recovery:** JSON data is returned to the frontend. In case of unexpected server cold-starts, pending timer stops are preserved optimistically in `localStorage` until the server handshakes.

## 5. Quests (Periodic Milestone Commitments) Architecture
1. **Isolated Data Model (`backend/models/Quest.js`):** Quests are stored in a dedicated collection decoupled from daily `Task` records. This ensures that long-horizon recurring items never interfere with the daily task lifecycle, binary streak calculations, or automated strikes.
2. **Non-Punitive Persistence:** Quests due on or before today appear in a dedicated section on the `TodayDashboard` directly below Required Commitments, and also on the full `/quests` directory page. Leaving a Quest incomplete at midnight does NOT trigger strikes or break streaks.
3. **Dual Schedule Mechanics:**
   - **Flexible Timing:** Advances by the interval (e.g., 1 month) from the actual completion date.
   - **Exact Day of Month:** Anchors recurring occurrences to a specific calendar date (1–31) with safe month-end clamping (e.g. Jan 31 -> Feb 28).
4. **7-Day Grace Window:**
   - Completed within 7 days of due date: Maintains the fixed monthly calendar anchor.
   - Completed $> 7$ days late: Resets the cadence from the completion date to give the user a full month buffer and prevent compressed schedules.
5. **Full Multi-Tenancy:** All routes in `/backend/routes/quests.js` require Bearer authentication and scope all queries strictly by `req.userId`.
