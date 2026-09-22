# Task Management Dashboard

A MERN stack internship assignment for creating, viewing, editing, completing,
filtering, and deleting tasks through a responsive web interface.

## Stack

- MongoDB with Mongoose for data storage (connection pending)
- Express and Node.js for the REST API
- React with Vite for the frontend (pending)

## Project Structure

```text
task-management-dashboard/
|-- client/     React frontend (to be added)
|-- server/     Express backend
|-- .gitignore
`-- README.md
```

## Backend Setup

Install Node.js and npm. From the project root:

```powershell
cd server
npm install
Copy-Item .env.example .env
npm run dev
```

The development command uses nodemon to restart the server when files change.
Use `npm start` to run without automatic restarts. Press Ctrl+C to stop.

The server defaults to port 5000. Set `PORT` in `.env` to change it.
`CLIENT_ORIGIN` sets the allowed frontend origin and defaults to
`http://localhost:5173`.

## Health Endpoint

Open `http://localhost:5000/api/health` in a browser. A successful request returns
HTTP 200 with:

```json
{
  "status": "ok",
  "message": "Task API is running"
}
```

This checks that the HTTP server is responding; it does not check MongoDB.
Database setup and task endpoints will be added in later milestones.

## Development

Build and verify one milestone at a time, then commit the completed changes.
Keep credentials in local `.env` files. Commit only placeholder values in
`.env.example` files.
