# Real Google Login Setup

Use these exact steps to enable production-grade Google login.

## 1. Create OAuth credentials

1. Open Google Cloud Console.
2. Create/select a project.
3. Configure OAuth consent screen.
4. Create OAuth Client ID for **Web application**.

## 2. Add authorized origins and redirects

For local development:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/api/auth/google`

For production, add your real domain equivalents.

## 3. Set environment variables

Update `.env`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your-real-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-real-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Important:

- `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` should match.
- Placeholder values will be treated as "not configured" and Google button will be hidden.

## 4. Restart app

After changing `.env`, restart dev server so Next.js reloads environment variables.

## 5. Validate flow

1. Open `/auth/login`
2. Confirm Google button appears
3. Sign in with Google account
4. Verify redirect to `/dashboard`
