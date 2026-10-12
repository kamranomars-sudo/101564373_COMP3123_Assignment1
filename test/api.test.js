import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
const secret = 'test-only-secret-with-more-than-32-characters';
const app = createApp({ secret, authLimit: 1000, apiLimit: 2000 });
let mongo, a, b, aid, bid;
const employee = { first_name: 'Alex', last_name: 'Test', email: 'alex@example.com', position: 'Developer', salary: 65000, date_of_joining: '2026-09-01', department: 'Engineering' };
const auth = token => ({ Authorization: `Bearer ${token}` });
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'comp3123_assignment1' }); await User.init();
});
after(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });
test('signup, duplicate constraints, validation, hashing and login', async () => {
  for (const username of ['userA', 'userB']) {
    const response = await request(app).post('/api/v1/user/signup').send({ username, email: `${username.toLowerCase()}@example.com`, password: 'TestPass123!' });
    assert.equal(response.status, 201); assert.equal(response.body.user.password, undefined);
  }
  const stored = await User.findOne({ username: 'userA' }).select('+password'); assert.match(stored.password, /^\$2/);
  for (const body of [{ username: 'userA', email: 'other@example.com', password: 'TestPass123!' }, { username: 'other', email: 'usera@example.com', password: 'TestPass123!' }]) assert.equal((await request(app).post('/api/v1/user/signup').send(body)).status, 409);
  for (const body of [{}, { username: 'bad', email: 'bad', password: 'short' }]) assert.equal((await request(app).post('/api/v1/user/signup').send(body)).status, 400);
  a = (await request(app).post('/api/v1/user/login').send({ username: 'userA', password: 'TestPass123!' })).body.token;
  b = (await request(app).post('/api/v1/user/login').send({ email: 'userb@example.com', password: 'TestPass123!' })).body.token;
  assert.ok(a); assert.ok(b);
  assert.equal((await request(app).post('/api/v1/user/login').send({ username: 'userA', password: 'wrong' })).status, 401);
  assert.equal((await request(app).post('/api/v1/user/login').send({})).status, 400);
});
test('authentication, malformed JSON, headers and health', async () => {
  const health = await request(app).get('/health'); assert.equal(health.status, 200); assert.equal(health.body.database, 'connected'); assert.ok(health.headers['x-content-type-options']);
  for (const token of [undefined, 'invalid', jwt.sign({}, secret, { subject: String(new mongoose.Types.ObjectId()), expiresIn: -1, issuer: 'comp3123-api', audience: 'comp3123-client' })]) {
    const req = request(app).get('/api/v1/emp/employees'); if (token) req.set(auth(token)); assert.equal((await req).status, 401);
  }
  assert.equal((await request(app).post('/api/v1/user/signup').set('Content-Type', 'application/json').send('{broken')).status, 400);
  assert.equal((await request(app).get('/unknown')).status, 404);
});
test('employee creation and validation', async () => {
  for (const [token, name] of [[a, 'Alex'], [b, 'Blair']]) {
    const response = await request(app).post('/api/v1/emp/employees').set(auth(token)).send({ ...employee, first_name: name }); assert.equal(response.status, 201);
    if (token === a) aid = response.body.employee._id; else bid = response.body.employee._id;
  }
  for (const body of [{}, { ...employee, email: 'bad' }, { ...employee, salary: -1 }, { ...employee, salary: '65000' }, { ...employee, date_of_joining: '2026-02-30' }, { ...employee, user: String(new mongoose.Types.ObjectId()) }]) assert.equal((await request(app).post('/api/v1/emp/employees').set(auth(a)).send(body)).status, 400);
});
test('both users can only list and manage their own employees', async () => {
  for (const [token, own, other] of [[a, aid, bid], [b, bid, aid]]) {
    const list = await request(app).get('/api/v1/emp/employees').set(auth(token)); assert.equal(list.status, 200); assert.deepEqual(list.body.employees.map(item => item._id), [own]);
    assert.equal((await request(app).get(`/api/v1/emp/employees/${own}`).set(auth(token))).status, 200);
    assert.equal((await request(app).get(`/api/v1/emp/employees/${other}`).set(auth(token))).status, 403);
    assert.equal((await request(app).put(`/api/v1/emp/employees/${other}`).set(auth(token)).send(employee)).status, 403);
    assert.equal((await request(app).delete(`/api/v1/emp/employees?eid=${other}`).set(auth(token))).status, 403);
    const updated = await request(app).put(`/api/v1/emp/employees/${own}`).set(auth(token)).send({ ...employee, salary: 70000 }); assert.equal(updated.status, 200); assert.equal(updated.body.employee.salary, 70000);
  }
  assert.equal((await request(app).get('/api/v1/emp/employees/bad').set(auth(a))).status, 400);
  assert.equal((await request(app).get(`/api/v1/emp/employees/${new mongoose.Types.ObjectId()}`).set(auth(a))).status, 404);
  assert.equal((await request(app).delete('/api/v1/emp/employees').set(auth(a))).status, 400);
  for (const [token, own] of [[a, aid], [b, bid]]) { const response = await request(app).delete(`/api/v1/emp/employees?eid=${own}`).set(auth(token)); assert.equal(response.status, 204); assert.equal(response.text, ''); }
});
test('authentication limiter returns 429 and Retry-After', async () => {
  const limited = createApp({ secret, authLimit: 2 });
  for (let i = 0; i < 2; i++) assert.equal((await request(limited).post('/api/v1/user/login').send({})).status, 400);
  const response = await request(limited).post('/api/v1/user/login').send({}); assert.equal(response.status, 429); assert.ok(response.headers['retry-after']);
});
