# Firebase Setup Guide for Backend

## Step 1: Get Firebase Service Account Key

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **aroma-mart**
3. Click **Settings** (gear icon) → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file as `firebase-service-account.json` in `/server/config/`

## Step 2: Update .env File

Add to your `/server/.env`:

```
FIREBASE_ADMIN_EMAIL=your-admin@email.com
JWT_SECRET=your-super-secret-jwt-key-here
```

## Step 3: Environment Setup

The `firebase-service-account.json` should look like:
```json
{
  "type": "service_account",
  "project_id": "aroma-mart",
  "private_key_id": "...",
  "private_key": "...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

## Step 4: Install Firebase Packages

```bash
npm install firebase-admin
```

## Step 5: Security Notes

⚠️ **IMPORTANT:** 
- Add `firebase-service-account.json` to `.gitignore`
- Never commit service account keys to Git
- Keep FIREBASE_ADMIN_EMAIL secret in production

## Step 6: Test the Setup

Make a POST request to `/api/user/firebase-auth` with Firebase ID token:

```json
{
  "idToken": "firebase-id-token-here"
}
```

Response should include user data and refresh token.
