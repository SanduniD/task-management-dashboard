# Task Management Dashboard

A MERN stack internship assignment for creating, viewing, editing, completing,
filtering, and deleting tasks through a responsive web interface.

## Stack

- MongoDB with Mongoose for data storage
- Express and Node.js for the REST API
- React with Vite for the frontend (pending)

## Project Structure

```text
task-management-dashboard/
|-- client/     React frontend (to be added)
|-- server/     Express backend, database configuration, and Task model
|-- .gitignore
`-- README.md
```

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
An empty task list returns `[]`. Updates, completion, deletion, and filtering
will be added in the next milestone.

## Tests

From `server`, run `npm test`. The tests exercise the HTTP routes with mocked
database operations, so they do not require credentials or change Atlas data.
They cover creation, input validation, lists, individual reads, missing/invalid
IDs, malformed JSON, and database failures. Live database persistence should
also be checked manually with a create request followed by a read request.

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
