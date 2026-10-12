import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { routes } from './routes/index.js';
import { log } from './utils/logger.js';
export function createApp({ secret, expiresIn = '1h', authLimit = 20, apiLimit = 200 }) {
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  const app = express(); app.disable('x-powered-by'); app.use(helmet());
  app.use((req, res, next) => {
    res.on('finish', () => log('request', { method: req.method, path: req.path, status: res.statusCode })); next();
  });
  const limiter = max => rateLimit({ windowMs: 15 * 60 * 1000, limit: max, standardHeaders: 'draft-8', legacyHeaders: false,
    handler(req, res) { log('rate_limit_exceeded', { path: req.path }); res.status(429).json({ error: { message: 'Too many requests; try again later' } }); } });
  app.use('/api', limiter(apiLimit)); app.use(express.json({ limit: '16kb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', uptime: Math.floor(process.uptime()) }));
  const routers = routes(secret, expiresIn, limiter(authLimit));
  app.use('/api/v1/user', routers.user); app.use('/api/v1/emp', routers.emp);
  app.use((_req, res) => res.status(404).json({ error: { message: 'Route not found' } }));
  app.use((err, req, res, _next) => {
    let status = err.status ?? 500; let message = err.message;
    if (err.code === 11000) { status = 409; message = 'Username or email already exists'; }
    else if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON'; }
    else if (err.type === 'entity.too.large') { status = 413; message = 'Request body too large'; }
    else if (err.name === 'ValidationError') { status = 400; message = 'Invalid data'; }
    if (status >= 500) message = 'Internal server error';
    log('error', { path: req.path, status, category: err.name });
    res.status(status).json({ error: { message } });
  });
  return app;
}
