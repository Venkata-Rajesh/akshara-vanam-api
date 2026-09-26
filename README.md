# Editor Service Backend (InspireHub)

Enterprise-grade backend service built with **Bun.js**, **Express.js**, and **Mongoose** (MongoDB ODM), featuring modular domain-driven architecture, Zod schema validation, JWT authentication, and comprehensive security controls.

---

## 🛠 Tech Stack

- **Runtime**: Bun.js 1.4+
- **Framework**: Express.js
- **Database & ODM**: MongoDB & Mongoose
- **Validation**: Zod
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Security**: Helmet, CORS, Express-Rate-Limit
- **Language**: TypeScript

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/inspirehub
JWT_SECRET=<unique-secret-at-least-32-characters>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:4200
```

Generate the JWT secret with `openssl rand -base64 48`. MongoDB URI and JWT secret are required. Production must set explicit frontend origins in `CORS_ORIGIN`; wildcard origins are rejected.

### 3. Run Development Server

```bash
bun run dev
```

### 4. Build & Type Check

```bash
bun run build
```

### Admin Provisioning

Promote an existing account or bootstrap the first administrator from an operator-controlled environment:

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_USERNAME=Administrator \
ADMIN_PASSWORD=<unique-12-character-secret> \
bun run admin:promote
```

`ADMIN_USERNAME` and `ADMIN_PASSWORD` are required only when creating a new account. Supply the password through a secret manager; do not commit it or store it in a shared `.env` file.

The legacy database seeder may have created `test@gmail.com` with password `test123`. Promote a replacement administrator first, then remove that known-credential account:

```bash
ADMIN_EMAIL=admin@example.com bun run admin:remove-demo
```

The cleanup transfers quotes owned by the demo account to the replacement admin and removes the demo account's reactions and comments. Production startup fails while the known demo administrator password remains active. Never assign the admin role through public signup.

On startup, identifiable entries from legacy quote `likedBy` arrays are migrated to the unique reaction collection. Old aggregate-only `likesCount` values without voter IDs cannot be attributed and are discarded.

---

## 📚 API Endpoints

### 🩺 Health

- `GET /health` - System health, database connection state, and uptime.

### 🔐 Authentication

- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Authenticate user & get JWT token
- `GET /api/v1/auth/me` - Get current user profile _(Bearer token required)_

### 📖 Quotes

- `GET /api/v1/quotes` - Fetch quotes with search (`q`), tag filter (`tag`), and pagination
- `GET /api/v1/quotes/tags` - Fetch distinct tags with count
- `GET /api/v1/quotes/:id` - Fetch single quote by ID
- `POST /api/v1/quotes` - Submit a quote anonymously or while signed in; non-admin submissions remain pending review
- `GET /api/v1/quotes/review/pending` - List pending submissions _(admin only)_
- `PATCH /api/v1/quotes/:id/review` - Approve or reject a submission _(admin only; body: `status: published|rejected`)_
- `PUT /api/v1/quotes/:id/reaction` - Set the signed-in user's reaction _(body: `type: like|dislike|null`)_
- `GET /api/v1/quotes/:quoteId/comments` - List visible comments
- `POST /api/v1/quotes/:quoteId/comments` - Add a comment _(Bearer token required)_
- `PATCH /api/v1/quotes/:quoteId/comments/:commentId` - Edit own comment or admin edit
- `DELETE /api/v1/quotes/:quoteId/comments/:commentId` - Delete own comment or admin delete
- `PATCH /api/v1/quotes/:quoteId/comments/:commentId/moderation` - Hide or restore a comment _(admin only)_
- `PUT /api/v1/quotes/:id` - Update quote _(Bearer token required, creator/admin only; creator edits return to review)_
- `DELETE /api/v1/quotes/:id` - Delete quote _(Bearer token required, creator/admin only)_

Anonymous users may submit quotes but cannot comment, react, edit, or delete. Quote submissions by regular users also require admin approval; admins may publish their own submissions immediately. Only published quotes and visible comments are public.
