import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

const app = express();
const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Task API is running' });
});

try {
  await connectDB();

  const server = app.listen(port, () => {
    console.log(`Task API is running at http://localhost:${port}`);
  });

  server.on('error', (error) => {
    console.error(`Failed to start the server: ${error.message}`);
    process.exit(1);
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
