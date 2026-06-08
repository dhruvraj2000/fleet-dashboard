# Fleet Dashboard - Project Instructions

## Project Overview
A real-time Fleet Dashboard application showing live vehicle telemetry (simulated coordinates, speed, and status updates) on a frontend dashboard.

### Tech Stack
- **Backend:** Node.js, Express (v5.x), Socket.io (v4.x), nodemon (v3.x for development)
- **Frontend:** React (v19.x), Vite (v8.x), Socket.io Client (v4.x), ESLint (v10.x, flat configuration)
- **Styling:** Vanilla CSS (`App.css`, `index.css`)
- **Real-time Protocol:** WebSockets (via Socket.io)

### Architecture & Folder Layout
- **Monorepo / Split Directories:**
  - `backend/`: Express server that manages and updates fake vehicle coordinates every 2 seconds. It broadcasts live coordinates via WebSockets (`vehicleUpdate` event) on port 5000.
  - `frontend/`:
    - Outer directory (`frontend/`): Holds `socket.io-client` dependency (`^4.8.3`) to make it accessible to nested sub-packages via Node's module resolution.
    - Inner directory (`frontend/vite-project/`): A standard React-Vite client application that displays the vehicle positions in a dashboard, connected to the backend WebSocket port.

---

## Directory Structure
```
fleet-dashboard/
├── backend/                  # Express & Socket.io backend server
│   ├── package.json
│   ├── package-lock.json
│   └── server.js             # Main server script, listens on port 5000
└── frontend/                 # Frontend environment
    ├── package.json          # Outer frontend dependency on socket.io-client
    ├── package-lock.json
    └── vite-project/         # Inner React + Vite application
        ├── eslint.config.js  # ESLint flat configuration file
        ├── index.html
        ├── package.json      # React and build dependencies
        ├── package-lock.json
        ├── vite.config.js
        └── src/
            ├── App.jsx       # Connects to socket, manages vehicle state, renders list
            ├── App.css       # Layout & styling
            ├── index.css
            └── main.jsx      # React entrypoint
```

---

## Building and Running

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Step 1: Install Dependencies
Dependencies are split across three locations due to the directory structure. You must install them in all three:

```bash
# Install backend dependencies
cd backend
npm install

# Install outer frontend socket.io-client dependencies
cd ../frontend
npm install

# Install inner frontend React + Vite dependencies
cd vite-project
npm install
```

### Step 2: Running the Application
To run the full stack, you need to start both the backend server and frontend development server.

#### Starting the Backend
Run from the `backend/` directory:
```bash
cd backend
# Using nodemon for hot-reloads during development:
npx nodemon server.js

# Or start directly with Node:
node server.js
```
The backend server starts on [http://localhost:5000](http://localhost:5000) and begins broadcasting simulated vehicle data.

#### Starting the Frontend
Run from the `frontend/vite-project/` directory:
```bash
cd frontend/vite-project
npm run dev
```
The frontend dev server starts on [http://localhost:5173](http://localhost:5173) (or next available port).

---

## Development Conventions

### Coding Style & Linting
- **ESLint:** The project uses ESLint Flat Configuration (`eslint.config.js`). It extends `eslint:recommended`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`.
  - To check for linting errors, run:
    ```bash
    cd frontend/vite-project
    npm run lint
    ```
- **JavaScript & React Standards:**
  - Modern ES Modules (`import`/`export`) are used in the frontend.
  - CommonJS (`require`/`module.exports`) is used in the backend.
  - Strict type checking or TypeScript is *not* currently configured, but clean, well-documented React code is expected. Use hooks cleanly and cleanup sockets in `useEffect`'s return statement.

### Styling & CSS
- Currently uses Vanilla CSS (`App.css`, `index.css`).
- Prefer Vanilla CSS over adding bulky UI toolkits unless explicitly requested. Maintain simple, modern, clean styling conventions.

### Real-Time Sockets Guidelines
- Sockets connect to `http://localhost:5000`.
- **Events:**
  - `init`: Pushed by backend on initial client connection, contains the current array of active vehicles.
  - `vehicleUpdate`: Periodically pushed by backend (every 2000ms), containing the updated vehicle telemetry data.
- **Cleanup:** Always remove event listeners (`socket.off("init")`, `socket.off("vehicleUpdate")`) in React `useEffect` cleanups to prevent memory leaks and duplicate listener registration.

### Testing
- No unit or integration testing is configured yet.
- **TODO/Placeholder for Testing:** Once a testing framework is introduced (e.g., Jest/Vitest for frontend or Mocha/Jest for backend), update this section.
  - Backend test script currently acts as placeholder: `echo "Error: no test specified" && exit 1`.
