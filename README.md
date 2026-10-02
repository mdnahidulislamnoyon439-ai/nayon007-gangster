# Nayon 007 Gangster — Full Website Demo

## Included
- Home / About / Contact
- Uploaded profile photo
- Customer registration + login
- Customer community feed (Facebook-style basic posting)
- Admin dashboard with customer list
- SQLite database
- Password hashing with bcrypt
- Session-based authentication

## Run locally
1. Install Node.js 18+.
2. Open this folder in a terminal.
3. Run: `npm install`
4. Run: `npm start`
5. Open: `http://localhost:3000`

## Admin login
Email: `admin@nayon007.com`
Password: `Nayon007@2026!`

For production, set a strong `ADMIN_PASSWORD` and `SESSION_SECRET` environment variable, use HTTPS, and add a real email/password reset flow, CSRF protection, rate limiting, and secure cookies.
