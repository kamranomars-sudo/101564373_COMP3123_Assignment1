import assert from 'node:assert/strict';

const base = 'https://101564373-comp-3123-assignment1.vercel.app';
async function request(path, method = 'GET', body, token, expected = 200) {
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  assert.equal(response.status, expected, `${method} ${path}: expected ${expected}, got ${response.status}`);
  return text ? JSON.parse(text) : null;
}
const health = await request('/health');
assert.equal(health.database, 'connected');
const a = await request('/api/v1/user/login', 'POST', { username: 'userA', password: 'TestPass123!' });
const b = await request('/api/v1/user/login', 'POST', { email: 'userb@example.com', password: 'TestPass123!' });
let id;
try {
  const fields = { first_name: 'Hosted', last_name: 'Verification', email: `hosted-${Date.now()}@example.com`, position: 'Developer', salary: 65000, date_of_joining: '2026-09-01', department: 'Engineering' };
  const created = await request('/api/v1/emp/employees', 'POST', fields, a.token, 201);
  id = created.employee._id;
  await request(`/api/v1/emp/employees/${id}`, 'GET', undefined, a.token);
  const list = await request('/api/v1/emp/employees', 'GET', undefined, a.token);
  assert.ok(list.employees.some(employee => employee._id === id));
  await request(`/api/v1/emp/employees/${id}`, 'GET', undefined, b.token, 403);
  await request(`/api/v1/emp/employees/${id}`, 'PUT', fields, b.token, 403);
  await request(`/api/v1/emp/employees?eid=${id}`, 'DELETE', undefined, b.token, 403);
  await request(`/api/v1/emp/employees/${id}`, 'PUT', { ...fields, salary: 70000 }, a.token);
  await request('/api/v1/emp/employees', 'GET', undefined, undefined, 401);
} finally {
  if (id) await request(`/api/v1/emp/employees?eid=${id}`, 'DELETE', undefined, a.token, 204);
}
console.log('Hosted verification passed: health, username/email login, create/list/get/update/delete, cross-owner GET/PUT/DELETE rejection and missing JWT. Temporary employee removed.');
