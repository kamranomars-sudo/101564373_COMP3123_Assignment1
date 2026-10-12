import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/errors.js';
import { log } from '../utils/logger.js';
export async function signup(req, res) {
  const { username, email, password } = req.validated.body;
  const user = await User.create({ username, email, password: await bcrypt.hash(password, 12) });
  log('signup_success', { userId: String(user._id) });
  res.status(201).json({ user: user.toJSON() });
}
export function login(secret, expiresIn) {
  return async (req, res) => {
    const { username, email, password } = req.validated.body;
    const user = await User.findOne(username ? { username } : { email }).select('+password');
    const valid = user && await bcrypt.compare(password, user.password);
    if (!valid) { log('login_failure'); throw new ApiError(401, 'Invalid credentials'); }
    const token = jwt.sign({}, secret, { subject: String(user._id), expiresIn, algorithm: 'HS256', issuer: 'comp3123-api', audience: 'comp3123-client' });
    log('login_success', { userId: String(user._id) });
    res.json({ token, token_type: 'Bearer', user: user.toJSON() });
  };
}
