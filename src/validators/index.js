import { z } from 'zod';
import { log } from '../utils/logger.js';
const text = z.string().trim().min(1).max(100);
const email = z.email().max(254).transform(value => value.toLowerCase());
export const signup = z.strictObject({ username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/), email,
  password: z.string().min(8).max(72).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes').regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/) });
export const login = z.strictObject({ username: z.string().trim().min(1).max(30).optional(), email: email.optional(), password: z.string().min(1).max(72) })
  .refine(value => Boolean(value.username) !== Boolean(value.email), 'Provide exactly one of username or email');
export const employee = z.strictObject({ first_name: text, last_name: text, email, position: text,
  salary: z.number().positive().max(1000000000),
  date_of_joining: z.iso.date().refine(value => { const date = new Date(value); return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value; }, 'Invalid calendar date'), department: text });
const id = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid MongoDB ObjectId');
export const employeeParams = z.strictObject({ eid: id });
export const deleteQuery = z.strictObject({ eid: id });
export const emptyQuery = z.strictObject({});
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      log('validation_failure', { method: req.method, path: req.path });
      return res.status(400).json({ error: { message: 'Validation failed', details: result.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })) } });
    }
    req.validated ??= {}; req.validated[source] = result.data; next();
  };
}
