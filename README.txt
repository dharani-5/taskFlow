================================================================
  TASKFLOW - Team Task Manager (Full-Stack)
================================================================

TECH STACK
----------
Backend:  Node.js + Express.js
Database: SQLite via sql.js (pure JavaScript - NO build tools needed!)
Frontend: React 18 + Vite
Auth:     JWT + bcrypt

HOW TO RUN
----------

REQUIREMENTS: Node.js v18+  (that's it!)

--- Terminal 1: Backend ---

  cd team-task-manager\backend
  npm install
  node setup.js
  npm start

  Runs at: http://localhost:5000

--- Terminal 2: Frontend ---

  cd team-task-manager\frontend
  npm install
  npm run dev

  Runs at: http://localhost:3000

Open http://localhost:3000 in your browser.

DEMO LOGIN
----------
  Admin:  admin@demo.com  / password123
  Member: member@demo.com / password123

API ENDPOINTS
-------------
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId

GET    /api/tasks?project_id=X
GET    /api/tasks/dashboard
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id

DEPLOYMENT (Railway)
--------------------
1. Push to GitHub
2. railway.app → New Project → Deploy from GitHub
3. Backend service: root=/backend, start=node server.js
4. Frontend service: root=/frontend, build=npm run build
5. Set JWT_SECRET env var on backend service

================================================================
