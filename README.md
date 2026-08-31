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
JWT_SECRET=inspirehub_enterprise_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 3. Run Development Server
```bash
bun run dev
```

### 4. Build & Type Check
```bash
bun run build
```

---

## 📚 API Endpoints

### 🩺 Health
- `GET /health` - System health, database connection state, and uptime.

### 🔐 Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Authenticate user & get JWT token
- `GET /api/v1/auth/me` - Get current user profile *(Bearer token required)*

### 📖 Quotes
- `GET /api/v1/quotes` - Fetch quotes with search (`q`), tag filter (`tag`), and pagination
- `GET /api/v1/quotes/tags` - Fetch distinct tags with count
- `GET /api/v1/quotes/:id` - Fetch single quote by ID
- `POST /api/v1/quotes` - Create new quote *(Bearer token required)*
- `PUT /api/v1/quotes/:id` - Update quote *(Bearer token required, creator/admin only)*
- `DELETE /api/v1/quotes/:id` - Delete quote *(Bearer token required, creator/admin only)*
- `POST /api/v1/quotes/:id/like` - Toggle like on quote *(Bearer token required)*
