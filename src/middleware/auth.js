import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { ApiError } from '../utils/errors.js';
import { log } from '../utils/logger.js';
export function authenticate(secret) {
  return async (req, _res, next) => {
    try {
      const match = /^Bearer ([^\s]+)$/.exec(req.headers.authorization ?? '');
      if (!match) throw new ApiError(401, 'A Bearer token is required');
      let payload;
      try { payload = jwt.verify(match[1], secret, { algorithms: ['HS256'], issuer: 'comp3123-api', audience: 'comp3123-client' }); }
      catch { throw new ApiError(401, 'Invalid or expired token'); }
      if (typeof payload !== 'object' || !mongoose.isObjectIdOrHexString(payload.sub)) throw new ApiError(401, 'Invalid token identity');
      const user = await User.findById(payload.sub);
      if (!user) throw new ApiError(401, 'User no longer exists');
      req.user = user; next();
    } catch (error) { log('authentication_failure', { status: error.status ?? 500 }); next(error); }
  };
}
