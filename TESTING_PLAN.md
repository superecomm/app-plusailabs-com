# Testing Plan - +AI Labs Application

## Overview
This document outlines a comprehensive testing strategy for the +AI Labs application before moving to bug fixes.

**Goal:** Identify all issues, categorize them by severity, and create a prioritized fix plan.

---

## Phase 1: Environment Setup & Initial Checks

### 1.1 Local Development Setup
- [ ] Install dependencies: `npm install`
- [ ] Create `.env.local` from `env.local.example`
- [ ] Configure Firebase credentials
- [ ] Start dev server: `npm run dev`
- [ ] Verify app loads at `http://localhost:3000`
- [ ] Check browser console for errors
- [ ] Check terminal for build/runtime errors

### 1.2 Build Verification
- [ ] Run `npm run build` - should complete without errors
- [ ] Check for TypeScript errors
- [ ] Check for linting errors: `npm run lint`
- [ ] Verify all routes compile successfully

### 1.3 Environment Variables Check
- [ ] All `NEXT_PUBLIC_FIREBASE_*` variables set
- [ ] Firebase Admin SDK credentials configured
- [ ] Optional: LLM API keys (OpenAI, Anthropic, Gemini)
- [ ] Optional: Stripe keys (for billing features)
- [ ] Optional: ML Service URL (for voice features)

---

## Phase 2: Core Functionality Testing

### 2.1 Authentication & User Management

#### Sign Up Flow
- [ ] Navigate to home page
- [ ] Click sign up / create account
- [ ] Test email/password sign up
- [ ] Test Google OAuth sign up
- [ ] Verify user profile created in Firestore
- [ ] Verify default preferences created
- [ ] Check for error handling (invalid email, weak password, etc.)

#### Sign In Flow
- [ ] Test email/password sign in
- [ ] Test Google OAuth sign in
- [ ] Test "Remember me" / session persistence
- [ ] Test sign out functionality
- [ ] Verify session clears on logout

#### User Profile
- [ ] Access `/profile` page
- [ ] View profile information
- [ ] Edit display name
- [ ] Upload profile photo
- [ ] Update bio
- [ ] Change handle (if available)
- [ ] Verify changes persist

#### User Preferences
- [ ] Access settings/preferences
- [ ] Change theme (light/dark)
- [ ] Toggle notifications
- [ ] Change default AI model
- [ ] Update audio settings
- [ ] Verify preferences save

---

### 2.2 AI Chat System

#### Basic Chat
- [ ] Open main chat interface (`/`)
- [ ] Send a text message
- [ ] Verify message appears in UI
- [ ] Verify AI response streams in
- [ ] Test with different AI models (GPT-4, Claude, Gemini)
- [ ] Test model switching mid-conversation

#### Conversation Management
- [ ] Create new conversation
- [ ] Load existing conversation
- [ ] Rename conversation
- [ ] Delete conversation
- [ ] Verify conversation history persists
- [ ] Test conversation list/sidebar

#### Streaming & State Management
- [ ] Verify streaming responses work
- [ ] Test cancellation mid-stream
- [ ] Test error handling (API failures, rate limits)
- [ ] Verify state machine transitions correctly
- [ ] Test token counting and budget enforcement
- [ ] Test stalled detection and recovery

#### Voice Input
- [ ] Test voice recording button
- [ ] Record audio message
- [ ] Verify transcription appears
- [ ] Test audio playback
- [ ] Test voice-to-text accuracy

#### Vault Integration
- [ ] Type `+` in chat input
- [ ] Verify vault autocomplete appears
- [ ] Select vault item
- [ ] Verify `+token` inserted
- [ ] Send message with vault reference
- [ ] Verify vault content injected into prompt
- [ ] Check vault sources displayed under response

---

### 2.3 Vault System

#### Vault Management
- [ ] Access vault (from profile or chat)
- [ ] View vault bio
- [ ] Edit vault bio
- [ ] Create folder
- [ ] Upload file
- [ ] Organize files into folders
- [ ] Delete files/folders
- [ ] Verify vault content persists

#### Vault Autocomplete
- [ ] Test `+` trigger in chat
- [ ] Test fuzzy search (type `+family`)
- [ ] Test keyboard navigation (arrow keys, Enter, Escape)
- [ ] Test mouse selection
- [ ] Verify token insertion
- [ ] Test with multiple vault items

#### Vault Usage Tracking
- [ ] Check vault usage logs
- [ ] Verify tier-based character budgets
- [ ] Test vault resolution API
- [ ] Verify audit logging

---

### 2.4 Voice Security (VIIM/Voice Lock)

#### Voice Enrollment
- [ ] Navigate to `/viim/setup` or `/voice-lock/setup`
- [ ] Start voice enrollment
- [ ] Record multiple voice samples
- [ ] Verify dataset creation
- [ ] Check enrollment progress meter
- [ ] Verify voice profile created

#### Voice Verification
- [ ] Navigate to `/viim/verify` or `/voice-lock/verify`
- [ ] Record verification sample
- [ ] Verify match/no-match result
- [ ] Test with different voice samples
- [ ] Check verification history

#### Voice Sessions
- [ ] View voice sessions list
- [ ] Check session details
- [ ] Test session management
- [ ] Verify dataset switching

---

### 2.5 Social Features

#### Public Profiles
- [ ] Access own profile at `/profile`
- [ ] Access public profile at `/u/[handle]`
- [ ] Test profile discovery/search
- [ ] Test privacy settings
- [ ] Verify public/private toggle
- [ ] Check profile stats display

#### Content System
- [ ] Save AI response to content
- [ ] View saved content in profile
- [ ] Post content to Explore
- [ ] Edit/delete saved content
- [ ] Test content filters (All, Posts, Saved, Media)

#### Explore Feed
- [ ] Navigate to `/explore`
- [ ] View explore feed
- [ ] Test content discovery
- [ ] Test search functionality
- [ ] Verify content loads correctly

---

### 2.6 Messaging System

#### Direct Messaging
- [ ] Navigate to `/messages`
- [ ] View message threads list
- [ ] Start new conversation
- [ ] Send message
- [ ] Receive message (test with 2 accounts)
- [ ] Test real-time updates
- [ ] Verify message delivery

#### Notes to Self
- [ ] Create note to self
- [ ] Send message to self
- [ ] Verify appears in threads

#### Drafts System
- [ ] Start typing message
- [ ] Close composer
- [ ] Reopen - verify draft saved
- [ ] Test draft auto-save
- [ ] Test offline draft queue

#### Typing Indicators
- [ ] Test typing indicator appears
- [ ] Verify typing status updates
- [ ] Test typing timeout

#### Read Receipts
- [ ] Send message
- [ ] Verify read receipt updates
- [ ] Test read status display

#### At-Mentions
- [ ] Type `@` in message composer
- [ ] Verify user autocomplete appears
- [ ] Select user
- [ ] Verify `@handle` inserted
- [ ] Test keyboard navigation

---

### 2.7 Commerce Platform

#### Product Management
- [ ] Navigate to `/create` or product creation
- [ ] Create product listing
- [ ] Upload product image/video
- [ ] Set product details (name, price, description)
- [ ] Publish product
- [ ] Edit product
- [ ] Delete product

#### Product Discovery
- [ ] Search for products
- [ ] Use AI product search in chat
- [ ] View product cards
- [ ] Test product recommendations

#### Transactions
- [ ] Test purchase flow
- [ ] Verify transaction logging
- [ ] Check commission calculation
- [ ] View transaction history
- [ ] Test revenue dashboard

---

### 2.8 PWA Features

#### Install Experience
- [ ] Test install prompt (Chrome)
- [ ] Test iOS install helper
- [ ] Verify app installs
- [ ] Test app shortcuts
- [ ] Verify manifest.json

#### Offline Functionality
- [ ] Disable network (offline mode)
- [ ] Test message queue
- [ ] Send message offline
- [ ] Re-enable network
- [ ] Verify messages send automatically
- [ ] Test offline error handling

#### Service Worker
- [ ] Verify service worker registers
- [ ] Check service worker in DevTools
- [ ] Test caching strategy
- [ ] Test offline page loads

#### Native Features
- [ ] Test haptic feedback
- [ ] Test copy/share buttons
- [ ] Test wake lock
- [ ] Test clipboard utilities

---

### 2.9 Notifications

#### Web Push
- [ ] Subscribe to push notifications
- [ ] Test notification permission prompt
- [ ] Send test notification
- [ ] Verify notification displays
- [ ] Test notification click handling

#### Notification Center
- [ ] Access notification center
- [ ] View notification list
- [ ] Mark notification as read
- [ ] Test notification settings

#### In-App Notifications
- [ ] Test toast notifications
- [ ] Verify notification types
- [ ] Test notification dismissal

---

## Phase 3: API Endpoints Testing

### 3.1 LLM Endpoints
- [ ] `/api/llm/openai` - Test OpenAI integration
- [ ] `/api/llm/anthropic` - Test Anthropic integration
- [ ] `/api/llm/gemini` - Test Gemini integration
- [ ] `/api/llm/transcribe` - Test transcription
- [ ] Test error handling (rate limits, timeouts)
- [ ] Test streaming responses

### 3.2 Authentication Endpoints
- [ ] Test user creation
- [ ] Test profile updates
- [ ] Test preference updates
- [ ] Verify authorization checks

### 3.3 Vault Endpoints
- [ ] `/api/vault/bio` - Get/update bio
- [ ] `/api/vault/files` - File operations
- [ ] `/api/vault/folders` - Folder operations
- [ ] `/api/vault/resolve` - Content resolution
- [ ] `/api/vault/usage` - Usage tracking

### 3.4 Voice Endpoints
- [ ] `/api/viim/enroll` - Voice enrollment
- [ ] `/api/viim/verify` - Voice verification
- [ ] `/api/viim/datasets` - Dataset management
- [ ] `/api/voice-lock/*` - Voice lock endpoints

### 3.5 Messaging Endpoints
- [ ] `/api/messages/send` - Send message
- [ ] `/api/messages/threads` - Get threads
- [ ] Test real-time updates

### 3.6 Commerce Endpoints
- [ ] `/api/products/search` - Product search
- [ ] `/api/transactions` - Transaction logging
- [ ] `/api/revenue/summary` - Revenue analytics

### 3.7 Billing Endpoints
- [ ] `/api/billing/create-checkout-session` - Create Stripe session
- [ ] `/api/billing/webhook` - Stripe webhook
- [ ] Test subscription flow

---

## Phase 4: Cross-Browser & Device Testing

### 4.1 Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### 4.2 Responsive Design
- [ ] Desktop (1920x1080, 1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667, 414x896)
- [ ] Test all major pages responsive

### 4.3 Mobile-Specific
- [ ] Test touch interactions
- [ ] Test mobile keyboard
- [ ] Test mobile navigation
- [ ] Test PWA install on mobile

---

## Phase 5: Performance Testing

### 5.1 Load Times
- [ ] Initial page load
- [ ] Route navigation
- [ ] Image/media loading
- [ ] API response times

### 5.2 Bundle Size
- [ ] Check bundle size in build output
- [ ] Verify code splitting
- [ ] Check for large dependencies

### 5.3 Memory & CPU
- [ ] Monitor memory usage
- [ ] Check for memory leaks
- [ ] Monitor CPU usage during streaming

### 5.4 Network Performance
- [ ] Test with slow 3G connection
- [ ] Test offline functionality
- [ ] Test retry logic
- [ ] Test request deduplication

---

## Phase 6: Security Testing

### 6.1 Authentication Security
- [ ] Test unauthorized access attempts
- [ ] Test session expiration
- [ ] Verify Firebase rules enforcement
- [ ] Test XSS prevention

### 6.2 Data Security
- [ ] Verify sensitive data not exposed
- [ ] Test input validation
- [ ] Test SQL injection prevention (if applicable)
- [ ] Verify API key security

### 6.3 Privacy
- [ ] Test privacy settings
- [ ] Verify private data not exposed
- [ ] Test data deletion

---

## Phase 7: Error Handling & Edge Cases

### 7.1 Error Scenarios
- [ ] Network failures
- [ ] API timeouts
- [ ] Invalid input
- [ ] Missing data
- [ ] Concurrent requests
- [ ] Rate limiting

### 7.2 Edge Cases
- [ ] Empty states
- [ ] Very long messages
- [ ] Special characters
- [ ] Unicode/emoji handling
- [ ] Large file uploads
- [ ] Multiple tabs open

---

## Issue Documentation Template

For each issue found, document:

```markdown
### Issue #[ID]: [Brief Title]

**Severity:** Critical / High / Medium / Low  
**Category:** [Auth / Chat / Vault / Voice / Social / Messaging / Commerce / PWA / API / UI / Performance / Security]

**Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Environment:**
- Browser: [Browser and version]
- OS: [Operating system]
- Device: [Desktop/Mobile]
- User Role: [Logged in/Logged out/Subscription tier]

**Screenshots/Logs:**
[Attach screenshots or console logs]

**Files Involved:**
[Relevant file paths]

**Priority:** [1-5, where 1 is highest]
```

---

## Testing Checklist Summary

- [ ] Phase 1: Environment Setup (Complete)
- [ ] Phase 2: Core Functionality (In Progress)
- [ ] Phase 3: API Endpoints (Pending)
- [ ] Phase 4: Cross-Browser (Pending)
- [ ] Phase 5: Performance (Pending)
- [ ] Phase 6: Security (Pending)
- [ ] Phase 7: Error Handling (Pending)

---

## Next Steps After Testing

1. **Document all issues** using the template above
2. **Categorize issues** by severity and type
3. **Prioritize fixes** (see FIXING_PLAN.md)
4. **Create GitHub issues** or tracking tickets
5. **Begin fixing** starting with critical issues

---

## Testing Tools & Resources

- **Browser DevTools:** Console, Network tab, Application tab
- **React DevTools:** Component inspection
- **Firebase Console:** Database inspection
- **Postman/Insomnia:** API endpoint testing
- **Lighthouse:** PWA and performance audits
- **Network Throttling:** Chrome DevTools

---

**Last Updated:** [Date]  
**Status:** Ready for Testing

