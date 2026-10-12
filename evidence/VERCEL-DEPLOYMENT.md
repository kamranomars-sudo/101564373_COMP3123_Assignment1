# Verified Vercel deployment

Verified October 12, 2026.

- API: https://101564373-comp-3123-assignment1.vercel.app
- Health: https://101564373-comp-3123-assignment1.vercel.app/health
- GitHub: https://github.com/kamranomars-sudo/101564373_COMP3123_Assignment1
- Framework: Express; branch: main; root: ./; plan: Hobby.
- MongoDB URI and JWT secret are stored as sensitive environment variables in Vercel.
- Atlas network access includes the explicitly approved `0.0.0.0/0` entry for Vercel's dynamic outbound IP addresses. Database credentials remain required.

Actual health response: HTTP 200, `{"status":"ok","database":"connected","uptime":4}`.

`node scripts/verify-hosted.mjs` passed live checks for username login, email login, employee create/list/get/update/delete, cross-owner GET/PUT/DELETE rejection (403), and missing JWT rejection (401). The temporary verification employee was removed after the checks. Tokens and credentials were not printed.

Hosted logs appear in Vercel runtime logs. Temporary filesystem logs and per-instance rate limiting are described in the README. The recorded local Postman evidence is separate from this live verification.
