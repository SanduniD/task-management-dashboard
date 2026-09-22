import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

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
