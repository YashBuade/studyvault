# Environment Configuration Guide

## Overview
StudyVault requires environment variables for database connection and Google OAuth integration. Follow this guide to set up your environment.

## Setup Steps

### 1. Database Configuration

The application uses Prisma ORM with MySQL/MariaDB. The database URL is configured in `prisma.config.ts` rather than the schema file.

**For Development (localhost):**
```bash
# No additional env file setup needed if running MySQL locally on port 3306
# The prisma.config.ts already contains the connection string
```

**For Production:**
Update `prisma.config.ts` datasources:
```typescript
datasource db {
  provider = "mysql"
  url      = process.env.DATABASE_URL
}
```

Then set in `.env.local`:
```
DATABASE_URL=mysql://username:password@host:port/studyvault_db
```

### 2. Google OAuth Configuration

#### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing):
   - Click "New Project"
   - Enter project name: `StudyVault`
   - Click "Create"
3. Enable the Google+ API:
   - Search for "Google+ API"
   - Click on it and press "Enable"
4. Create OAuth 2.0 Credentials:
   - Go to "Credentials" (left sidebar)
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/google/callback`
     - Production: `https://yourdomain.com/api/auth/google/callback`
   - Click "Create"
5. Copy the credentials:
   - Copy the `Client ID` (starts with numbers-...)
   - Copy the `Client Secret`

#### Step 2: Add to Environment Variables

Create or update `.env.local` in your project root:

```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Notes:**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is public and sent to the browser (hence `NEXT_PUBLIC_` prefix)
- `GOOGLE_CLIENT_SECRET` must never be exposed to the client - keep it private
- The Client ID typically looks like: `123456789-abcdefg.apps.googleusercontent.com`

### 3. Verify Setup

After adding credentials, restart your development server:

```bash
npm run dev
```

Visit `http://localhost:3000/auth/login` or `/auth/signup` and verify:
- [ ] Google Sign-In button appears
- [ ] Clicking it opens Google's authentication dialog
- [ ] You can successfully sign in/up with Google
- [ ] You're redirected to the dashboard
- [ ] Your user profile is created with Google data

### 4. Testing OAuth Callback

The OAuth flow works as follows:

1. **Frontend**: User clicks "Sign in with Google"
2. **Google**: User authenticates and approves
3. **Frontend**: Google returns an ID token to `handleGoogleCallback()`
4. **Backend**: Frontend sends token to `/api/auth/google`
5. **Backend**: Verifies token and creates/updates user
6. **Response**: Returns authentication cookie and redirects to dashboard

If OAuth isn't working:
- [ ] Check browser console for errors
- [ ] Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
- [ ] Confirm redirect URI in Google Console matches your URL + `/api/auth/google`
- [ ] Check that Google+ API is enabled in your project
- [ ] Verify there are no CORS issues (should be handled by Next.js)

## Complete .env.local Template

```env
# Database (if using remote database)
# DATABASE_URL=mysql://user:password@host:port/database_name

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Email Service (future feature)
# SENDGRID_API_KEY=your_key
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your_email
# SMTP_PASS=your_password
```

## Troubleshooting

### OAuth Button Shows Error
- **Problem**: "Google Sign-In is not available"
- **Solution**: Check that Google Sign-In Script is loaded. Open DevTools → Network → look for `accounts.google.com/gsi/client`

### OAuth Callback Fails
- **Problem**: After approving, nothing happens or error appears
- **Solution**: 
  1. Check `/api/auth/google` endpoint is receiving the request
  2. Verify `GOOGLE_CLIENT_SECRET` is correct
  3. Check browser console for specific error messages
  4. Ensure token verification URL is reachable

### "Invalid Redirect URI"
- **Problem**: Google error about redirect URI mismatch
- **Solution**: 
  1. Exact match required between env and Google Console
  2. For local: use `http://localhost:3000` (not `127.0.0.1`)
  3. For production: use `https://yourdomain.com` (no trailing slash)

### User Created But Can't Login
- **Problem**: OAuth succeeds but you're redirected to login again
- **Solution**: Check if `/dashboard` route is properly protected and cookie is being set

## Security Notes

1. **Never commit `.env.local`** - it contains secrets
2. **Rotate secrets** if accidentally exposed
3. **Use HTTPS in production** for OAuth to work correctly
4. **Limit OAuth scopes** - we only request basic profile info
5. **Validate tokens** on backend before creating user sessions

## Next Steps

Once OAuth is configured:
1. Test sign up with Google
2. Test sign in with email/password
3. Test logout functionality
4. Verify user profile appears in dashboard

See [API Documentation](/docs/api) for more implementation details.
