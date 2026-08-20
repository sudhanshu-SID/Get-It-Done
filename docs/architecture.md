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
│   │   ├── /components     # Reusable UI components
│   │   ├── /features       # Domain-specific logic (tasks, goals, strikes)
│   │   ├── /services       # Axios API clients
│   │   └── /types          # TypeScript interfaces
│   └── vite.config.ts
│
├── /backend                # Express API (JavaScript)
│   ├── /models             # Mongoose schemas (Task, Gamification, StrikeLog)
│   ├── /controllers        # Request handling logic
│   ├── /routes             # Express routers
│   └── server.js
│
└── /docs                   # Project documentation
```

## 3. Data Flow
1. **User Interaction:** User interacts with a React component in the `/frontend/src/features` directory.
2. **API Call:** The component dispatches a request using Axios via `/frontend/src/services/api.ts`.
3. **Routing:** The request hits `/backend/server.js` and is routed via `/backend/routes/`.
4. **Processing:** The Controller processes the request and interacts with MongoDB via Mongoose Models.
5. **Response:** JSON data is returned to the frontend.
