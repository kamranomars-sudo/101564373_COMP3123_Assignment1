import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { createApp } from './src/app.js';
import User from './src/models/User.js';
import { log } from './src/utils/logger.js';

let connection;
async function connectDatabase() {
  if (!connection) {
    if (!process.env.MONGODB_URI) throw new Error('Missing database configuration');
    connection = mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'comp3123_assignment1', serverSelectionTimeoutMS: 10000, maxPoolSize: 5
    }).then(async () => { await User.init(); });
    connection.catch(() => { connection = undefined; });
  }
  await connection;
}
const app = express();
app.use(async (_req, res, next) => {
  try { await connectDatabase(); next(); }
  catch { log('database_connection_failure'); res.status(503).json({ error: { message: 'Database temporarily unavailable' } }); }
});
app.use(createApp({ secret: process.env.JWT_SECRET, expiresIn: process.env.JWT_EXPIRES_IN ?? '1h' }));
export default app;
