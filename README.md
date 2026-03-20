# Learning Path — Recommendation System

## 👥 Contributors

| รหัสนักศึกษา | ชื่อ-นามสกุล | GitHub |
|---|---|---|
| 663380503-7 | นางสาวกัญญาพัชร ฉายผาด | [@cherryp](https://github.com/cherrryp) |
| 663380515-0 | นายเอกมงคล พลเสนา | [@NGuy2919](https://github.com/NGuy2919$0) |

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

### 4. Install Python dependencies
#### Windows / Linux
```bash
pip install -r requirement.txt
```

#### macOS
```bash
pip3 install -r requirement.txt
```
