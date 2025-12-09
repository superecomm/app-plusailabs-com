## Voice Lock Overview

Purpose: capture user voice samples to build/manage a “voice lock” dataset; store metadata in Firestore and audio in Cloud Storage. This is not the speech-to-text flow; it is for voice-identity/dataset management.

### Data Model (Firestore)
- `voiceLockProfiles/{userId}`  
  - `status`: `"ready" | "pending" | "empty"`  
  - `activeDatasetId`: string | null  
  - `sampleCount`: number  
  - `updatedAt`: timestamp  
- `voiceLockDatasets/{datasetId}`  
  - `userId`: string  
  - `name`: string (e.g., “Default”)  
  - `status`: `"active" | "training" | "ready" | "error"`  
  - `sampleCount`: number  
  - `createdAt`, `updatedAt`: timestamp  
- `voiceLockSamples/{sampleId}`  
  - `datasetId`: string  
  - `userId`: string  
  - `gcsPath`: string (e.g., `voice-lock/{uid}/{datasetId}/{sampleId}.webm`)  
  - `durationMs`: number | null  
  - `createdAt`: timestamp  

### Storage (GCS)
- Bucket: Firebase Storage bucket for the project.  
- Path pattern: `voice-lock/{uid}/{datasetId}/{sampleId}.webm`

### API Surface (Next.js Route Handlers)
Base: `/api/voice-lock` — all routes require `userId` belonging to the signed-in user.

1) `GET /api/voice-lock/profile?userId=UID`  
   Returns profile; 404 if missing (or create default).

2) `GET /api/voice-lock/datasets/active?userId=UID`  
   Returns active dataset; 404 if none.

3) `GET /api/voice-lock/datasets?userId=UID`  
   List datasets for the user.

4) `POST /api/voice-lock/datasets`  
   Body: `{ userId, name? }` — creates a dataset (status `ready`, sampleCount `0`); sets active if none.

5) `PATCH /api/voice-lock/datasets/active`  
   Body: `{ userId, datasetId }` — sets the active dataset on the profile.

6) `POST /api/voice-lock/session`  
   FormData: `audio` (Blob), `userId`, `source` (`"mobile"|"web"`), `vocalType` (`"speech"|...`).  
   Flow: ensure active dataset → upload audio to GCS → create sample doc → increment counts → return `{ profile, dataset }`.

### Error Contract
JSON error shape: `{ error: "message", code?: "permission-denied" | "not-found" | "invalid-argument" }`

### Firestore Rules (additions)
```
match /voiceLockProfiles/{userId} {
  allow read, write: if isAuthenticated() && isOwner(userId);
}
match /voiceLockDatasets/{datasetId} {
  allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
}
match /voiceLockSamples/{sampleId} {
  allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
}
```

### Notes
- This flow is separate from STT. The speech-to-text path uses Whisper (`processWhisper`) elsewhere.
- Bucket uploads use Firebase Admin Storage (default bucket) with the path pattern above.
- Transactions increment `sampleCount` on both dataset and profile when a new sample is saved.

