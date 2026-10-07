# Learning Path — Recommendation System

---

## 🚀 Getting Started

### 1. Install Node dependencies

```bash
cd frontend
npm install
npm install axios
```

```bash
cd backend
npm install
npm install express-async-handler
```

### 2. Setup environment variables
สร้างไฟล์ `.env` ใน folder `backend`:
```env
DATABASE_URL=your_database_url

JWT_SECRET=your_super_secret_jwt_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Generate Prisma client & Migrate database
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Install Python dependencies (only for the import / embedding scripts)
```bash
pip install -r backend/scripts/requirements.txt   # use pip3 on macOS
```

## 5. Running the Project

### Backend (Node.js)
```bash
cd backend
npm run dev
```

### Frontend (React)
```bash
cd frontend
npm run dev
```
---

## 🧰 Backend notes

- Data import / embedding scripts live in `backend/scripts/` — run them from `backend/`, e.g. `python scripts/import_courses.py`.
- Run backend tests: `cd backend && npm test`
- Optional env vars: `PORT` (default 3000), `CORS_ORIGIN` (comma-separated allowed origins; unset = allow all), `JWT_EXPIRES_IN`.
  `DATABASE_URL` and `JWT_SECRET` are required — the server refuses to start without them.
