# HireFlow — Backend (Remote Interview Platform) ✅

A concise, production-ready backend for a remote interview platform that handles session management, real-time video calls, and chat. This repository powers core features like creating/joining interview sessions, Stream-powered video + chat, Clerk-based authentication, and event sync using Inngest.

---

## Table of Contents

- ✅ Features
- 🧰 Tech Stack
- ⚙️ Setup & Run
- 🔐 Environment Variables
- 🚀 Scripts
- 📦 Models (DB)
- 🔁 Event handlers (Inngest)
- 🔌 API Endpoints
- 💡 Notes & Deployment
- 🤝 Contributing & License

---

## Features ✅

- Create, join, and end interview sessions
- Real-time video calls (Stream Video)
- Chat channels per session (Stream Chat)
- User sync from Clerk events (user.created / user.deleted)
- Protected routes using Clerk auth
- MongoDB (Mongoose) for persistence

---

## Tech Stack 🧰

- Node.js (ES Modules)
- Express (v5)
- MongoDB + Mongoose
- Clerk (authentication)
- Stream (chat: `stream-chat`, video: `@stream-io/node-sdk`)
- Inngest (event-driven functions)
- dotenv, CORS
- Dev: nodemon

Key packages (from `package.json`): `express`, `mongoose`, `@clerk/express`, `stream-chat`, `@stream-io/node-sdk`, `inngest`, `dotenv`, `cors`.

---

## Setup & Run ⚙️

1. Clone repo:

```bash
git clone <this-repo>
cd hireflow-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with required variables (see next section).

4. Start development server:

```bash
npm run dev
```

5. (Optional) Run Inngest locally for event handlers:

```bash
npm run inngest
```

6. Production start:

```bash
npm start
```

---

## Environment Variables 🔐

Create `.env` with placeholders. Required/used variables:

- `PORT` — Server port (default: 3000)
- `DB_URL` — MongoDB connection string (required)
- `NODE_ENV` — environment (e.g., development, production)
- `CLIENT_URL` — front-end origin for CORS
- `INNGEST_EVENT_KEY` — (if using Inngest)
- `INNGEST_SIGNING_KEY` — (if using Inngest)
- `STREAM_API_KEY` — Stream app API key
- `STREAM_API_SECRET` — Stream app API secret
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key (frontend)
- `CLERK_SECRET_KEY` — Clerk secret key (server)

Example `.env` (DO NOT COMMIT secrets):

```
PORT=3000
DB_URL=mongodb://localhost:27017/hireflow
NODE_ENV=development
CLIENT_URL=http://localhost:3000
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
CLERK_PUBLISHABLE_KEY=your_clerk_publishable
CLERK_SECRET_KEY=your_clerk_secret
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

---

## Scripts 🚀

- `npm run dev` — Start with nodemon (development)
- `npm start` — Start production
- `npm run inngest` — Run Inngest dev server to test event functions

---

## Models (Mongoose) 📦

- **User**

  - `name`: String (required)
  - `email`: String (required, unique)
  - `profileImage`: String
  - `clerkId`: String (required, unique)

- **Session**
  - `problem`: String (required)
  - `difficulty`: String (enum: `easy|medium|hard`, required)
  - `host`: ObjectId (ref: `User`)
  - `participant`: ObjectId (ref: `User`, default `null`)
  - `status`: String (enum: `active|completed`, default `active`)
  - `callId`: String (generated for Stream)

---

## Inngest Event Functions 🔁

- `sync-user` — Listens to `clerk/user.created`. Creates user in DB and upserts Stream user.
- `delete-user-from-db` — Listens to `clerk/user.deleted`. Deletes user from DB and Stream.

Served at: `/api/inngest` via Inngest Express middleware.

---

## API Endpoints 🔌

All protected routes require Clerk authentication (`clerkMiddleware()` + `requireAuth()` via `protectRoute`). Client must be logged in through Clerk and send the appropriate session cookie/Authorization per Clerk docs.

Base path: `/api`

- `GET /health`

  - Healthcheck (returns basic success JSON).

- `GET /books`

  - Demo/test route (returns basic success JSON).

- Inngest

  - `POST /api/inngest` — Inngest endpoint served via `/api/inngest` (handled by Inngest lib).

- Chat

  - `GET /api/chat/token` — Protected
    - Returns a Stream chat token and user info:
    - Response example:
    ```json
    {
      "token": "<stream_token>",
      "userId": "<clerkId>",
      "userName": "<name>",
      "userImage": "<image_url>"
    }
    ```

- Sessions
  - `POST /api/sessions` — Protected — Create session
    - Body: `{ "problem": "String", "difficulty": "easy|medium|hard" }`
    - Server generates a `callId`, creates Stream video call and chat channel, stores session in DB.
  - `GET /api/sessions/active` — Protected — Get active sessions (latest 20)
  - `GET /api/sessions/my-recent` — Protected — Get recent completed sessions for user
  - `GET /api/sessions/:id` — Protected — Get session by id
  - `POST /api/sessions/:id/join` — Protected — Join a session (adds participant to session and stream channel)
  - `POST /api/sessions/:id/end` — Protected — End session (host-only; deletes Stream room & channel; marks session completed)

Notes:

- For creating and joining sessions, Stream resources (video call & chat channel) are created/updated automatically by the server.
- `callId` is used as the unique channel name/id for both chat & video.

---

## Authentication 🔐

- Uses Clerk (`@clerk/express`) for auth.
- `protectRoute` middleware ensures routes can only be accessed by logged-in users. The middleware extracts `clerkId` from `req.auth()` and finds the corresponding `User` in DB to populate `req.user`.

---

## Deployment Notes 💡

- If `NODE_ENV === "production"`, the server sends static assets from `../frontend/dist`. When deploying backend and frontend together, place built frontend in `frontend/dist` relative to the backend root (per server logic in `src/server.js`).
- Ensure all relevant secrets are set in environment variables in production (Stream keys, Clerk keys, DB_URL, Inngest keys).

---

## Testing & Development Tips 🔧

- Use `npm run dev` while developing.
- To test Inngest functions locally, run `npm run inngest`.
- You will need valid Stream API keys and Clerk keys to test chat / video and authentication flows locally.

---

## Contributing & License 🤝

- Contributions: Open to improvements — create PRs with clear descriptions.
- License: ISC (as in `package.json`).

---

.
