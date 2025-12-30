# System Architecture Blueprint

**Last Updated:** December 14, 2025  
**Status:** ✅ Phases 0-7 Complete  
**Deployment:** Live at https://app-plusailabs-com.web.app

## Overview
- **Framework**: Next.js 16 (App Router) with React 19 and Turbopack.
- **Hosting**: Firebase Hosting with SSR served via a Firebase 2nd Gen HTTPS function (`firebase-frameworks-app-plusailabs-com:ssrappplusailabscom`).
- **Data & Auth**: Firebase Auth (client SDK) and Firestore (admin + client).
- **Payments**: Stripe for subscriptions (plus/super SKUs).
- **AI/Media**: Multiple LLM providers (OpenAI, Anthropic, Gemini, etc.) and audio/media generators (ElevenLabs, Suno, Hume, Runway). Voice-print enrollment/verification flows via VIIM/Voice Lock.
- **Platform Type**: AI-powered commerce platform with PWA, social, and messaging capabilities.

## Frontend (Next.js)
- **Entry**: `app/` pages (marketing, dashboard, chat routes such as `/c/[id]`), global layout `app/layout.tsx`, styles `app/globals.css`.
- **Chat UI**: `components/chat/ChatInterface.tsx` wraps `components/viim/NeuralBox.tsx` (text + voice input, model/agent pickers, streaming output, prompt panel).
- **Social Features**:
  - Profile pages (`/profile`, `/u/[handle]`)
  - Explore feed (`/explore`)
  - Public user discovery
  - Content save/post system
- **Commerce UI**:
  - Product cards and listings
  - Video/image media support
  - AI product search integration
  - Transaction tracking
  - Revenue dashboard
- **Messaging**: P2P direct messaging, Notes to Self, drafts system, typing indicators, read receipts
- **State**: React contexts
  - `contexts/AuthContext.tsx` — Firebase auth user/session.
  - `contexts/ChatContext.tsx` — conversation state, message append, model selection.
  - `contexts/NotificationContext.tsx` — toast/inline notifications, Web Push, Notification Center.
- **UI elements**: Reusable components under `components/` (navbars, modals, dataset meters, voice UI, product cards, media viewers, etc.).
- **Models registry**: `lib/models/modelRegistry` family (LLM catalog and handlers).
- **Styling**: Tailwind CSS 4 with modern, responsive design patterns.

## Backend (Next.js API routes)
- Located under `app/api/**`:
  - **Billing**: checkout session, create session, webhook (`stripe`).
  - **LLM**: `/api/llm/{anthropic,gemini,openai,transcribe}`.
  - **VIIM**: dataset/session/profile endpoints for voice enrollment and verification.
  - **Voice Lock**: dataset/profile/session/verify routes.
  - **Social**: Profile endpoints, public profiles, user discovery.
  - **Messaging**: Direct message endpoints, conversation management, drafts, typing indicators.
  - **Commerce**: Product CRUD, transaction logging, commission tracking, revenue analytics, AI product search.
  - **Content**: Post/save system, media uploads, Explore feed.
  - **Notifications**: Web Push subscription management, FCM integration.
- Routes use helpers in `lib/`:
  - **Firebase Admin**: `lib/firebase/admin.ts` (lazy init from env) and `lib/firestore.ts` (user/VIIM profile/session helpers, voiceprint utilities).
  - **Client Firebase**: `lib/firebase/client.ts` for auth/analytics on the client.
  - **Services**: LLM/audio processors, usage tracking, subscription/plan helpers, voice lock engine, commerce helpers, messaging utilities.

## Data & Identity
- **Firestore (admin)**: collections include:
  - `users` — user profiles, preferences, subscription status
  - `viimProfile` — nested voice profile docs
  - `viimSessions` — voiceprint samples/datasets
  - `conversations` — chat conversations and messages
  - `products` — product catalog with metadata, media, pricing
  - `transactions` — purchase history, commissions, revenue tracking
  - `posts` — user-generated content, Explore feed items
  - `notifications` — in-app notification queue
  - `drafts` — message drafts and unsent content
  - See `lib/firestore.ts` helpers for data access patterns
- **Firebase Storage**: Media files (videos, images), product assets, user uploads
- **Auth**: Firebase Auth (client SDK) with optional analytics; server uses Admin SDK for privileged reads/writes.
- **Billing**: Stripe keys and webhook secrets pulled from environment.

## PWA Architecture
- **Service Worker v2**: Offline-first strategy, network-aware error handling, auto-retry logic
- **LocalForage**: Offline message queue, draft persistence, cached content
- **Web Push**: FCM integration for browser notifications, subscription management
- **Manifest**: Install prompts (Chrome, iOS), share target, app shortcuts
- **Native Features**: Haptic feedback, Wake Lock, clipboard utilities, copy/share buttons
- **Performance**: Virtualization for large lists, streaming guards, performance budgets monitoring

## Commerce Infrastructure
- **Product Catalog**: Firestore-based product listings with rich metadata
- **Media Support**: Video and image uploads via Firebase Storage
- **Transaction System**: Purchase logging, commission calculation (5-15% based on product type)
- **Revenue Analytics**: Real-time dashboard for creators, GMV tracking
- **AI Integration**: Product search powered by LLM, decision assistance at purchase moment
- **Explore Feed**: Algorithm-driven content discovery, mixed media feed

## Social & Messaging
- **Profiles**: Social-native profiles (`/profile`), public profiles (`/u/{handle}`)
- **P2P Messaging**: Direct conversations, Notes to Self, real-time updates
- **Drafts System**: Auto-save drafts, offline draft queue
- **Typing Indicators**: Real-time typing status via Firestore listeners
- **Read Receipts**: Message read status tracking
- **Content System**: Save AI outputs, post to Explore, build content library

## Deployment
- **Primary**: `firebase deploy --only hosting` (build + SSR function bundle).
  - Config: `.firebaserc` (project `app-plusailabs-com`), `firebase.json` (hosting + frameworksBackend region `us-central1`).
  - Env: `.env.local` (client keys), server env for Admin SDK + Stripe + model keys.
- **Legacy/alt**: `cloudbuild.yaml` + `Dockerfile` + `deploy-cloudrun.ps1` for container/Cloud Run (unused for current Hosting workflow).
- **PWA Assets**: Service worker, manifest.json, icons, and offline assets bundled automatically.

## Environments & Secrets
- Client env: `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_APP_URL`, Stripe publishable key.
- Server env: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, model API keys (OpenAI/Anthropic/Gemini/etc.).

## Flows (high level)
1) **Auth**: Client initializes Firebase -> `AuthContext` provides user -> server-side handlers use Admin Firestore.
2) **Chat**:
   - Text/voice captured in `NeuralBox`.
   - Voice path: recorder -> `/api/voice-lock/session` (form-data audio) -> Firestore profile/session updates.
   - Text path: message -> `processLLM` dispatches to provider handler -> responses streamed to UI.
   - AI product search: Query products -> LLM context -> Recommendations -> Purchase flow
3) **Billing**:
   - `/api/billing/create-checkout-session` creates Stripe session using plan IDs.
   - Webhook updates subscription status/entitlements.
4) **Voice Enrollment/Verify**:
   - Dataset/profile operations via `lib/firestore.ts` helpers (voiceprints, datasets, verifications).
5) **PWA Install**:
   - Install prompt triggered -> User accepts -> Service Worker registers -> Offline capabilities enabled.
6) **Offline Messaging**:
   - Message sent -> Network check -> If offline, queue in LocalForage -> Auto-retry when online.
7) **Commerce**:
   - Product created -> Upload media -> Post to Explore -> User discovers -> Ask +AI -> Purchase -> Transaction logged -> Commission calculated.
8) **Notifications**:
   - Event occurs -> FCM push sent -> Service Worker receives -> Notification displayed -> User interaction tracked.
9) **Messaging**:
   - Message sent -> Firestore write -> Real-time listener updates -> Typing indicator -> Read receipt.

## Local Development
1) `cp env.local.example .env.local` and fill keys.
2) `npm install`
3) `npm run dev`
4) For Firebase Hosting emulation (optional): `firebase emulators:start --only hosting,functions`

## Observability / Ops
- Cloud Logging by default via Firebase Functions/Hosting.
- No explicit tracing configured; OpenTelemetry dependency present but not wired in main app.
- PWA health monitoring at `/dev/pwa` with performance budgets and real-time metrics.
- Revenue analytics dashboard for transaction and commission tracking.

## Revenue Model
- **SaaS Subscriptions** (40% of ARR): Free tier, Plus ($9/mo), Super Plus ($29/mo)
- **Transaction Fees** (60% of ARR): Affiliate (5%), Direct (10%), Limited drops (15%)
- **Path to $1M ARR**: 1000 active users → 400 paid subscribers @ $83/mo avg + $50 GMV/user/month × 10% take

## Platform Capabilities Summary
- ✅ **PWA**: Install experience, offline resilience, Service Worker v2
- ✅ **Social**: Profiles, public discovery, content system
- ✅ **Messaging**: P2P direct messaging, Notes to Self, drafts, typing indicators
- ✅ **Commerce**: Product listings, media support, transactions, revenue tracking
- ✅ **AI Integration**: Product search, decision assistance, purchase recommendations
- ✅ **Notifications**: Web Push, Notification Center, in-app notifications
- ✅ **Native Feel**: Haptic feedback, Wake Lock, clipboard utilities

## Notable Directories
- `app/` — routes and pages (chat, profile, explore, commerce, messaging).
- `components/` — UI and chat/voice controls, product cards, media viewers, notification UI.
- `contexts/` — global React state providers (Auth, Chat, Notifications).
- `lib/` — Firebase admin/client, LLM/audio processors, subscription/usage helpers, voice lock/VIIM logic, commerce utilities, messaging helpers.
- `public/` — PWA assets (manifest, service worker, icons).
- `functions/` — placeholder Cloud Functions entry (not used for SSR; Hosting generates its own SSR function).
- `scripts/` — build/utility scripts (e.g., `ensureMiddlewareManifest.js`).

## Key Metrics
- **Files Created**: 150+
- **API Endpoints**: 60+
- **Features**: 75+
- **Lines of Code**: 15,000+
- **Deployment**: Live and production-ready

