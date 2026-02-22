# Quick Start - Database Integration

## 🚀 Get Started in 5 Minutes

### Prerequisites
- MySQL/MariaDB running on `localhost:3306`
- Node.js installed
- `.env` file with `DATABASE_URL` set

### Step 1: Install & Generate
```bash
npm install
npx prisma generate
```

### Step 2: Apply Migrations
```bash
npx prisma migrate dev
```

### Step 3: Start Development
```bash
npm run dev
```

### Step 4: Test Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

## 📋 Database Setup Files

### Modified/Created:
1. **src/lib/prisma.ts** - MariaDB adapter integration
2. **.env.example** - Environment template
3. **DATABASE_SETUP.md** - Full setup documentation
4. **DATABASE_INTEGRATION_STATUS.md** - Status report
5. **test-db-integration.js** - Integration tests

### Already Complete:
- ✅ `prisma/schema.prisma` - Full schema with all models
- ✅ `app/api/notes/route.ts` - Note CRUD
- ✅ `app/api/files/route.ts` - File operations
- ✅ `app/api/auth/**` - Authentication
- ✅ All relationships, indexes, constraints

## 🔧 Available Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build

# Database
npx prisma studio            # Open GUI database browser
npx prisma generate          # Regenerate Prisma client
npx prisma migrate dev        # Create/apply migrations
npx prisma db execute --stdin # Execute raw SQL

# Testing
npm run test                  # Run tests
node test-db-integration.js   # Database integration test
```

## ✅ Verification Checklist

- [x] Prisma schema defined with all models
- [x] MariaDB adapter properly configured
- [x] Environment variables set up
- [x] All API routes use Prisma client
- [x] Authentication working with JWT
- [x] Type safety with TypeScript
- [x] Error handling in place
- [x] Migrations ready to deploy

## 🐛 Common Issues

**Issue**: "ECONNREFUSED" / Cannot connect
**Fix**: Verify MySQL is running and DATABASE_URL is correct

**Issue**: "PrismaClientConstructorValidationError"
**Fix**: Run `npx prisma generate && rm -rf .next && npm run build`

**Issue**: Build fails
**Fix**: Run `npm install && npx prisma generate`

## 📚 Full Documentation

See these files for detailed information:
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Complete setup guide
- [DATABASE_INTEGRATION_STATUS.md](./DATABASE_INTEGRATION_STATUS.md) - Status report

## 🎯 Key Endpoints

### Auth
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Notes (require auth)
- `GET /api/notes` - List notes with pagination
- `POST /api/notes` - Create note
- `PATCH /api/notes` - Update note
- `DELETE /api/notes?id=X` - Delete note

### Files (require auth)
- `GET /api/files` - List uploaded files
- `POST /api/files/upload` - Upload new file
- `PATCH /api/files` - Rename file
- `DELETE /api/files?id=X` - Delete file

## ✨ What's Integrated

✅ User authentication with bcryptjs and JWT
✅ Note creation with full CRUD operations
✅ File upload with metadata tracking
✅ Note attachments (files linked to notes)
✅ Comments, likes, ratings on notes
✅ Note sharing with permissions
✅ Content reports and moderation
✅ Planner/assignments/exams support
✅ Learning resources organization
✅ Real-time notifications
✅ Soft delete support
✅ Full-text search ready
✅ Pagination with cursor support
✅ Type-safe API responses

## 🎓 Learning Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [MariaDB with Prisma](https://www.prisma.io/docs/orm/overview/database-drivers/mysql-and-mariadb)

---

**Status**: ✅ Database integration complete and ready for development

