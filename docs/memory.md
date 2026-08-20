# Project Memory & Context

## Current State
- The foundational setup is complete.
- The MongoDB Atlas cluster is successfully connected to the Node.js backend on Port 5000.
- The frontend has been massively upgraded to a TypeScript-based architecture (`frontend-2.0` -> `frontend`) running on Port 5173 via NPM.

## Key Decisions
- **Tech Stack Split:** The frontend is strictly TypeScript for type safety and scalability, while the backend remains standard JavaScript.
- **Design Philosophy:** Utilitarian, distraction-free brutalism. Solid blacks, stark whites, and red warnings.
- **Next Immediate Action:** Phase 4. We need to upgrade the backend MongoDB schemas to match the complex data structures expected by the new frontend before wiring them together.

## Known Issues / Quirks
- The frontend server originally defaulted to Port 3000, which conflicted with `opencode`. It has been manually changed to 5173.
- Windows file-locking occasionally blocks automated script directory swaps if terminals are active in those directories.
