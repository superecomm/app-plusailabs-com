# Local Development Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp env.local.example .env.local
```

### 3. Configure Firebase (Required for Auth & Database)

The app will load without Firebase, but authentication and data features won't work until configured.

#### Get Firebase Credentials:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. **Enable Authentication:**
   - Go to **Authentication** → **Sign-in method**
   - Enable **Email/Password**
4. **Enable Firestore:**
   - Go to **Firestore Database** → **Create database**
   - Start in **test mode** (for development) or production mode
5. **Get Client SDK Config:**
   - Go to **Project Settings** → **General**
   - Scroll to "Your apps" → Web app (or create one)
   - Copy the config values
6. **Get Admin SDK Credentials:**
   - Go to **Project Settings** → **Service Accounts**
   - Click **"Generate New Private Key"**
   - Download the JSON file
   - Extract values for `.env.local`

#### Fill in `.env.local`:

```env
# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note:** For the `FIREBASE_PRIVATE_KEY`, copy the entire private key from the JSON file, including the `\n` newlines. Keep the quotes.

### 4. Start the Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Optional: Additional Configuration

### LLM Provider API Keys (For AI Features)

To use AI chat features, add your API keys to `.env.local`:

```env
# LLM Provider API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

### Stripe (For Billing Features)

If you want to test subscription features:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_PRICE_PLUS=price_id_1
STRIPE_PRICE_SUPER=price_id_2
STRIPE_SUCCESS_URL=http://localhost:3000/subscribe/return
STRIPE_CANCEL_URL=http://localhost:3000/subscribe?canceled=1
```

### ML Service (For Voice Features - Optional)

For full voice fingerprint (VIIM) functionality:

1. **Start the ML service** (in a separate terminal):

```bash
cd services/viim-ml
pip install -r requirements.txt
python main.py
```

2. **Add to `.env.local`:**

```env
ML_SERVICE_URL=http://localhost:8000
```

3. **Restart the Next.js dev server**

The ML service will download the ECAPA-TDNN model (~100MB) on first run.

---

## Troubleshooting

### Port 3000 Already in Use

Use a different port:

```bash
npm run dev -- -p 3001
```

Then access: **http://localhost:3001**

### Firebase Errors

- **"Firebase not initialized"**: Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set
- **"Permission denied"**: Check Firestore rules and ensure test mode is enabled for development
- **"Invalid API key"**: Verify your Firebase config values are correct

### Environment Variables Not Loading

- Make sure the file is named exactly `.env.local` (not `.env.local.txt`)
- Restart the dev server after changing environment variables
- Check that variables starting with `NEXT_PUBLIC_` are for client-side use

### ML Service Issues

- **"No space left on device"**: Free up disk space or use stub mode
- **Port 8000 in use**: Change port in `services/viim-ml/main.py`
- **Model download fails**: Check internet connection; model downloads to `~/.cache/huggingface/`

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed:firestore` - Seed Firestore with test data

---

## Development Tips

1. **Hot Reload**: Changes to code automatically refresh the browser
2. **TypeScript**: The project uses TypeScript - check the terminal for type errors
3. **Firebase Emulator** (Optional): For local Firebase testing:
   ```bash
   firebase emulators:start --only hosting,functions,firestore,auth
   ```
4. **Browser DevTools**: Use React DevTools and browser console for debugging

---

## Next Steps

Once the app is running:

1. **Test Authentication**: Sign up/login at http://localhost:3000
2. **Try Chat**: Use the main chat interface to test AI features
3. **Explore Features**: 
   - `/profile` - User profile
   - `/explore` - Content discovery
   - `/messages` - Messaging
   - `/viim` - Voice enrollment
   - `/vault` - Context storage

---

## Need Help?

- Check the browser console for errors
- Review terminal output for build/runtime errors
- See `devdocdir/` for additional documentation
- Check `docs/system-architecture.md` for system overview

