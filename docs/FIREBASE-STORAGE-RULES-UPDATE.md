# Firebase Storage Rules Update Required

**Date:** December 14, 2025

## Issue

Cover photo uploads failing with permission error:
```
Firebase Storage: User does not have permission to access 'covers/{uid}/{filename}'
(storage/unauthorized)
```

## Solution

Update Firebase Storage security rules to allow cover photo uploads.

## How to Deploy

### Via Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Storage** → **Rules**
4. Replace with the rules from `firebase-storage.rules`
5. Click **Publish**

### Via Firebase CLI

```bash
# Deploy storage rules only
firebase deploy --only storage

# Or deploy everything
firebase deploy
```

## New Rules Structure

```
/avatars/{userId}/{fileName}
  - Read: Public
  - Write: Owner only

/covers/{userId}/{fileName}  ← NEW
  - Read: Public
  - Write: Owner only

/vault/{userId}/**
  - Read: Owner only
  - Write: Owner only

/content/{userId}/{fileName}  ← NEW (for future public media)
  - Read: Public
  - Write: Owner only
```

## Files

- **Rules file:** `firebase-storage.rules`
- **Deploy:** Use Firebase Console or CLI

## After Deploying

Test cover photo upload:
1. Go to `/profile`
2. Click camera icon on header
3. Upload an image
4. Should succeed without errors

---

**Status:** Rules file created, deployment required

