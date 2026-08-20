# Project Memory & Context

## Current State
- The foundational setup is complete.
- The MongoDB Atlas cluster is successfully connected to the Node.js backend.
- The React/TypeScript frontend is fully wired to the backend API.
- All core features are functional, including task creation, dynamic goal tracking (e.g. DSA questions solved), active timers, automated strike calculation, live analytics, and reward unlocking logic.
- Bugs regarding duplicate session tasks and completion toggles have been resolved.

## Key Decisions
- **Goal Tracking Enhancements:** Dynamically tracking specific metrics (like DSA questions solved) alongside standard task completion counts to allow for flexible goal definitions.
- **Reward Automation:** Rewards unlock automatically the moment their associated goals hit target thresholds, and re-lock if the progress reverses.
- **Design Philosophy:** Utilitarian, distraction-free brutalism. Solid blacks, stark whites, and red warnings.

## Next Immediate Action
- Polish any remaining styling quirks.
- Implement the PWA (Progressive Web App) manifest, service worker, and icons to allow the app to be installed natively on mobile devices.
- Prepare the backend for deployment (Render/Railway) and frontend for Vercel.

## Known Issues / Quirks
- The frontend server originally defaulted to Port 3000, which conflicted with `opencode`. It has been manually changed to 5173.
- Windows file-locking occasionally blocks automated script directory swaps if terminals are active in those directories.
