import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import User from './models/User.js';
import { log } from './utils/logger.js';
try {
  const app = createApp({ secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN ?? '1h' });
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'comp3123_assignment1', serverSelectionTimeoutMS: 10000 });
  await User.init();
  const port = Number(process.env.PORT ?? 3000);
  const server = app.listen(port, () => { log('server_started', { port }); console.log(`API listening on port ${port}`); });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await mongoose.disconnect(); process.exit(0); }));
} catch (error) { log('startup_failure', { category: error.name }); console.error('Startup failed. Check MongoDB connectivity and environment configuration.'); process.exitCode = 1; }
