# Firebase Authentication Setup Checklist

## Frontend Setup

- [x] Created Firebase configuration (`client/src/config/firebase.js`)
- [x] Created Firebase authentication service (`client/src/services/firebaseAuth.js`)
- [x] Created Firebase Login component (`client/src/components/FirebaseLogin.jsx`)

### Next Steps for Frontend:

1. **Update your Login page** - Replace with `FirebaseLogin.jsx`
   ```jsx
   import FirebaseLogin from "../components/FirebaseLogin";
   ```

2. **Update AppContext** - Store Firebase auth state
   ```jsx
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   ```

3. **Install Firebase package**
   ```bash
   cd client
   npm install firebase
   ```

4. **Set up Google OAuth in Firebase Console**
   - Go to Firebase Console → Authentication → Google
   - Click "Enable"
   - Add localhost (and production domain later)

---

## Backend Setup

- [x] Created Firebase Admin SDK config (`server/config/firebaseAdmin.js`)
- [x] Updated User model with Firebase fields
- [x] Created Firebase auth endpoints
- [x] Updated authentication middleware
- [x] Updated routes

### Next Steps for Backend:

1. **Generate Firebase Service Account Key**
   - Go to Firebase Console → Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `server/config/firebase-service-account.json`
   - ⚠️ Add to `.gitignore`

2. **Update `.env` file**
   ```env
   FIREBASE_ADMIN_EMAIL=your-admin@example.com
   JWT_SECRET=your-super-secret-key
   ```

3. **Install Firebase Admin SDK**
   ```bash
   cd server
   npm install firebase-admin
   ```

4. **Verify Database Indexes**
   - MongoDB should auto-create indexes for:
     - `firebaseUid` (unique)
     - `email` (unique)

---

## Testing the Flow

### 1. Test Email/Password Login
```bash
curl -X POST http://localhost:5000/api/user/firebase-auth \
  -H "Content-Type: application/json" \
  -d '{"idToken":"your-firebase-id-token"}'
```

### 2. Test Google Login
- Click "Login with Google" button in your app
- Select Google account
- Should redirect to admin/user dashboard

### 3. Test Token Refresh
```bash
curl -X POST http://localhost:5000/api/user/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your-refresh-token"}'
```

### 4. Test Protected Routes
```bash
curl -X GET http://localhost:5000/api/user/me \
  -H "Authorization: Bearer your-id-token"
```

---

## Admin Configuration

Set your admin email in `.env`:
```env
FIREBASE_ADMIN_EMAIL=admin@grocerystore.com
```

When this email logs in:
- Role automatically set to `"seller"` (admin)
- Access to admin panel
- Can add products, manage orders

Any other email:
- Role set to `"user"` (customer)
- Can only browse and buy products

---

## Security Checklist

- [ ] Add `firebase-service-account.json` to `.gitignore`
- [ ] Add `.env` to `.gitignore`
- [ ] Use HTTPS in production
- [ ] Set secure Firebase rules
- [ ] Enable email verification in Firebase Console
- [ ] Set up password reset in Firebase Console

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "firebaseUid is required" | Firebase service account key not loaded |
| "Invalid token" | Firebase token has expired or is malformed |
| "User not found" | User doesn't exist in MongoDB yet |
| 401 Unauthorized | Missing or invalid refresh token |
| CORS errors | Add your domain to Firebase console |

---

## Next Features to Implement

1. **Email Verification**
   - Firebase sends verification email
   - Block login until verified

2. **Password Reset**
   - Firebase handles reset link
   - User clicks email link to reset

3. **Account Lockout**
   - After 5 failed attempts
   - Lock for 15 minutes
   - Use `loginAttempts` and `isLocked` fields

4. **Session Management**
   - Track last login
   - Show active sessions
   - Logout from other devices

---

## Questions?

Check:
1. `FIREBASE_SETUP.md` - Backend setup guide
2. `client/src/services/firebaseAuth.js` - Frontend API calls
3. `server/controllers/userController.js` - Backend endpoints
