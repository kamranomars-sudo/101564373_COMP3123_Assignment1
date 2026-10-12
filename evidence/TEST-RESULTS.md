# Automated test results

Executed October 12, 2026 with `npm test`, Node.js v24.13.1 and a real disposable MongoDB instance supplied by mongodb-memory-server.

Result: **5 test groups passed; 0 failed**.

1. Signup, unique username/email, validation, bcrypt hash storage, login using username and email.
2. Missing/invalid/expired JWTs, malformed JSON, Helmet headers, database-connected health check, unsupported route.
3. Employee creation, invalid/missing fields, invalid email/salary/calendar date and client-supplied ownership.
4. Both users' list isolation, owned get/update/delete, cross-user get/update/delete returning 403 in both directions, invalid/missing IDs and absent resources.
5. Authentication rate limiter: 429 with Retry-After after configured test threshold of two requests. Production threshold remains 20 per 15 minutes.

The sandbox run could not start mongod; running the same tests outside the sandbox passed in approximately 5 seconds. These results verify the local implementation. They are not Atlas or Postman screenshots and do not replace the required submission evidence.
