# Project Memory & Context

## Current State
- The foundational setup is complete.
- The MongoDB Atlas cluster is successfully connected and IP whitelisted for cloud access (`0.0.0.0/0`).
- The React/TypeScript frontend is fully wired to the backend API.
- All core features are functional, including task creation, dynamic goal tracking (e.g. DSA questions solved), active timers, automated strike calculation, live analytics, and reward unlocking logic.
- **Weekly Retrospective Cockpit:** Built an executive debrief dashboard featuring 7/14/30-day bounded retrospective windows, "Where You Excelled" vs "Where You Lagged", Field & Category Discipline Matrix, and Estimation Calibration.
- **Deterministic Streak Engine:** Strict 100% commitment adherence rule with pause continuity on rest days ("I Did Nothing Today" `status: 'no_progress'`), and permanent persistence of all-time peak streaks in `Gamification.longestStreak`.
- **Dynamic Sleep-Aware System Status:** Implemented event-driven backend connection monitoring (`Operational` vs `Standby`) with interactive 1-click reconnect, working in harmony with the 9-minute timer keepalive without consuming free-tier compute quotas.
- PWA (Progressive Web App) setup is complete with `vite-plugin-pwa`, `manifest.json`, and icons for desktop/mobile installability.
- Application is live! Frontend is deployed on Vercel and backend is running on Render.

## Key Decisions
- **Goal Tracking Enhancements:** Dynamically tracking specific metrics (like DSA questions solved) alongside standard task completion counts to allow for flexible goal definitions.
- **Reward Automation:** Rewards unlock automatically the moment their associated goals hit target thresholds, and re-lock if the progress reverses.
- **Design Philosophy:** Utilitarian, distraction-free brutalism. Solid blacks, stark whites, red warnings, and glowing flame telemetry accents.
- **Deployment Strategy:** Single-tenant local/personal instance deployed to the cloud for a 1-week test phase before introducing multi-tenant auth and data separation.
- **Free-Tier Database Bounded Queries:** Telemetry is capped strictly at 7/14/30 days to protect MongoDB Atlas M0 free tier instances from memory exhaustion and full-table-scan bottlenecks.
- **Streak Continuity & Accountability:** Daily commitments are binary: 100% required completion maintains the active streak; missing any commitment resets it to 0. Planned rest days freeze the streak without penalty.
- **Serverless Sleep Mitigation & Zero-Waste Quota Policy:** Configured an active-timer-only heartbeat (pinging `/api/health` every 9 minutes during running timers) paired with event-driven client status interception and optimistic localStorage session queuing. Zero continuous background polling ensures the server sleeps when idle.
- **Performance & Lazy Loading:** Transitioned the frontend to tiered lazy-loading (initial payload loads only Today + Active Timer + Settings, loading secondary tabs on demand) and parallelized backend dashboard queries with `.lean()` and rollover caching.

## Next Immediate Action
- **Live Testing Phase:** Use the deployed application for ~1 week to dogfood the mechanics, test the UX, and uncover any edge-case bugs.

## Future Work
- **Multi-User Authentication:** Implement user authentication (e.g., Clerk, Auth0) and append `userId` checks across all DB schemas and API routes to support public usage.
- **AI Agent Integration:** Introduce an intelligent background agent to analyze progress, send reminders, and assist the user in sticking to their goals.

## Known Issues / Quirks
- The frontend server originally defaulted to Port 3000, which conflicted with `opencode`. It has been manually changed to 5173.
- Windows file-locking occasionally blocks automated script directory swaps if terminals are active in those directories.
