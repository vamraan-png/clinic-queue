# Clinic Queue System (Tokens + Live Status + Display Screen)

A queue/token management system for clinics to reduce waiting confusion at reception. Patients receive a token and can track live status; clinic staff can call next/serve/skip; a public display screen can be shown on a TV; token slips are printable with a QR code.

**Live Demo (Render):** https://clinic-queue-c4i7.onrender.com

---

## Features

### Admin (Owner / Reception)
- Secure login (JWT in HttpOnly cookie)
- Doctor management (create, enable/disable)
- Token issuing (per doctor, per day)
- Queue controls: **Call Next**, **Served**, **Skip**, **Cancel**
- Live-updating admin queue (SSE)
- Staff accounts (Owner can create/disable Reception users)
- Forced password change on first login (temp password accounts)
- Print token slip (80mm thermal friendly) with QR + tracking link

### Patient (No login)
- Live token status page: `/t/:publicId`
- Status: WAITING / CALLED / SERVED / SKIPPED / CANCELLED
- Live updates via SSE

### Public Display (TV Screen)
- One screen showing all active doctors
- Now Serving + Next tokens
- Live updates via SSE
- URL: `/display`

---

## Reception Workflow (How to Use)

1. **Owner logs in**
   - Go to: `/login`
   - Create doctors (e.g., Dr. Asha with code `A`)

2. **Reception logs in**
   - Owner creates a reception account from: `/admin/users`
   - Reception logs in and changes the temporary password

3. **Create token**
   - Open: `/admin`
   - Select a doctor → create token using patient name and optional phone

4. **Call Next**
   - Reception clicks **Call Next**
   - Token status becomes **CALLED**
   - Patient tracking page updates automatically

5. **Serve / Skip / Cancel**
   - After consultation: mark **Served**
   - If patient absent: **Skip**
   - If token removed: **Cancel**

6. **TV Display**
   - Open: `/display` on a monitor/TV
   - Shows “Now Serving” and “Up Next” for all doctors

7. **Print Slip**
   - In doctor queue page, click **Print** for a token
   - Hand over the slip to the patient (includes QR + tracking link)

   ---

## Screenshots (Add Later)
Add screenshots here when ready:
- Admin Doctors page
- Queue page
- TV Display screen
- Printed slip preview

Example:

---

## Roles
- **OWNER**: Full access (manage doctors + staff)
- **RECEPTION**: Manage tokens/queue (cannot manage staff)

---

## Tech Stack
- **Backend:** Node.js, Express, MongoDB Atlas (Mongoose)
- **Frontend:** React (Vite), Material UI
- **Realtime:** SSE (Server-Sent Events)
- **Optional SMS:** Twilio (only when token is CALLED)

---

## Project Structure

clinic-queue/
client/ # React (Vite)
server/ # Express + MongoDB
PROGRESS.md
.env.example
package.json


Key deployment design:
- Backend API is served under **/api**
- Frontend calls APIs using **relative URLs** like `/api/...`
- In production, Express serves the React build so routes don’t break on Render

---

## Environment Variables

Use `.env.example` as reference.

Minimum required:
- `MONGODB_URI`
- `JWT_SECRET`

Recommended:
- `CLINIC_TIMEZONE=Asia/Kolkata`
- `APP_URL=http://localhost:5173` (local)
  - In production: `APP_URL=https://clinic-queue-c4i7.onrender.com`

Owner seed (first run only):
- `OWNER_EMAIL`
- `OWNER_PASSWORD`
- `OWNER_NAME`

Optional Twilio:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Security note:
- Do **not** commit `.env`
- After first successful production deploy, remove `OWNER_PASSWORD` from Render env

---

## Local Development (PowerShell)

### Install
```powershell
npm install

npm -w server run dev  
npm -w client run dev

Admin: http://localhost:5173/login
Display: http://localhost:5173/display

Set Render environment vars:

NODE_ENV=production
MONGODB_URI=<atlas-uri>
JWT_SECRET=<long-secret>
APP_URL=https://clinic-queue-c4i7.onrender.com
CLINIC_TIMEZONE=Asia/Kolkata
QA after deploy:

/api/health returns JSON
Refresh works on: /login, /admin, /admin/doctors/:id, /admin/print/:id, /display, /t/:id
SSE works on: /display, /t/:id, admin queue page

Main Routes
Frontend
/login – admin login
/admin – doctors
/admin/doctors/:doctorId – queue management
/admin/users – staff management (OWNER only)
/admin/change-password – change password
/admin/print/:tokenId – printable slip
/display – public display screen
/t/:publicId – patient tracking page
Backend (API)
GET /api/health
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me
POST /api/auth/change-password