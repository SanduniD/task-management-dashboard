import mongoose from 'mongoose';
import dns from 'node:dns';

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Set MONGODB_URI in server/.env before starting the backend.');
  }

  if (process.env.DNS_SERVERS?.trim()) {
    try {
      dns.setServers(process.env.DNS_SERVERS.split(',').map((server) => server.trim()));
    } catch {
      throw new Error('DNS_SERVERS must contain comma-separated DNS server IP addresses.');
    }
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected');
  } catch {
    // Keep credentials and connection details out of console output.
    throw new Error(
      'MongoDB connection failed. Check MONGODB_URI, database user permissions, Atlas IP access, and cluster availability.',
    );
  }
}
