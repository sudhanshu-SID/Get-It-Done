# Development Phases

## Phase 1: Foundation (COMPLETED)
- Set up Git repository.
- Initialize `/frontend` and `/backend`.
- Establish documentation (`prd.md`, `architecture.md`, etc.).

## Phase 2: Backend Core Data Layer (COMPLETED)
- Connect to MongoDB Atlas.
- Build basic Mongoose schemas (`Task`, `Rule`, `StrikeLog`).
- Implement Express REST API and CRUD routes.

## Phase 3: Frontend UI Migration (COMPLETED)
- Swap legacy frontend with advanced TypeScript `frontend-2.0`.
- Switch package manager from Bun to NPM.
- Verify React/Vite development server functionality.

## Phase 4: Schema Upgrade & API Integration (COMPLETED)
- **Goal:** Connect the complex TS frontend to the JS backend.
- Upgraded backend Mongoose schemas to match the frontend/src/types/index.ts models.
- Wired up frontend/src/services/api.ts to hit the backend API.
- Live data population implemented for Goals, Analytics, Rewards, Settings, and Streaks.

## Phase 5: PWA & Deployment (COMPLETED)
- Implement PWA requirements (manifest.json, icons, service worker) to make the web app installable on mobile and desktop.
- Deploy backend to Render/Railway for persistent websocket/timer connections.
- Set MongoDB Atlas Network Access (`0.0.0.0/0`) for cloud connections.
- Deploy frontend to Vercel and configure dynamic API environment variables.

## Phase 6: Testing & Validation (COMPLETED)
- Dogfood the live PWA application for at least 1 week.
- Validate daily task flow, strike mechanisms, analytics accuracy, and general UX.
- **Weekly Retrospective Cockpit (COMPLETED):** Upgraded Analytics with 7/14/30-day bounded query telemetry, dual retrospective panels ("Where You Excelled" vs "Where You Lagged"), Category Discipline Matrix, and estimation calibration.
- **Deterministic Streak Engine (COMPLETED):** Implemented strict 100% commitment adherence, break-day continuity ("I Did Nothing Today" `status: 'no_progress'`), and permanent persistence of all-time peak streaks in `Gamification.longestStreak`.
- **Sleep-Aware System Status & Health Keep-Alive (COMPLETED):** Built event-driven connection monitoring (`Operational` vs `Standby`) with 1-click reconnect and targeted 9-minute timer heartbeat that prevents instance dropoffs while preserving free-tier quotas.

## Phase 7: Multi-User Authentication & Logical Multi-Tenancy (ACTIVE / CURRENT WORKING PHASE)
- **Goal:** Transform the single-tenant app into a secure, multi-tenant productivity system where each user has isolated access to their own tasks, projects, goals, strikes, habits, and analytics dashboards.
- **Architecture & Technology (100% Free Plan):**
  - **Auth Strategy:** Native JWT + Google OAuth (Google Cloud Console OAuth 2.0 Client ID is completely free with no user limits) OR Firebase Auth (Free Spark plan up to 50k MAUs).
  - **Logical Multi-Tenancy:** Single MongoDB database with indexed `userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }` across all models.
  - **Backend Security:** `requireAuth` middleware enforcing tenant query scoping on every `.find()`, `.create()`, `.updateOne()`, and `.deleteOne()`.
  - **Frontend Integration:** `AuthContext.tsx`, protected routes, login/register UI with email/password and "Continue with Google", token injection in `api.ts`.
  - **Initialization Pipeline:** Auto-bootstrap default `Gamification` (Level 1, 0 XP) and `UserSettings` records for each new user upon registration.
- **Critical Edge Cases to Handle:**
  1. *Zero-Data-Loss Legacy Migration*: Strictly safeguard all existing tasks, goals, strikes, and records by performing a pre-migration JSON export/snapshot and a non-destructive `$set: { userId }` query without modifying or dropping existing fields.
  2. *Email Sanitization & Casing*: Enforce strict `.trim().toLowerCase()` on both client and server to prevent duplicate accounts created by accidental capitalization or mobile autofill whitespace.
  3. *Account Linking & Collisions (Password vs Google OAuth)*: Merge existing email/password accounts with Google OAuth when the verified email matches, preventing duplicate records or auth lockout.
  4. *Multi-tab logout / token expiration during active focus timer*: Prevent losing active stopwatch time if token expires or user logs out elsewhere by using local snapshot recovery.
  5. *Multi-timezone streak rollover*: Ensuring each user's "Today" and streak evaluation aligns with their specific timezone, not the UTC server time.
  6. *IDOR (Insecure Direct Object References)*: Preventing cross-tenant data leaks by verifying `userId` matches the resource owner on every update/delete operation.

## Phase 8: AI Agent Integration, Habit Coaching & Goal Roadmaps (NEXT PHASE)
- **Goal:** Proactive AI co-pilot that assists with habit formation, goal decomposition, autonomous task adjustments, and productivity feedback.
- **Key Capabilities Planned:**
  1. *Goal-to-Roadmap Decomposition*: Macro-goals broken down into hierarchical milestones with daily, weekly, monthly, and one-time tasks automatically scheduled.
  2. *Habit Formation Assistant*: Behavioral coaching converting desired actions into cue-routine-reward loops with commitment tracking.
  3. *Autonomous / Assisted Task Lifecycle*: Smart rescheduling of missed/stale tasks, adaptive priority updates, and automated state synchronization so users never return to a stagnant dashboard.
  4. *Performance Analytics & Suggestions*: AI-driven insights identifying productivity bottlenecks, peak focus hours, and category discipline.
- **Technical Architecture:**
  - LLM Provider: Gemini API (Free tier / Generative AI SDK) or OpenAI with structured function/tool calling.
  - Integration with existing `backend/models/AgentPermission.js` and `User.preferences.agentPermissions` to respect user autonomy boundaries.
  - Human-in-the-Loop review modal for bulk roadmap/task creations before database persistence.
- **Critical Edge Cases to Anticipate:**
  1. *Hallucinated dates or circular recurring dependencies*: Strict schema validation before persisting AI-generated tasks.
  2. *Schedule overload*: Capping AI-generated daily workloads to prevent user burnout.
  3. *Destructive autonomous actions*: Requiring explicit human confirmation for task deletions or drastic priority overrides.
  4. *Context token limits & cost*: Summarizing user telemetry snapshots rather than dumping raw log history into prompt context.

