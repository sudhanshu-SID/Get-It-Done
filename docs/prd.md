# Product Requirements Document (PRD)

## Product Name
Get It Done (GID)

## 1. Product Overview
GID is an anti-procrastination, utilitarian task manager designed for maximum focus. It strips away "feel-good" productivity fluff and relies on brutal accountability, strict timeboxing (Pomodoro), and a strike system with real consequences. 

## 2. Target Audience
Developers, students, and professionals who struggle with procrastination and need a rigid, high-stakes system to force them to execute mandates (tasks).

## 3. Core Features
### 3.1 Advanced Task & Goal Tracking
- **Projects & Goals:** Tasks are grouped into specific projects. High-level numerical goals (e.g., hours spent, completion rates) are tracked continuously.
- **Save State ("Left Off At"):** Users can log detailed notes on where they got stuck so they can resume instantly.

### 3.2 The Accountability Engine
- **Daily Records:** Tasks are explicitly marked as "Required" vs "Optional". Missing a required task permanently logs a failure for the day.
- **Strict Timeboxing (Pomodoro):** A globally tracked active timer for deep work sessions.

### 3.3 The "Consequences & Gamification" System
- **Advanced Strikes:** Missing goals or required tasks generates strikes. Strikes have severities (Low, Medium, High).
- **Custom Rewards & Penalties:** Every task can have specific rewards (e.g., "Watch 1 episode") or penalties (e.g., "Pay $5 to a friend").
- **Financial Stakes (Future):** Accumulating 10 unresolved strikes results in a real-world monetary penalty.

## 4. Technical Stack
- **Frontend:** React, TypeScript, Vite, TailwindCSS (v4).
- **Backend:** Node.js, Express, JavaScript, MongoDB Atlas.
- **Architecture:** Decoupled RESTful API.
