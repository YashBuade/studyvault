# 🎓 StudyVault - Complete Setup & Features Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Features Overview](#features-overview)
3. [Configuration](#configuration)
4. [Troubleshooting](#troubleshooting)
5. [Development](#development)

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd studyvault

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser. Authenticated users automatically go to `/dashboard`, while guests see the landing page.

### First Time Setup

1. **Create Account**:
   - Visit `/auth/signup`
   - Sign up with email & password or Google
   - You're automatically logged in and go to dashboard

2. **Create Your First Note**:
   - Click "Create Note" in the dashboard
   - Write your note with formatting
   - Choose to keep it private or share publicly

3. **Upload Files**:
   - Go to "My Files" or "Upload Center"
   - Drag and drop files or click to browse
   - Organize in folders

---

## ✨ Features Overview

### 📝 **Notes Module** (`/dashboard/notes`)

**Create & Edit Notes**:
- Rich text editor with formatting (bold, italic, lists, etc.)
- Highlight important sections
- Add tags for easy categorization
- Attach files directly to notes
- Auto-save prevents data loss

**Notes Management**:
- Search all your notes instantly
- Filter by subject, date, or tags
- Pin frequently used notes
- Archive old notes
- Permanently delete with trash recovery

**Sharing & Collaboration**:
- Generate share link for public notes
- Share with specific classmates
- Get notified of comments and likes
- See who's viewing your note

### 📁 **File Management** (`/dashboard/my-files`)

**File Organization**:
- Create folders to organize materials
- Upload any file type (PDF, Word, images, etc.)
- Bulk upload multiple files at once
- Preview documents directly
- Tag files for quick filtering

**File Operations**:
- Rename files and folders
- Move files between folders
- Share entire folders with classmates
- Set expiration dates for sensitive files
- Recover deleted files from trash (30-day recovery period)

### 📅 **Assignment Planner** (`/dashboard/assignments`)

**Assignment Tracking**:
- Create assignments with due dates
- Set priority levels (low, medium, high)
- Attach relevant materials
- Track completion status
- Get deadline approaching notifications

**Smart Features**:
- Color-coded by priority
- Automatic deadline sorting
- Overdue alert system
- Calculate time remaining
- Integration with calendar

### 📚 **Exam Preparation** (`/dashboard/exams`)

**Exam Management**:
- Schedule upcoming exams
- Link study materials
- Set up study plans
- Track exam results
- Analyze performance

**Study Tools**:
- Group related notes by exam
- Create study guides
- Share exam prep materials
- Collaborate with study groups

### 👤 **Profile & Settings** (`/dashboard/profile`)

**Profile Management**:
- Update avatar and name
- Change email address
- Update password securely
- Set academic information
- View activity history

**Privacy & Security**:
- Control content visibility
- Manage sharing permissions
- View active sessions
- Set up two-factor authentication (coming soon)
- Download your data (GDPR compliance)

### 🔔 **Notifications** (`/dashboard/notifications`)

Get notified about:
- Deadline reminders (24h, 1h before due date)
- Comments on your notes
- Someone shared with you
- Like reactions on public notes
- System announcements

### 🛠️ **Admin Dashboard** (`/dashboard/admin`)

*(Available to admin users only)*

- View system statistics
- Manage users
- Monitor storage usage
- View reports and analytics

---

## ⚙️ Configuration

### Google OAuth Setup

See [OAUTH_SETUP_GUIDE.md](./OAUTH_SETUP_GUIDE.md) for detailed instructions.

**Quick Setup**:
1. Get credentials from [Google Cloud Console](https://console.cloud.google.com)
2. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_id
   GOOGLE_CLIENT_SECRET=your_secret
   ```
3. Restart dev server
4. Test OAuth on login page

### Database Configuration

**Local MySQL**:
```bash
# Start MySQL service first
mysql -u root -p

# Create database
CREATE DATABASE studyvault_db;

# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

**Connection String**:
- Check `prisma.config.ts` for current connection
- Update `.env.local` for custom settings:
  ```env
  DATABASE_URL=mysql://user:password@host:port/database_name
  ```

### Environment Variables

Copy `.env.example` to `.env.local` and update with your values:

```bash
cp .env.example .env.local
```

**Required Variables**:
- (Database is local, no env needed)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (for OAuth)
- `GOOGLE_CLIENT_SECRET` (for OAuth)

**Optional Variables**:
- `NEXT_PUBLIC_APP_URL` (for production)
- `NEXT_PUBLIC_GA_ID` (for analytics)

---

## 🎨 Theme & Customization

### Dark Mode
- Automatic based on system preference
- Manual toggle in header (sun/moon icon)
- Persists to local storage

### Custom Branding

Update the Logo component in `components/ui/logo.tsx`:
```tsx
// Change colors, text, or SVG icon
```

### Styling
- Tailwind CSS for styling (see `tailwind.config.ts`)
- Dark mode support with `dark:` prefix
- CSS variables for theme colors in `app/globals.css`

---

## 🔍 Troubleshooting

### Login Issues

**"Invalid credentials"**
- Check email and password are correct
- Make sure you're using email/password auth (not Google)
- Password is case-sensitive

**"Google Sign-In not available"**
- Check browser console for errors
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- Ensure Google Sign-In script is loaded (check Network tab)
- Try different browser or incognito mode

**"Redirect URI mismatch"**
- In Google Console, exact match required:
  - Local: `http://localhost:3000/api/auth/google`
  - Production: `https://yourdomain.com/api/auth/google`

### Dashboard Issues

**"Page not loading"**
- Clear browser cache (`Ctrl+Shift+Delete`)
- Check console for errors
- Refresh the page (`Ctrl+F5`)

**"Files won't upload"**
- Check file size (current limit: 100MB)
- Verify file type is allowed
- Check available storage in database
- Try different file

**"Deadline notifications not working"**
- Check notification settings in profile
- Verify browser notifications are enabled
- Check browser console for errors

### Database Issues

**"Connection refused"**
```bash
# Verify MySQL is running
mysql -u root -p

# Restart service if needed
# Windows: net start MySQL80
# macOS: brew services restart mysql
# Linux: sudo service mysql restart
```

**"Migration failed"**
```bash
# Check migration status
npx prisma migrate status

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Then run migrations
npx prisma migrate deploy
```

**"Prisma client not generated"**
```bash
# Regenerate client
npx prisma generate

# Restart dev server
npm run dev
```

---

## 👨‍💻 Development

### Project Structure

```
studyvault/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Auth pages (login, signup)
│   └── dashboard/         # Protected dashboard pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── dashboard/        # Dashboard-specific components
├── lib/                   # Utility functions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── tests/                # Test files
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with Turbopack

# Building & Testing
npm run build           # Build for production
npm run test            # Run tests with Vitest
npm run test:e2e        # Run e2e tests with Playwright
npm run lint            # Check code with ESLint
npm lint:fix            # Fix linting issues
npm run type-check      # TypeScript type checking

# Database
npm run db:push         # Update database schema
npm run db:migrate      # Run migrations
npm run db:seed         # Seed sample data (if available)
```

### Code Standards

- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + CSS modules
- **Package Manager**: npm
- **Database ORM**: Prisma
- **API Format**: RESTful JSON

### Adding New Features

1. **Create Database Schema**:
   - Update `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name feature_name`

2. **Create API Route**:
   - Add to `app/api/` (e.g., `/app/api/features/route.ts`)
   - Use TypeScript for type safety

3. **Create UI Components**:
   - Add to `components/`
   - Make reusable and well-documented

4. **Update Tests**:
   - Add unit tests in `tests/api/`
   - Add e2e tests in `tests/e2e/`

5. **Document Changes**:
   - Update this README
   - Add comments to complex code
   - Update API documentation

---

## 📚 Additional Resources

- **[Brand Identity](./BRAND_IDENTITY.md)** - Our mission and values
- **[OAuth Setup Guide](./OAUTH_SETUP_GUIDE.md)** - Detailed Google OAuth configuration
- **[Database Setup](./DATABASE_SETUP.md)** - Database initialization guide
- **[API Documentation](./docs/api/)** - API reference (if available)

---

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📞 Support

- **Issues & Bugs**: Create an issue on GitHub
- **Feature Requests**: Suggest features in discussions
- **Email**: support@studyvault.com

---

## 📋 License

StudyVault is open source and free forever for students.

---

## 🎯 Motto

**"Learn Smart. Study Better. Succeed Together."**

---

## 📊 Current Status

- ✅ **Core Features**: Notes, Files, Assignments, Exams, Profile
- ✅ **Authentication**: Email/Password + Google OAuth
- ✅ **Security**: Encrypted storage, private by default
- ✅ **Responsive**: Works on mobile, tablet, desktop
- ⏳ **Coming Soon**: Real-time collaboration, AI study assistant, Mobile apps

---

Last Updated: February 19, 2025
