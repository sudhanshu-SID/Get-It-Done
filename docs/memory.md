# Project Memory & Context

## Current State
- The foundational setup is complete.
- The MongoDB Atlas cluster is successfully connected and IP whitelisted for cloud access (`0.0.0.0/0`).
- The React/TypeScript frontend is fully wired to the backend API.
- All core features are functional, including task creation, dynamic goal tracking (e.g. DSA questions solved), active timers, automated strike calculation, live analytics, and reward unlocking logic.
- Analytics endpoints (`/api/analytics`, `/api/daily/today`) have been fixed to properly serve daily logs and formatting for frontend charts.
- PWA (Progressive Web App) setup is complete with `vite-plugin-pwa`, `manifest.json`, and icons for desktop/mobile installability.
- Application is live! Frontend is deployed on Vercel and backend is running on Render.

## Key Decisions
- **Goal Tracking Enhancements:** Dynamically tracking specific metrics (like DSA questions solved) alongside standard task completion counts to allow for flexible goal definitions.
- **Reward Automation:** Rewards unlock automatically the moment their associated goals hit target thresholds, and re-lock if the progress reverses.
- **Design Philosophy:** Utilitarian, distraction-free brutalism. Solid blacks, stark whites, and red warnings.
- **Deployment Strategy:** Single-tenant local/personal instance deployed to the cloud for a 1-week test phase before introducing multi-tenant auth and data separation.
- **Serverless Sleep Mitigation:** Configured an active-timer-only heartbeat (pinging `/api/health` every 9 minutes during running timers) to prevent Render from idling out during deep work sessions, paired with an optimistic localStorage queue to ensure zero session data loss during server spin-ups.
- **Performance & Lazy Loading:** Transitioned the frontend to tiered lazy-loading (initial payload loads only Today + Active Timer + Settings, loading secondary tabs on demand) and parallelized backend dashboard queries with `.lean()` and rollover caching.

## Next Immediate Action
- **Live Testing Phase:** Use the deployed application for ~1 week to dogfood the mechanics, test the UX, and uncover any edge-case bugs.

## Future Work
- **Multi-User Authentication:** Implement user authentication (e.g., Clerk, Auth0) and append `userId` checks across all DB schemas and API routes to support public usage.
- **AI Agent Integration:** Introduce an intelligent background agent to analyze progress, send reminders, and assist the user in sticking to their goals.

## Known Issues / Quirks
- The frontend server originally defaulted to Port 3000, which conflicted with `opencode`. It has been manually changed to 5173.
- Windows file-locking occasionally blocks automated script directory swaps if terminals are active in those directories.
