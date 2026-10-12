# COMP3123 Assignment 1 — Employee API

Student number: **101564373**. Required repository name: `101564373_COMP3123_Assignment1`.

Repository: https://github.com/kamranomars-sudo/101564373_COMP3123_Assignment1

A REST backend built with Node.js, Express 5, MongoDB, Mongoose, bcryptjs, JWT, Zod, Helmet and express-rate-limit. Users register and log in, then manage only the employees they created.

## Setup

1. Clone your GitHub repository and open its directory.
2. Run `npm install` (Node.js 20 or newer).
3. Copy `.env.example` to `.env`.
4. Set `JWT_SECRET` to a random value of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
5. Start local MongoDB, or set `MONGODB_URI` to your Atlas driver connection string. In Atlas, create a database user and allow your current IP. Atlas login credentials are separate from database credentials. Keep the actual URI only in `.env`; URL-encode special password characters.
6. Run `npm start`. The database name is always `comp3123_assignment1`.
7. Import `postman/assignment1.postman_collection.json` into Postman. Run requests in order. The login requests save tokens, and creation requests save employee IDs.

Configuration: `PORT` defaults to 3000; `MONGODB_URI` and `JWT_SECRET` are required; `JWT_EXPIRES_IN` defaults to `1h`.

## Structure

`src/server.js` connects MongoDB and starts the server. `src/app.js` sets up security, request logging and centralized errors. `routes/` maps endpoints, `controllers/` handles operations, `models/` defines database schemas, `middleware/` authenticates users, `validators/` checks input, and `utils/` contains logging and errors.

## API

| Method | Path | Success | Body / purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/user/signup` | 201 | username, email, password |
| POST | `/api/v1/user/login` | 200 | username OR email, plus password; returns token |
| GET | `/api/v1/emp/employees` | 200 | List current user's employees |
| POST | `/api/v1/emp/employees` | 201 | Create employee |
| GET | `/api/v1/emp/employees/{eid}` | 200 | Retrieve owned employee |
| PUT | `/api/v1/emp/employees/{eid}` | 200 | Replace all editable employee fields |
| DELETE | `/api/v1/emp/employees?eid=xxx` | 204 | Delete owned employee; empty response |
| GET | `/health` | 200 | Server status, database state and uptime |

Signup example: `{"username":"userA","email":"usera@example.com","password":"TestPass123!"}`.

Employee example:

```json
{"first_name":"Alex","last_name":"Test","email":"alex@example.com","position":"Developer","salary":65000,"date_of_joining":"2026-09-01","department":"Engineering"}
```

Successful responses use `user`, `employee`, or `employees` keys. Errors use `{"error":{"message":"..."}}`; validation errors also contain field details. Errors include 400 for invalid inputs, 401 for missing/invalid/expired authentication or wrong credentials, 403 for another user's employee, 404 for absent resources/routes, 409 for duplicate username/email, 429 for rate limits, and 500 for unexpected errors. Oversized JSON returns 413.

## Authentication, ownership and security

Passwords require 8–72 characters, upper/lowercase letters and a number; bcrypt's 72-byte limit is also enforced. Bcrypt hashes passwords with cost 12. Password hashes are excluded from API responses. Login accepts exactly one of username or email. Send `Authorization: Bearer <token>` for every employee request. Tokens use HS256, an expiry, issuer and audience checks. Authentication also checks that the user still exists.

The employee `user` field references a User ObjectId and is assigned from JWT identity. Client-supplied ownership is rejected by strict validation. List queries filter by owner. Retrieve, update and delete queries include both ID and owner; attempts against another owner's employee return 403. Update and delete repeat the owner filter in the mutation itself.

Zod rejects unexpected fields, invalid emails, invalid ObjectIds, nonnumeric/nonpositive salaries and invalid calendar dates. PUT requires every editable field. Query parameters are also validated. The JSON body limit is 16 KB. Helmet adds security headers such as `X-Content-Type-Options` and a content security policy. Environment files and generated logs are excluded from Git. Error responses omit stack traces and database details.

Rate limiting restricts repeated requests per IP over 15 minutes: 20 combined signup/login requests and 200 general API requests. Excess traffic returns 429 with `Retry-After`. This limits brute-force attempts and API abuse. These in-memory limits suit one server process; multiple instances would need a shared limiter store.

## Logs and health

`logs/application.log` contains JSON lines for startup, requests (timestamp/method/path/status), login/signup, CRUD, validation/authentication/authorization failures and errors. Request bodies, headers, passwords, tokens, secrets and database connection strings are never logged. `logs/sample.log` illustrates the format. `/health` returns e.g. `{"status":"ok","database":"connected","uptime":10}`; disconnected database state is explicitly reported.

## Tests and submission evidence

Run `npm test`. Supertest sends real HTTP requests through the Express app; mongodb-memory-server starts a real disposable MongoDB database. Its first run downloads the MongoDB binary. Tests cover signup, duplicate fields, password hashing, both login identifiers, CRUD, input errors, missing/invalid/expired JWTs, malformed JSON, security headers, health, both directions of ownership isolation and 429/Retry-After. Test databases are temporary and separate from Atlas.

Postman uses non-sensitive sample credentials `userA` / `userB` with `TestPass123!`. These users must first be created by the collection. Tests do not create users in Atlas. For rate-limit evidence, import `postman/rate-limit.postman_collection.json` and run 21 iterations after waiting for a fresh 15-minute window. The final request should return 429; wait 15 minutes before repeating authentication tests. The main collection contains more than 20 API calls, but fewer than 20 authentication calls.

Before submission, run the Postman collection against your configured database and capture genuine screenshots of MongoDB collections/hashed passwords/owner references, signup, login, CRUD, validation, cross-user rejection in both directions, rate limit, Helmet headers, health and local logs. Add those screenshots to `evidence/`. Do not expose your `.env`, database credentials or full production tokens. See `evidence/CHECKLIST.md`.

Atlas connectivity was verified successfully; see `evidence/ATLAS-CONNECTION.md`. Recorded Postman and MongoDB screenshots are in `evidence/comp3123_assignment1_screenshots.pdf`. Submit the repository link plus a project ZIP excluding `node_modules`, `.env`, `.git` and generated logs. Review the implementation so you can explain it during evaluation.

## Vercel hosting

The root `index.js` exports the Express application for Vercel and reuses its MongoDB connection between requests. Local development still uses `npm start`. Import the GitHub repository into Vercel with the Express framework preset. Set `MONGODB_URI`, `JWT_SECRET` and `JWT_EXPIRES_IN` in Vercel environment variables; never commit them. Authorize the deployment's outbound network addresses in Atlas before verifying the deployed `/health` endpoint. A production deployment URL has not yet been verified.

Vercel's filesystem is temporary: hosted logs are written to `/tmp/comp3123-logs/application.log` and the Vercel console. Local logs remain in `logs/application.log`. In-memory rate limits apply per server instance; distributed deployments require shared storage for globally consistent limits. `.vercelignore` keeps evidence, local environment files and test files out of the deployment bundle.

The D2L instructions additionally require screenshots in DOCX format. Use `evidence/101564373_Postman_Evidence.docx` after reviewing its layout in Word. Submit the ZIP, screenshot DOCX, GitHub link and verified Vercel API URL.
