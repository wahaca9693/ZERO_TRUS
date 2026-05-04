# Zero Data Cloud (ZDC)

A unified data management platform (internal + external) for users and applications.  
**Firebase + Supabase + Dropbox + Admin System** — all in one.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Auth | JWT + bcrypt |
| File Storage | Local / S3-compatible |
| Containerization | Docker + Docker Compose |

## Features

- **Authentication**: Register, Login, JWT, 2FA-ready, RBAC (Owner/Admin/Editor/Viewer)
- **Data Management**: Projects, Collections, Data Items with JSON/File support
- **File Manager**: Upload, drag-and-drop, folders, preview
- **API Key Management**: Create keys with scoped permissions
- **Admin Panel**: User management, server monitoring, audit logs
- **Dark Hacker Theme**: Black/Gray/Neon Green professional UI
- **RTL + i18n**: Arabic and English support
- **Version History**: Track changes to data items
- **Audit Logging**: Full activity logs per user

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Using Docker Compose

```bash
docker-compose up -d
```

### Manual Setup

#### Backend

```bash
cd backend
npm install
cp .env.example .env  # Edit with your DB credentials
npx prisma migrate dev
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/users | List users (admin) |
| GET/PUT/DELETE | /api/users/:id | Manage user |
| GET/POST | /api/projects | List/Create projects |
| GET/POST | /api/collections | List/Create collections |
| GET/POST/PUT/DELETE | /api/data | CRUD data items |
| POST | /api/files/upload | Upload file |
| GET/DELETE | /api/files/:id | Get/Delete file |
| GET/POST/DELETE | /api/api-keys | Manage API keys |

## Environment Variables

See `backend/.env.example` for all configuration options.

## License

MIT
