# ClassHub

A GitHub Classroom-style platform for managing programming assignments, student repositories, and automated plagiarism detection.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + react-router-dom + Axios |
| Backend | Node.js + Express + Mongoose |
| Database | MongoDB |
| Auth | JWT + bcrypt (HTTP-only cookies) |
| Git hosting | simple-git + git-http-backend |
| Plagiarism | C++ similarity engine (CMake) |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB running locally (or a connection string)
- A C++ compiler (GCC / Clang / MSVC) + CMake ≥ 3.16

### 1 — Clone the repository

```bash
git clone <repo-url>
cd classhub
```

### 2 — Install dependencies

Install client and server packages separately (no workspaces):

```bash
cd client && npm install && cd ..
cd server && npm install && cd ..
```

Then install root dev dependencies (concurrently):

```bash
npm install
```

### 3 — Configure environment variables

```bash
cp server/.env.example server/.env
# Open server/.env and fill in real values for:
#   PORT, MONGO_URI, JWT_SECRET, REDIS_URL
```

### 4 — Run the dev servers

From the repo root:

```bash
npm run dev
```

This starts the Vite client (`http://localhost:5173`) and the Express server (`http://localhost:5000`) together using `concurrently`.

### 5 — Build & run the plagiarism engine (optional for now)

```bash
cd plagiarism-engine
mkdir build && cd build
cmake ..
cmake --build .
./plagiarism-engine   # prints: plagiarism engine placeholder
```

---

## Project Structure

```
classhub/
├── client/              → Vite + React frontend
├── server/              → Node.js + Express API
├── plagiarism-engine/   → C++ similarity checker (CMake)
├── repos/               → Bare git repos stored on disk
├── DESIGN.md            → Architecture decisions
└── README.md
```
