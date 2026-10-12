import { Router } from 'express';
import * as users from '../controllers/users.js';
import * as employees from '../controllers/employees.js';
import * as v from '../validators/index.js';
import { authenticate } from '../middleware/auth.js';
export function routes(secret, expiresIn, authLimiter) {
  const user = Router();
  user.use(authLimiter, v.validate(v.emptyQuery, 'query'));
  user.post('/signup', v.validate(v.signup), users.signup);
  user.post('/login', v.validate(v.login), users.login(secret, expiresIn));
  const emp = Router(); emp.use(authenticate(secret));
  emp.route('/employees').get(v.validate(v.emptyQuery, 'query'), employees.list)
    .post(v.validate(v.emptyQuery, 'query'), v.validate(v.employee), employees.create)
    .delete(v.validate(v.deleteQuery, 'query'), employees.remove);
  emp.route('/employees/:eid').all(v.validate(v.emptyQuery, 'query'), v.validate(v.employeeParams, 'params'))
    .get(employees.get).put(v.validate(v.employee), employees.update);
  return { user, emp };
}
