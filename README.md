# Task Management Dashboard

A MERN stack internship assignment for creating, viewing, editing, completing,
filtering, and deleting tasks through a responsive web interface.

## Stack

- MongoDB with Mongoose for data storage
- Express and Node.js for the REST API
- React with Vite for the frontend

## Project Structure

```text
task-management-dashboard/
|-- client/     React frontend, task list, and API service
|-- server/     Express backend, database configuration, and Task model
|-- .gitignore
`-- README.md
```

## Quick Start

Use two terminals from the project root.

Terminal 1:

```powershell
cd server
npm install
Copy-Item .env.example .env
npm run dev
```

Before starting the backend, update `server/.env` with your own
`MONGODB_URI`. The backend runs on `http://localhost:5000` by default.

Terminal 2:

```powershell
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in a browser.

## Backend Setup

Install Node.js and npm. From the project root:

```powershell
cd server
npm install
```

For a new checkout, copy the example configuration. Do not overwrite an existing
`.env` containing your credentials:

```powershell
Copy-Item .env.example .env
```

Configure MongoDB as described below, then start the backend:

```powershell
npm run dev
```

The development command uses nodemon to restart the server when files change.
Use `npm start` to run without automatic restarts. Press Ctrl+C to stop.

The server defaults to port 5000. Set `PORT` in `.env` to change it.
`CLIENT_ORIGIN` sets the allowed frontend origin and defaults to
`http://localhost:5173`.

## Frontend Setup

Keep the backend running. In a second terminal, from the project root:

```powershell
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The dashboard displays real tasks, task counts,
and loading, empty, and error states. Use Refresh to fetch the latest tasks.
Use New task to create a task and the pencil icon on a task to edit it. Both
actions use the same form, with title validation, optional description, and a
status selection. Successful saves update the list and task counts. Failed
saves keep the form and draft open for retry. Use the circle beside a pending
task to mark it completed, or the trash icon to open a delete confirmation.
Deletion is sent only after confirmation. Failed actions display an error and
can be retried; pending requests disable conflicting actions.

All, Pending, and Completed controls filter the already-loaded list immediately
in React. The summary counts always describe all loaded tasks. Refresh fetches
the current list from MongoDB while preserving the selected filter. The API
also supports status queries for direct clients, as documented below.

The API URL defaults to `http://localhost:5000/api`. If your backend uses another
port, copy `client/.env.example` to `client/.env`, update `VITE_API_URL`, and
restart Vite. Never put MongoDB credentials in the client environment: variables
prefixed with `VITE_` are exposed to the browser.

Vite uses port 5173 with strict port checking. If that port is occupied, stop
the previous frontend server, or run `npm run dev -- --port 5174` and update
the backend's `CLIENT_ORIGIN` to match, then restart the backend.

Run `npm run build` in `client` to produce a production build in `dist`.
Run `npm test` in `client` for the frontend test suite. Tests mock API calls
and do not modify Atlas data.

## MongoDB Setup

1. Create or resume a MongoDB Atlas cluster.
2. Create a database user with readWrite access to `task_management`.
3. Allow your current IP address in Atlas network access.
4. Copy the Node.js connection string from the cluster's Connect > Drivers screen.
5. Set `MONGODB_URI` in `server/.env` using your actual cluster hostname and
   database user credentials. URL-encode special characters in credentials.
6. Use `task_management` as the database name between the hostname's slash and
   the query string. Keep the query parameters supplied by Atlas.

The backend connects to MongoDB before listening for HTTP requests. Successful
startup prints `MongoDB connected` followed by the API address. If connection
fails, check the URI, database user permissions, IP access, and cluster status.
The database may not appear in Atlas until the first task is stored.

If the system DNS resolver refuses Atlas lookups but public DNS works, add
`DNS_SERVERS=1.1.1.1,8.8.8.8` to your local `server/.env` and restart the backend.
This optional override affects DNS lookups in this Node.js process only; it does
not change Windows network settings. Leave it unset when system DNS works.

## Task Model

Tasks have a required, trimmed title, an optional description defaulting to an
empty string, and a status of `pending` or `completed` (default: `pending`).
Mongoose manages `createdAt` and `updatedAt` automatically.

## Task API

Requests and responses use JSON. Use the port configured in your `.env`.

| Method | Path | Result |
| --- | --- | --- |
| POST | `/api/tasks` | Create a task; return the saved task with HTTP 201 |
| GET | `/api/tasks` | Return an array of tasks, newest first, with HTTP 200 |
| GET | `/api/tasks/:id` | Return one task with HTTP 200 |
| PUT | `/api/tasks/:id` | Edit a task; return the updated task with HTTP 200 |
| PATCH | `/api/tasks/:id/complete` | Mark completed; return the task with HTTP 200 |
| DELETE | `/api/tasks/:id` | Delete a task; return a confirmation message with HTTP 200 |

Example create request body:

```json
{
  "title": "Revise MERN basics",
  "description": "Practice creating and reading tasks"
}
```

Only `title`, `description`, and `status` are accepted as task data; other fields
are ignored. IDs and timestamps are managed by MongoDB and Mongoose.
Invalid input or an invalid ID returns HTTP 400. A valid ID with no matching
task returns HTTP 404. Errors have the format `{ "message": "..." }`.
An empty task list returns `[]`.

For editing, send a JSON body with a non-empty `title`. Optional `description`
and `status` fields are changed only when supplied. Send `description: ""` to
clear it. The response contains the saved task and its updated timestamp.
Completing a task requires no body; repeating the action keeps it completed.
Deletion returns `{ "message": "Task deleted successfully." }`; deleting an
already deleted task returns HTTP 404.

Filter with `GET /api/tasks?status=pending` or `?status=completed`. Omit `status`
for all tasks. Unsupported, empty, or repeated status values return HTTP 400.

## Tests

Backend tests:

```powershell
cd server
npm test
```

Frontend tests and production build:

```powershell
cd client
npm test
npm run build
```

The automated tests use mocked API/database operations where appropriate, so
they do not require changing Atlas data. Before submission, also run a manual
browser check: create a task, edit it, mark it completed, filter by status, and
delete it.

## Health Endpoint

Open `http://localhost:5000/api/health` in a browser. A successful request returns
HTTP 200 with:

```json
{
  "status": "ok",
  "message": "Task API is running"
}
```

This checks that the HTTP server is responding; it does not perform a live
MongoDB check on each request.

## Development

Build and verify one milestone at a time, then commit the completed changes.
Keep credentials in local `.env` files. Commit only placeholder values in
`.env.example` files.

## Submission Checklist

- Source code is committed and pushed.
- `server/.env` and `client/.env` are not committed.
- `server/.env.example` and `client/.env.example` are committed.
- Backend and frontend setup instructions are included above.
- MongoDB setup instructions are included above.
- Required API endpoints are documented above.
- Tests and frontend build pass.
- Manual browser workflow passes on desktop and mobile.
