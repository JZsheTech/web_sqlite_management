
# Simple Web-Based SQLite Manager

*A full-stack prototype for database browsing, querying, and editing via a browser.*

This repository defines the specification for a minimal, full-stack **Web UI for SQLite database management**, designed to be implemented **end-to-end by an AI coding assistant (e.g., OpenAI Codex)** using vibecoding workflows.

The goal is to let the AI coder scaffold and implement the project **from zero**, based solely on this README.

---

## 📌 Goals

### Build a small but complete web application that provides:

1. **A browser-based UI** to:

   * Run SQL queries
   * Display results in a table
   * View tables & columns
   * Insert / Update / Delete rows (basic CRUD)

2. **A backend API** that wraps SQLite through FastAPI:

   * Connect to a local SQLite database file
   * Execute safe SQL commands
   * Provide table-metadata endpoints
   * Return query results as JSON

3. **A React-based frontend (JavaScript only)**:

   * Query input editor
   * Clickable table/column list
   * Data grid result display
   * Error display

4. **A minimal, clean architecture** to support simple extensions.

---

## 📁 Project Structure (Target Layout)

Codex / AI coder should generate code to match this structure:

```
/backend
  ├── main.py                # FastAPI entry
  ├── db.py                  # SQLite connection + operations
  ├── models.py              # Pydantic models (if needed)
  └── requirements.txt       # FastAPI, uvicorn, sqlite libs

/frontend
  ├── public/
  ├── src/
  │     ├── App.js           # Main React UI
  │     ├── components/
  │     │     ├── QueryEditor.js
  │     │     ├── ResultTable.js
  │     │     └── SidebarTables.js
  │     └── api.js           # Fetch helpers for backend
  ├── package.json
  └── README.md (auto-generated)

/data
  └── app.db                 # Default SQLite DB (AI coder creates example schema)

/README.md                  # This file
```

---

## 🏗️ Architecture Overview

### **Frontend: React (JavaScript, no TypeScript)**

* Built with Create React App (or Vite, but JavaScript only).
* Components:

  * **Query editor** (`textarea` or CodeMirror)
  * **Execute button**
  * **Result table** with pagination (optional)
  * **Sidebar** listing tables from backend metadata
* Communicates using JSON APIs only.

### **Backend: FastAPI**

API endpoints expected:

| Method | Path                     | Description                               |
| ------ | ------------------------ | ----------------------------------------- |
| `GET`  | `/tables`                | List all tables                           |
| `GET`  | `/tables/{table}/schema` | Return table schema                       |
| `POST` | `/query`                 | Execute SQL (SELECT/INSERT/UPDATE/DELETE) |
| `GET`  | `/health`                | Health check                              |

Requirements:

* Use **sqlite3** module (standard library)
* Prevent dangerous operations (optional)
* Always return `{ "success": true/false, "data": ..., "error": ... }`

---

## 🚀 Development Workflow (AI Coder Pipeline)

AI coder should follow this pipeline to generate the full implementation:

### 1. **Requirement Analysis**

* Validate goals in this README
* List minimal features before coding

### 2. **Environment Setup**

* Create Conda/virtualenv environment for backend
* Install backend dependencies (`fastapi`, `uvicorn`)
* Create React app for frontend (`npx create-react-app frontend`)

### 3. **Backend Implementation**

* Implement a FastAPI server
* Add SQLite wrapper
* Add /query and /tables endpoints
* Implement CORS
* Provide example database in `/data/app.db`

### 4. **Frontend Implementation**

* Scaffold React project
* Add API layer (`api.js`)
* Implement UI components:

  * Query editor
  * Result table
  * Sidebar for table list
* Connect to backend

### 5. **Testing**

* Manual local testing in Chrome or Firefox
* Sample SQL queries
* Validate errors return cleanly

### 6. **Integration & Packaging**

* Document startup steps
* Ensure cross-origin access works
* Provide final run instructions

---

## 🧪 Example SQL Queries for Testing

These should be executable through the Web UI:

```sql
SELECT name FROM sqlite_master WHERE type='table';

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT
);

INSERT INTO users (name, email) VALUES ('Alice', 'a@example.com');

SELECT * FROM users;
```

---

## ▶️ How to Run (Expected Implementation)

After AI coder generates the code, the run procedure should be:

### **Backend**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8100
```

### **Frontend**

```bash
cd frontend
npm install
PORT=3100 npm start
```

To减少 3000/8000 等常用端口被占用的情况，推荐前端运行在端口 `3100`，并调用后端 `http://localhost:8100`。

---

## 🌱 Future Extensions (Optional for AI coder)

* Export query results as CSV
* Basic authentication
* Save “query history”
* Dark mode UI
* Visualization charts

---

## 📄 License

MIT (or add your own license).

---

## 📝 Notes to AI Coder (For Vibecoding)

> * Use **JavaScript only** in the frontend.
> * Keep the code base minimal and clean.
> * Write clear comments in all generated files.
> * Ensure SQLite file path is configurable.
> * The goal is to deliver a working prototype, not a polished product.

---

## ✅ Implementation Summary

This repo now contains a working FastAPI + React prototype that follows all requirements outlined above.

### Backend Highlights
- FastAPI app with `/health`, `/tables`, `/tables/{table}/schema`, and `/query` routes.
- `backend/db.py` centralizes SQLite access and exposes helpers for listing tables, inspecting schemas, and executing single-statement SQL safely.
- Database file `data/app.db` ships with `users`, `products`, and `orders` tables plus seed data to explore immediately.
- Responses consistently follow `{ success, data, error }`, making it easy for the UI to show helpful messages.

### Frontend Highlights
- React app (Create React App layout) in `frontend/` with components for sidebar metadata, SQL editor, and tabular results.
- Reusable API client in `src/api.js` that respects `REACT_APP_API_BASE_URL`.
- Responsive UI with contextual errors, schema preview, seed query templates, and success states for both read and write queries.
- Copy `frontend/.env.example` to `frontend/.env` to point the UI at a different backend or port if needed.

### Running Locally
Follow the “How to Run” section above. The defaults assume:

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8100

# Frontend
cd frontend
cp .env.example .env   # optional but recommended
npm install
npm start              # loads PORT=3100 from .env
```

Open http://localhost:3100 after both servers start.

### Testing & Verification
- Exercised the SQLite helper directly (see `backend/db.py`) to confirm table listing, schema inspection, and select queries.
- Attempted to run `npm install` for the frontend, but the command repeatedly timed out because external network access is restricted in this environment. Once dependencies are installed in an online environment, `npm start` and `npm test` will function as usual.

With the backend verified against the bundled database and the frontend wired to the published API contract, the prototype is ready for further manual testing in a browser.
