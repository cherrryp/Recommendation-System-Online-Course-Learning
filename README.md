# Learning_Path

## Contributors

| รหัสนักศึกษา | ชื่อ-นามสกุล           | username                                   |
| ------------ | ---------------------- | ------------------------------------------ |
| 663380503-7  | นางสาวกัญญาพัชร ฉายผาด | [@cherryp](https://github.com/cherrryp)    |
| 663380515-0  | นายเอกมงคล พลเสนา      | [@NGuy2919](https://github.com/NGuy2919$0) |

## Setup

### 1. Install dependencies
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

Create `.env`

```env
DATABASE_URL="your_database_url"
```

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Migrate database

```bash
npx prisma migrate dev --name init
```

### 5. Install Requirement for Model

```bash
pip install -r requirement.txt 
```