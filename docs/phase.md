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

## Phase 4: Schema Upgrade & API Integration (PENDING)
- **Goal:** Connect the complex TS frontend to the JS backend.
- Upgrade backend Mongoose schemas to match the massive `frontend/src/types/index.ts` models (e.g., CommitmentLevels, DailyRecords, Severities).
- Wire up `frontend/src/services/api.ts` to hit `http://localhost:5000/api`.

## Phase 5: Authentication & Deployment (FUTURE)
- Implement user login/auth (JWT).
- Deploy backend to Render/Heroku and frontend to Vercel/Netlify.
