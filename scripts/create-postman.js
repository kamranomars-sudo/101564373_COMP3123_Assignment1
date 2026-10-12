import fs from 'node:fs';
const items = [];
const employee = { first_name: 'Alex', last_name: 'Test', email: 'alex@example.com', position: 'Developer', salary: 65000, date_of_joining: '2026-09-01', department: 'Engineering' };
function add(name, method, path, status, body, token, save) {
  const tests = [`pm.test('Expected HTTP ${status}', () => pm.response.to.have.status(${status}));`];
  if (save) tests.push(`if (pm.response.code === ${status}) pm.collectionVariables.set('${save.key}', pm.response.json().${save.value});`);
  items.push({ name, request: { method, header: [{ key: 'Content-Type', value: 'application/json' }, ...(token ? [{ key: 'Authorization', value: `Bearer {{${token}}}` }] : [])], url: `{{baseUrl}}${path}`, ...(body !== undefined ? { body: { mode: 'raw', raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}) }, event: [{ listen: 'test', script: { type: 'text/javascript', exec: tests } }] });
}
add('Health and Helmet headers', 'GET', '/health', 200);
for (const suffix of ['A', 'B']) {
  add(`Signup User ${suffix}`, 'POST', '/api/v1/user/signup', 201, { username: `user${suffix}`, email: `user${suffix.toLowerCase()}@example.com`, password: 'TestPass123!' });
  add(`Login User ${suffix}`, 'POST', '/api/v1/user/login', 200, { ...(suffix === 'A' ? { username: 'userA' } : { email: 'userb@example.com' }), password: 'TestPass123!' }, undefined, { key: `token${suffix}`, value: 'token' });
  add(`Create Employee ${suffix}`, 'POST', '/api/v1/emp/employees', 201, { ...employee, first_name: suffix === 'A' ? 'Alex' : 'Blair' }, `token${suffix}`, { key: `eid${suffix}`, value: 'employee._id' });
}
add('Duplicate username', 'POST', '/api/v1/user/signup', 409, { username: 'userA', email: 'other@example.com', password: 'TestPass123!' });
add('Duplicate email', 'POST', '/api/v1/user/signup', 409, { username: 'other', email: 'usera@example.com', password: 'TestPass123!' });
add('Invalid signup', 'POST', '/api/v1/user/signup', 400, { username: 'x', email: 'bad', password: 'short' });
add('Missing signup fields', 'POST', '/api/v1/user/signup', 400, {});
add('Wrong password', 'POST', '/api/v1/user/login', 401, { username: 'userA', password: 'wrong' });
add('Missing login fields', 'POST', '/api/v1/user/login', 400, {});
add('Missing JWT', 'GET', '/api/v1/emp/employees', 401);
add('Invalid JWT', 'GET', '/api/v1/emp/employees', 401, undefined, 'invalidToken');
add('Invalid ObjectId', 'GET', '/api/v1/emp/employees/bad', 400, undefined, 'tokenA');
add('Absent employee', 'GET', '/api/v1/emp/employees/000000000000000000000000', 404, undefined, 'tokenA');
for (const [field, value] of [['email', 'bad'], ['salary', -1], ['date_of_joining', '2026-02-30'], ['user', '000000000000000000000000']]) add(`Invalid employee ${field}`, 'POST', '/api/v1/emp/employees', 400, { ...employee, [field]: value }, 'tokenA');
add('Missing employee fields', 'POST', '/api/v1/emp/employees', 400, {}, 'tokenA');
add('Malformed JSON', 'POST', '/api/v1/user/signup', 400, '{broken');
for (const suffix of ['A', 'B']) {
  const other = suffix === 'A' ? 'B' : 'A';
  add(`List User ${suffix} employees`, 'GET', '/api/v1/emp/employees', 200, undefined, `token${suffix}`);
  add(`Get own employee ${suffix}`, 'GET', `/api/v1/emp/employees/{{eid${suffix}}}`, 200, undefined, `token${suffix}`);
  add(`${suffix} cannot get ${other}'s employee`, 'GET', `/api/v1/emp/employees/{{eid${other}}}`, 403, undefined, `token${suffix}`);
  add(`${suffix} cannot update ${other}'s employee`, 'PUT', `/api/v1/emp/employees/{{eid${other}}}`, 403, employee, `token${suffix}`);
  add(`${suffix} cannot delete ${other}'s employee`, 'DELETE', `/api/v1/emp/employees?eid={{eid${other}}}`, 403, undefined, `token${suffix}`);
  add(`Update own employee ${suffix}`, 'PUT', `/api/v1/emp/employees/{{eid${suffix}}}`, 200, { ...employee, salary: 70000 }, `token${suffix}`);
}
for (const suffix of ['A', 'B']) add(`Delete own employee ${suffix}`, 'DELETE', `/api/v1/emp/employees?eid={{eid${suffix}}}`, 204, undefined, `token${suffix}`);
const collection = { info: { name: '101564373 COMP3123 Assignment 1', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json', description: 'Run once against a fresh test database. Signup returns 409 on subsequent runs. Capture screenshots before deletions. Test rate limiting separately after the main collection.' }, variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }, { key: 'invalidToken', value: 'invalid-token' }, ...['tokenA', 'tokenB', 'eidA', 'eidB'].map(key => ({ key, value: '' }))], item: items };
fs.mkdirSync('postman', { recursive: true });
fs.writeFileSync('postman/assignment1.postman_collection.json', JSON.stringify(collection, null, 2));
const rate = { ...collection, info: { ...collection.info, name: 'Assignment 1 — Rate Limit (run 21 iterations)' }, item: [{ name: 'Repeated invalid login', request: { method: 'POST', header: [{ key: 'Content-Type', value: 'application/json' }], url: '{{baseUrl}}/api/v1/user/login', body: { mode: 'raw', raw: '{}' } }, event: [{ listen: 'test', script: { exec: ["pm.test('Rejected or rate limited', () => pm.expect([400,429]).to.include(pm.response.code));", "if (pm.response.code === 429) pm.test('Retry-After present', () => pm.expect(pm.response.headers.has('Retry-After')).to.be.true);"] } }] }] };
fs.writeFileSync('postman/rate-limit.postman_collection.json', JSON.stringify(rate, null, 2));
