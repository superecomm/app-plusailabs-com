# System Architecture Blueprint

## Overview
- **Framework**: Next.js 16 (App Router) with React 19 and Turbopack.
- **Hosting**: Firebase Hosting with SSR served via a Firebase 2nd Gen HTTPS function (`firebase-frameworks-app-plusailabs-com:ssrappplusailabscom`).
- **Data & Auth**: Firebase Auth (client SDK) and Firestore (admin + client).
- **Payments**: Stripe for subscriptions (plus/super SKUs).
- **AI/Media**: Multiple LLM providers (OpenAI, Anthropic, Gemini, etc.) and audio/media generators (ElevenLabs, Suno, Hume, Runway). Voice-print enrollment/verification flows via VIIM/Voice Lock.

## Frontend (Next.js)
- **Entry**: `app/` pages (marketing, dashboard, chat routes such as `/c/[id]`), global layout `app/layout.tsx`, styles `app/globals.css`.
- **Chat UI**: `components/chat/ChatInterface.tsx` wraps `components/viim/NeuralBox.tsx` (text + voice input, model/agent pickers, streaming output, prompt panel).
- **State**: React contexts
  - `contexts/AuthContext.tsx` — Firebase auth user/session.
  - `contexts/ChatContext.tsx` — conversation state, message append, model selection.
  - `contexts/NotificationContext.tsx` — toast/inline notifications.
- **UI elements**: Reusable components under `components/` (navbars, modals, dataset meters, voice UI, etc.).
- **Models registry**: `lib/models/modelRegistry` family (LLM catalog and handlers).

## Backend (Next.js API routes)
- Located under `app/api/**`:
  - **Billing**: checkout session, create session, webhook (`stripe`).
  - **LLM**: `/api/llm/{anthropic,gemini,openai,transcribe}`.
  - **VIIM**: dataset/session/profile endpoints for voice enrollment and verification.
  - **Voice Lock**: dataset/profile/session/verify routes.
- Routes use helpers in `lib/`:
  - **Firebase Admin**: `lib/firebase/admin.ts` (lazy init from env) and `lib/firestore.ts` (user/VIIM profile/session helpers, voiceprint utilities).
  - **Client Firebase**: `lib/firebase/client.ts` for auth/analytics on the client.
  - **Services**: LLM/audio processors, usage tracking, subscription/plan helpers, voice lock engine.

## Data & Identity
- **Firestore (admin)**: collections include `users`, nested `viimProfile` doc, `viimSessions`, voiceprint samples/datasets (see `lib/firestore.ts` helpers).
- **Auth**: Firebase Auth (client SDK) with optional analytics; server uses Admin SDK for privileged reads/writes.
- **Billing**: Stripe keys and webhook secrets pulled from environment.

## Deployment
- **Primary**: `firebase deploy --only hosting` (build + SSR function bundle).
  - Config: `.firebaserc` (project `app-plusailabs-com`), `firebase.json` (hosting + frameworksBackend region `us-central1`).
  - Env: `.env.local` (client keys), server env for Admin SDK + Stripe + model keys.
- **Legacy/alt**: `cloudbuild.yaml` + `Dockerfile` + `deploy-cloudrun.ps1` for container/Cloud Run (unused for current Hosting workflow).

## Environments & Secrets
- Client env: `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_APP_URL`, Stripe publishable key.
- Server env: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, model API keys (OpenAI/Anthropic/Gemini/etc.).

## Flows (high level)
1) **Auth**: Client initializes Firebase -> `AuthContext` provides user -> server-side handlers use Admin Firestore.
2) **Chat**:
   - Text/voice captured in `NeuralBox`.
   - Voice path: recorder -> `/api/voice-lock/session` (form-data audio) -> Firestore profile/session updates.
   - Text path: message -> `processLLM` dispatches to provider handler -> responses streamed to UI.
3) **Billing**:
   - `/api/billing/create-checkout-session` creates Stripe session using plan IDs.
   - Webhook updates subscription status/entitlements.
4) **Voice Enrollment/Verify**:
   - Dataset/profile operations via `lib/firestore.ts` helpers (voiceprints, datasets, verifications).

## Local Development
1) `cp env.local.example .env.local` and fill keys.
2) `npm install`
3) `npm run dev`
4) For Firebase Hosting emulation (optional): `firebase emulators:start --only hosting,functions`

## Observability / Ops
- Cloud Logging by default via Firebase Functions/Hosting.
- No explicit tracing configured; OpenTelemetry dependency present but not wired in main app.

## Notable Directories
- `app/` — routes and pages.
- `components/` — UI and chat/voice controls.
- `contexts/` — global React state providers.
- `lib/` — Firebase admin/client, LLM/audio processors, subscription/usage helpers, voice lock/VIIM logic.
- `functions/` — placeholder Cloud Functions entry (not used for SSR; Hosting generates its own SSR function).
- `scripts/` — build/utility scripts (e.g., `ensureMiddlewareManifest.js`).

