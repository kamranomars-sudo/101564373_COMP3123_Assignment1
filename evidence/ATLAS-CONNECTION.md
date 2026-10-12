# Atlas connection verification

Verified October 12, 2026.

- API started successfully on port 3000.
- GET http://localhost:3000/health returned HTTP 200.
- Response: `{"status":"ok","database":"connected","uptime":39}`.
- Database name: `comp3123_assignment1`.
- Database user: `assignment1user`, with readWrite access to the assignment database.
- The current IP was added to Atlas with user approval.
- The database password is stored only in the ignored local `.env` file.

Verification ran outside the sandbox because sandbox networking could not reach the API/Atlas. The in-app browser blocked localhost navigation, so this file records the verified HTTP result; it is not a screenshot.
