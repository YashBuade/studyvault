# Database Integration Setup Guide

## Overview
This document provides step-by-step instructions to fully integrate Prisma with MySQL/MariaDB for the StudyVault Next.js application.

## Prerequisites
- MySQL or MariaDB server running locally
- Node.js 18+ installed
- Environment variables configured in `.env`

## Current Setup Status

### ✅ Completed
1. **Prisma Schema** - Fully defined in `prisma/schema.prisma`
   - User model with authentication
   - Note model with attachments, comments, likes, ratings, bookmarks, shares
   - File model for uploaded files
   - Support models for Planner, Assignments, Exams, Resources, Notifications
   - All relationships and indexes properly configured

2. **Prisma Client** - Configured in `src/lib/prisma.ts`
   - Using MariaDB adapter for optimal performance
   - Proper singleton pattern to prevent connection leaks
   - Global caching for development and production

3. **Environment Configuration**
   - `.env` contains DATABASE_URL and AUTH_SECRET
   - `.env.example` provides template for other developers
   - DATABASE_URL format: `mysql://root:password@localhost:3306/studyvault`

4. **API Routes** - All properly integrated with Prisma
   - `POST /api/auth/signup` - User registration
   - `POST /api/auth/login` - User authentication
   - `GET /api/notes` - List notes (paginated)
   - `POST /api/notes` - Create note
   - `PATCH /api/notes` - Update note
   - `DELETE /api/notes?id=X` - Soft delete note
   - `GET /api/files` - List files
   - `POST /api/files/upload` - Upload file
   - `PATCH /api/files` - Rename file
   - `DELETE /api/files?id=X` - Delete file

5. **Type Safety**
   - TypeScript properly configured
   - All Prisma client types generated
   - API response types validated with Zod

## Setup Instructions

### Step 1: Configure Environment Variables
Copy `.env.example` and update with your database details:
```bash
cp .env.example .env
# Edit .env with your actual database credentials
```

**Required variables:**
```
DATABASE_URL="mysql://root:password@localhost:3306/studyvault"
AUTH_SECRET="your-random-secret-key"
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```

### Step 3: Run Database Migrations
Create and apply migrations:
```bash
npx prisma migrate dev --name init
```

This will:
- Create all tables defined in schema.prisma
- Set up relationships and indexes
- Generate migration file for version control

### Step 4: Verify Database Connection
Test the connection with a sample query:
```bash
npx prisma db execute --stdin << 'EOF'
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'studyvault';
EOF
```

Alternative - Start the Prisma Studio GUI:
```bash
npx prisma studio
```

### Step 5: Build and Test
```bash
npm run build
```

## Testing the Integration

### Manual API Testing

#### 1. User Registration (Create Account)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

Expected response:
```json
{
  "ok": true,
  "data": {
    "authenticated": true
  }
}
```

#### 2. User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

#### 3. Create a Note
```bash
curl -X POST http://localhost:3000/api/notes \
  -H "Content-Type: application/json" \
  -H "Cookie: studyvault_session=<your-session-token>" \
  -d '{
    "title": "My First Note",
    "content": "This is the content of my note",
    "subject": "Math",
    "semester": "Spring 2024",
    "isPublic": true
  }'
```

#### 4. Get All Notes
```bash
curl -X GET http://localhost:3000/api/notes \
  -H "Cookie: studyvault_session=<your-session-token>"
```

#### 5. Upload a File
```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Cookie: studyvault_session=<your-session-token>" \
  -F "file=@path/to/file.pdf"
```

### Running Tests
```bash
npm run test
```

## Database Schema Highlights

### User Table
- Auto-incrementing ID
- Email uniqueness constraint
- Password hashing with bcryptjs
- Optional avatar URL
- Role-based access control (USER, ADMIN)

### Note Table
- Markdown content support (TEXT field)
- SEO-friendly slug generation
- Soft delete support (deletedAt)
- Full-text searchable (title, content, subject, tags)
- Pagination with cursor support

### File Table
- Original and stored file names
- MIME type tracking
- File size tracking
- Soft delete support
- User-scoped file storage

### Relationships
- One User → Many Notes
- One User → Many Files
- One Note → Many Comments, Likes, Ratings, Bookmarks, Shares
- One Note → Many Attachments (files)

## Troubleshooting

### Connection Error: "ECONNREFUSED"
- Ensure MySQL/MariaDB is running
- Check DATABASE_URL is correct
- Verify port 3306 is accessible

### Error: "PrismaClientConstructorValidationError"
- Run: `npx prisma generate`
- Delete `.next` folder
- Rebuild project

### Permission Denied
- Ensure database user has appropriate permissions
- Grant permissions:
```sql
GRANT ALL PRIVILEGES ON studyvault.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Migrations Fail
- Check existing migrations in `prisma/migrations/`
- Review migration logs in `.prisma/` folder
- Reset database if needed: `npx prisma migrate reset` (⚠️ deletes all data)

## Production Deployment

### Environment Setup
```
DATABASE_URL="mysql://user:password@prod-host:3306/studyvault"
AUTH_SECRET="<generate-random-secret>"
NODE_ENV="production"
```

### Pre-deployment Checklist
1. Run migrations: `npx prisma migrate deploy`
2. Generate client: `npx prisma generate`
3. Build: `npm run build`
4. Test all API routes
5. Verify database backups

### Connection Pooling
For production, consider adding connection pooling:
```
DATABASE_URL="mysql://user:password@host:3306/db?connectionLimit=5"
```

## File Structure

```
.
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   └── migrations/            # Migration history
├── src/lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── auth.ts                # JWT authentication
│   ├── current-user.ts        # User context helper
│   ├── require-user.ts        # Auth middleware
│   └── api/
│       ├── response.ts        # API response types
│       └── logger.ts          # Logging utilities
├── app/api/
│   ├── auth/
│   │   ├── signup/route.ts
│   │   └── login/route.ts
│   ├── notes/
│   │   ├── route.ts           # CRUD operations
│   │   └── [...]              # Related routes
│   └── files/
│       ├── route.ts           # File listing and operations
│       ├── upload/route.ts    # File upload
│       └── [...]              # Related routes
├── .env                       # Local environment (gitignored)
├── .env.example               # Template for developers
└── package.json               # Dependencies
```

## Next Steps

1. **Data Validation**: Test all API endpoints with edge cases
2. **Error Handling**: Monitor error logs for database issues
3. **Performance**: Use Prisma Studio and slow query logs to optimize
4. **Backup Strategy**: Set up automated MySQL backups
5. **Monitoring**: Implement application performance monitoring (APM)

## Support & Documentation

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MySQL/MariaDB Documentation](https://dev.mysql.com/doc/)
- [MariaDB Adapter for Prisma](https://www.prisma.io/docs/orm/overview/database-drivers/mysql-and-mariadb#using-the-mariadb-nodejs-driver)

