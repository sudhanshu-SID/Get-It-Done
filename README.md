# Get It Done (GID)

**Get It Done (GID)** is a brutalist, anti-procrastination task manager designed for maximum focus and accountability. 

GID strips away "feel-good" productivity fluff. It relies on strict timeboxing, real-time analytics, and severe accountability systems with real consequences to force you to execute your mandates. 

## 🚀 Features

### 1. Strict Task Prioritization
- **Required vs. Optional:** Tasks are split into `required` commitments and an `optional` backlog. 
- **Timeboxing:** Built-in live timer for each task, tracking the exact number of minutes worked versus the estimated duration.
- **Quick Session Tracking:** Instantly generate "Work Session" tasks directly from your projects with a single click.

### 2. Live Analytics Dashboard
- See your daily completion rate for required tasks.
- View a breakdown of exactly where your time is being spent categorized by project and task category.
- Visualize historical data with a dynamic heat map of your previous daily records.

### 3. Dynamic Goal Tracking
- Define specific goals and track progress against them automatically.
- **Metric Tracking (e.g., DSA Questions):** When completing a task categorized as "DSA", the system proactively prompts you for the number of questions solved and automatically applies this metric to any active Goals targeting question counts. 

### 4. Accountability & Consequences Engine
- **Rewards:** Define rewards with specific conditions. Rewards are actively monitored by the backend and will unlock instantly when a linked Goal hits its target threshold.
- **Automated Strikes:** The system features a deterministic penalty system. If you fail to complete your mandatory "Required" tasks by the end of the day, the system automatically detects this and issues a Strike. To save server resources, this works retroactively—if you skip logging in for three days, the moment you open your dashboard, the system processes those missed days and hits you with the appropriate strikes.
- **Manual "Log Strike":** True accountability covers off-system behaviors too (e.g. "Procrastinated on YouTube for 2 hours", "Ate junk food", etc.). The manual Log Strike feature lets you enforce the exact same consequences for breaking personal life rules.
- **Financial Penalties:** Once you hit a predefined strike threshold (e.g., 10 strikes), the system enforces active penalties (such as monetary donations), ensuring real-world stakes for procrastination.

### 5. Configurable Settings
- Personalized application settings are stored in the database.
- Easily change your display name, timezone, default working duration, and custom task categories.

---

## 🛠️ Technology Stack

- **Frontend:** Built with **React** and **TypeScript**. Uses **Vite** for incredibly fast Hot Module Replacement (HMR) and optimized builds. Styled with **TailwindCSS** to enforce a stark, brutalist aesthetic. 
- **Backend:** Powered by **Node.js** and **Express.js**, acting as a lightweight RESTful API layer.
- **Database:** **MongoDB Atlas** (via Mongoose) handles schema validation and document storage.

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- NPM
- A MongoDB cluster (local or Atlas)

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
npm install
```

Create a `.env` file in the root of the `backend` folder containing your MongoDB connection string and preferred port:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster...
PORT=5000
```

Start the backend development server:
```bash
npm run dev
```

### 2. Frontend Setup

Open a second terminal and navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

Start the frontend Vite server:
```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`. 

---

## 🗺️ Roadmap / Upcoming Features
- **Progressive Web App (PWA):** Generating `manifest.json`, service workers, and icons so the app can be natively installed on mobile devices.
- **Production Deployment:** Instructions and pipeline for deploying the API to Render/Railway and the UI to Vercel.
