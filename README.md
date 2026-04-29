# Bofo Waterproofing – Internal Request App

A mobile-friendly web app for submitting material/tool requests by job site.

---

## Project Structure

```
bofo-app/
├── client/        ← React frontend
└── server/        ← Node.js + Express backend
```

---

## Setup & Running Locally

### 1. Start the Backend

```bash
cd server
npm install
npm start
```

The API will run on **http://localhost:4000**

---

### 2. Start the Frontend

Open a second terminal:

```bash
cd client
npm install
npm start
```

The app will open at **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submissions` | Get all submissions |
| POST | `/api/submissions` | Create new submission |
| PATCH | `/api/submissions/:id` | Update submission status |

Submissions are stored in `server/submissions.json`.

---

## Features (Test Build)

- Employee name & job site dropdowns
- Request type selector: Material / Tool / Other
- Conditional fields per request type
- Quantity & notes fields
- English / Spanish language toggle
- Success confirmation screen
- Submissions log with status controls (Pending / Approved / Completed)

## Not Included (Full Build)

- Photo upload
- Full admin dashboard
- User authentication
- Database (currently file-based JSON)
