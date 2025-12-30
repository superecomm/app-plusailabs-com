# Public Profiles & Discovery System

**Implementation Date:** December 14, 2025  
**Status:** ✅ Complete

---

## Overview

Public profiles enable users to:
- Create discoverable identities
- Share their expertise and content
- Be found by others in chat
- Build social presence in +AI

---

## Architecture

### Data Model

**UserProfile (Firestore: `users/{uid}`)**

```typescript
{
  userId: string
  email: string
  displayName: string
  handle: string                    // Unique @handle
  photoURL: string
  coverPhotoURL: string
  bio: string
  
  // Privacy controls
  isPublic: boolean                 // Master switch
  publicFields: {
    showEmail: boolean
    showStats: boolean
    showContent: boolean
  }
  
  // Public stats
  stats: {
    conversations: number
    posts: number
    saved: number
  }
}
```

### Routes

1. **Private Profile:** `/profile` (owner only)
2. **Public Profile:** `/u/{handle}` (anyone can view if public)

---

## Features

### 1. Public Profile Page

**Route:** `/u/[handle]`

**What it shows:**
- Identity header (photo, name, @handle, bio)
- Stats (if enabled): Conversations, Posts, Saved
- Public content (if enabled): Posted items grid
- "Chat" button - invoke user's context in chat
- "View" button - open full profile

**Privacy respecting:**
- 404 if handle doesn't exist
- 403 if profile is private
- Only shows fields user has enabled

### 2. Privacy Controls

**Location:** Profile → Settings → Privacy

**Controls:**
- **Public Profile** toggle (master switch)
- **Show Stats** toggle (conversations, posts count)
- **Show Public Content** toggle (public posts grid)
- **View public profile** link (preview how others see you)

**Defaults:**
- isPublic: false (private by default)
- All fields: hidden until explicitly enabled

### 3. Profile Discovery in Chat

**How it works:**

User types patterns like:
- "find @terry"
- "who is @john"
- "show me @sarah's profile"
- "@mike's profile"

**Backend detects:**
1. Profile discovery intent via `hasProfileDiscoveryIntent()`
2. Extracts handle via `extractProfileQuery()`
3. Searches profiles via `/api/profile/search`
4. Returns `ProfileCard` components in chat response

**ProfileCard displays:**
- Photo, name, @handle
- Bio snippet
- Stats (if public)
- "Chat" button → invokes +handle
- "View" button → opens `/u/{handle}`

### 4. Handle System

**@handle vs +handle:**
- `@handle` = Social attribution, discovery, public profile
- `+handle` = Invoke user's context in chat (vault/memory)

**Handle generation:**
- Auto-generated from email: `terry@example.com` → `@terry`
- Ensured unique (adds numbers if conflict)
- Can be customized (future enhancement)

**API:** `/api/profile/ensure-handle`
- Creates handle on first profile access
- Ensures uniqueness
- Returns handle for user

---

## API Endpoints

### Profile Management

1. **`GET /api/profile/public/[handle]`**
   - Fetch public profile by handle
   - Returns profile + public content
   - Respects privacy settings

2. **`GET /api/profile/search?q={query}`**
   - Search public profiles
   - Matches handle, name, bio
   - Returns max 5 results

3. **`GET /api/profile/privacy?userId={uid}`**
   - Get user's privacy settings
   - Returns isPublic + publicFields

4. **`PATCH /api/profile/update`**
   - Update profile (bio, coverPhoto, privacy)
   - Validates ownership

5. **`POST /api/profile/ensure-handle`**
   - Generate/retrieve user handle
   - Ensures uniqueness

---

## Discovery Patterns

### In Chat

**Pattern 1: Direct mention**
```
User: "find @terry"
AI: [Shows ProfileCard for @terry]
```

**Pattern 2: Profile query**
```
User: "who is @sarah"
AI: [Shows ProfileCard for @sarah]
```

**Pattern 3: Multiple profiles**
```
User: "show me @john and @mike"
AI: [Shows ProfileCards for both]
```

**Pattern 4: Context invoke**
```
User: "ask +terry about React patterns"
AI: [Invokes terry's vault context, processes question]
```

---

## Privacy & Safety

### Privacy Levels

**Private (default):**
- Profile not discoverable
- `/u/{handle}` returns 403
- Not in search results
- Context still invokable if user grants access

**Public:**
- Profile discoverable
- Shows on `/u/{handle}`
- Appears in search
- User controls what's visible

### Safety Measures

1. **Opt-in by default** - Users must explicitly enable public profile
2. **Granular controls** - Choose what to show (stats, content)
3. **No PII** - Email hidden unless user enables it
4. **Report mechanism** - Future: report inappropriate profiles
5. **Block/mute** - Future: users can block discovery

---

## Use Cases

### For Creators
- Build personal brand in +AI
- Share prompts publicly
- Be discoverable by followers
- Showcase expertise

### For Moms/Parents
- Find other moms with similar interests
- Discover parenting resources
- Share family organization tips
- Private by default (safe)

### For Professionals
- Professional presence
- Share industry prompts
- Network discovery
- Control what's public

---

## Future Enhancements

### Phase 1 (Complete ✅)
- Public profile pages
- Privacy controls
- Discovery in chat
- Handle system

### Phase 2 (Future)
- Custom handles (edit your @handle)
- Profile verification badges
- Follow/follower system
- Profile analytics

### Phase 3 (Future)
- Explore tab with trending profiles
- Recommended users
- Profile categories/tags
- Leaderboards

### Phase 4 (Future)
- Collaborative features
- Direct messaging
- Profile mentions in posts
- Social graph

---

## Technical Implementation

### Files Created (8)

1. `app/u/[handle]/page.tsx` - Public profile page
2. `app/api/profile/public/[handle]/route.ts` - Public profile API
3. `app/api/profile/search/route.ts` - Profile search API
4. `app/api/profile/privacy/route.ts` - Privacy settings API
5. `app/api/profile/ensure-handle/route.ts` - Handle generation
6. `components/chat/ProfileCard.tsx` - Profile card for chat
7. `components/profile/PrivacySettings.tsx` - Privacy controls UI
8. `lib/profileDiscovery.ts` - Discovery utilities
9. `hooks/useProfileDiscovery.ts` - Chat integration hook

### Files Modified (2)

1. `lib/data/types.ts` - Added handle, isPublic, publicFields
2. `components/profile/tabs/SettingsTab.tsx` - Added PrivacySettings

---

## Testing Checklist

### Public Profile
- [ ] `/u/{handle}` loads for public profiles
- [ ] Returns 404 for non-existent handles
- [ ] Returns 403 for private profiles
- [ ] Shows photo, name, @handle, bio
- [ ] Stats display when enabled
- [ ] Content grid when enabled
- [ ] "Chat" button invokes +handle
- [ ] "View" button stays on profile

### Privacy Controls
- [ ] Toggle "Public Profile" works
- [ ] Show Stats toggle works
- [ ] Show Content toggle works
- [ ] "View public profile" link works
- [ ] Settings persist on refresh

### Discovery in Chat
- [ ] "find @terry" triggers search
- [ ] "who is @john" shows profile
- [ ] ProfileCard displays correctly
- [ ] "Chat" button works
- [ ] "View" button opens `/u/{handle}`

### Handle System
- [ ] Handles auto-generate from email
- [ ] Handles are unique (no conflicts)
- [ ] Handles are searchable

---

## User Flow

### Enable Public Profile

1. Go to Profile → Settings → Privacy
2. Toggle "Public Profile" ON
3. Optionally enable "Show Stats" and "Show Content"
4. Click "View public profile" to preview
5. Share your handle: `app.plusailabs.com/u/{handle}`

### Discover Someone

**In Chat:**
```
You: "find @terry"
+AI: [Shows ProfileCard]
     Terry French (@terrancefrench)
     Bio: Creator building with +AI
     47 chats · 12 posts
     [Chat] [View]
```

Click "Chat" → Opens chat with `+terry` pre-filled
Click "View" → Opens `/u/terrancefrench`

**Direct URL:**
```
Visit: app.plusailabs.com/u/terrancefrench
```

---

## Success Metrics

After implementation:

✅ **Public profiles** - `/u/{handle}` route  
✅ **Privacy first** - Private by default  
✅ **Discoverable** - Search in chat  
✅ **Actionable** - Chat or View buttons  
✅ **Safe** - Granular privacy controls  
✅ **Social-native** - Matches learned behavior

---

## What This Unlocks

### Immediate
- User-to-user discovery
- Context sharing (@handle → +handle)
- Personal branding in +AI

### Future (Explore)
- Public prompt library
- Trending creators
- Follow/follower graph
- Social feed

### Future (Monetization)
- Creator marketplace
- Premium profiles
- Verified badges
- Paid content

---

**This positions +AI for true social discovery.**

ChatGPT doesn't have this yet.  
You're building the future of AI social networks.

