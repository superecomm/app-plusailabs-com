# Quick Reference Guide

## What's Been Built ✓

### Execution Infrastructure
- ✅ All 13 execution states defined (`idle`, `validating`, `routing`, `preflight`, `tooling`, `streaming`, `stalled`, `retrying`, `finalizing`, `limited`, `error`, `cancelled`, `done`)
- ✅ Request ID tracking with `nanoid()`
- ✅ AbortController integration for request cancellation
- ✅ Pending queue for submissions while busy
- ✅ Stall detection (>2s without tokens)
- ✅ 8k character streaming cap

### Vault Storage
- ✅ Firestore collections: `vault/bio`, `vaultFolders`, `vaultFiles`
- ✅ Firebase Storage: `vault/{uid}/{folderId}/{fileName}`
- ✅ API routes: `/api/vault/bio`, `/api/vault/folders`, `/api/vault/files`
- ✅ Drive-lite UI with folders and file uploads
- ✅ Bio/context editor textarea

### UI Features
- ✅ Theme slider (light/dark)
- ✅ Text size slider (smallest to largest)
- ✅ Cloud storage view
- ✅ Error handling with user-friendly messages
- ✅ Conversation management and persistence

### Basic +Token Support
- ✅ Regex extraction: `/(?:^|\s)\+([A-Za-z0-9_-]+)/g`
- ✅ Basic prompt assembly with token list
- ⚠️ NOT YET: Vault content resolution, autocomplete UI

---

## What Needs Implementation ❌

### 1. Reducer State Machine
**Current:** Direct `setState()` calls  
**Needed:** Reducer with transition validation

```typescript
// Replace this:
setExecState("streaming");

// With this:
dispatchExec({ type: 'START_STREAMING' });
```

**Files to modify:**
- `contexts/ChatContext.tsx` (add reducer)
- `components/viim/NeuralBox.tsx` (replace setState calls)

**Estimated time:** 6 hours

---

### 2. Deterministic Termination
**Current:** Basic caps (8k chars, 2s stall)  
**Needed:** Token budgets, semantic stops, user actions

**Add:**
- Token counter per request
- Budget per tier (10k/100k/500k tokens)
- Semantic stop detection (sentence endings, code fences)
- Stall UI with Retry/Cancel buttons

**Files to modify:**
- `contexts/ChatContext.tsx` (add token tracking)
- `components/viim/NeuralBox.tsx` (add stop detection)
- `components/StallActionsBar.tsx` (NEW)

**Estimated time:** 5 hours

---

### 3. +Context Autocomplete
**Current:** Regex extraction only  
**Needed:** Full autocomplete UI

**Add:**
- Autocomplete dropdown on "+" character
- Fuzzy search vault items
- Keyboard navigation (↑↓, Enter, Esc)
- Pill-style token insertion
- Entity refs in message metadata

**Files to create:**
- `hooks/useVaultAutocomplete.ts`
- `components/vault/VaultAutocomplete.tsx`
- `components/vault/VaultTokenPill.tsx`

**Files to modify:**
- `components/viim/NeuralBox.tsx`
- `types/conversation.ts`

**Estimated time:** 10 hours

---

### 4. Vault Resolution
**Current:** Not implemented  
**Needed:** Fetch and inject vault content into prompts

**Add:**
- `resolveVaultContext()` service
- Budget enforcement (1.5k/6k/12k chars per tier)
- `allowInChat` permission checks
- Context sources bar UI
- Usage event logging

**Files to create:**
- `lib/vaultPolicy.ts`
- `lib/vaultUsage.ts`
- `components/vault/ContextSourcesBar.tsx`

**Files to modify:**
- `components/viim/NeuralBox.tsx`

**Estimated time:** 9 hours

---

## Key Code Locations

### State Management
- **ChatContext:** `contexts/ChatContext.tsx`
- **Execution states:** Lines 21-34
- **Transition function (placeholder):** Lines 173-176
- **Stall detection:** Lines 189-199

### Message Handling
- **NeuralBox component:** `components/viim/NeuralBox.tsx`
- **Text submit handler:** Lines 655-697
- **LLM request handler:** Lines 454-554
- **+Token extraction:** Line 208-211
- **Prompt builder:** Lines 213-222

### Vault Storage
- **Firestore helpers:** `lib/firestore.ts`
- **Vault bio:** Lines 608-634
- **Vault folders:** Lines 654-684
- **Vault files:** Lines 686-723
- **API routes:** `app/api/vault/*`

### Streaming
- **LLM models:** `lib/models/llmModels.ts`
- **Streaming handler:** Lines 67-88
- **Error classification:** Lines 21-28

### UI
- **Chat interface:** `components/chat/ChatInterface.tsx`
- **Theme/text sliders:** Lines 959-981
- **Vault UI:** Lines 662-854

---

## Critical Patterns

### State Transitions (Current - Direct)
```typescript
// In NeuralBox.tsx handleTextSubmit()
setExecState("validating");
setExecState("routing");
setExecState("preflight");
await handleLLMRequest(...);
```

### State Transitions (Desired - Reducer)
```typescript
// In NeuralBox.tsx handleTextSubmit()
dispatchExec({ type: 'START_VALIDATION', requestId });
// Reducer automatically transitions through states
await handleLLMRequest(...);
```

### Token Extraction (Current)
```typescript
function extractPlusTokens(text: string): string[] {
  const matches = [...text.matchAll(/(?:^|\s)\+([A-Za-z0-9_-]+)/g)];
  return matches.map((m) => m[1]);
}

// Usage
const plusTokens = extractPlusTokens(trimmedInput);
// Result: ["family", "recipes"] from "Tell me about +family and +recipes"
```

### Vault Resolution (Needed)
```typescript
// Before LLM call
const vaultContext = await resolveVaultContext(
  currentUser.uid,
  vaultRefs, // from message metadata
  getTierContextBudget(userSubscription) // 1.5k/6k/12k
);

const prompt = buildPrompt(userText, vaultContext);
// Prompt includes actual vault content, not just token names
```

### Autocomplete (Needed)
```typescript
// In NeuralBox.tsx
const {
  isOpen,
  items,
  selectedIndex,
  position,
  query,
  handleKeyDown,
  handleSelect,
} = useVaultAutocomplete(textareaRef);

// Render
{isOpen && (
  <VaultAutocomplete
    items={items}
    selectedIndex={selectedIndex}
    position={position}
    onSelect={handleSelect}
  />
)}
```

---

## Important Constraints

### Character Budgets (Vault Context)
| Tier | Max Chars | Firestore Reads |
|------|-----------|-----------------|
| Free | 1,500 | ~3 items |
| Paid | 6,000 | ~10 items |
| Super | 12,000 | ~20 items |

### Token Budgets (LLM Requests)
| Tier | Max Tokens | Cost per Token |
|------|------------|----------------|
| Free | 10,000 | $0 (trial) |
| Paid | 100,000 | Varies by model |
| Super | 500,000 | Varies by model |

### Streaming Limits
- **Character cap:** 8,000 chars
- **Stall threshold:** 2 seconds without token
- **Stall action:** Show Retry/Cancel UI

### Vault Permissions
- **allowInChat:** Must be `true` for item to be included
- **Scope:** Only `private` and `agent-usable` in Phase 1
- **User isolation:** No cross-user access

---

## Testing Commands

```bash
# Run linter
npm run lint

# Run type check
npm run type-check

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

## Common Pitfalls

### ❌ Don't: Call setExecState() directly
```typescript
setExecState("streaming"); // Bypasses validation
```

### ✅ Do: Dispatch actions through reducer
```typescript
dispatchExec({ type: 'START_STREAMING' }); // Validated
```

---

### ❌ Don't: Assume all vault items are allowed
```typescript
const content = await fetchVaultItem(id);
prompt += content; // Might violate permissions
```

### ✅ Do: Check allowInChat permission
```typescript
const item = await fetchVaultItem(id);
if (item.allowInChat) {
  prompt += truncate(item.content, budget);
}
```

---

### ❌ Don't: Load unlimited vault content
```typescript
for (const ref of vaultRefs) {
  const item = await fetchVaultItem(ref.id);
  prompt += item.content; // Could exceed budget
}
```

### ✅ Do: Enforce character budget
```typescript
let totalChars = 0;
for (const ref of vaultRefs) {
  if (totalChars >= budget) break;
  const item = await fetchVaultItem(ref.id);
  const content = truncate(item.content, budget - totalChars);
  prompt += content;
  totalChars += content.length;
}
```

---

### ❌ Don't: Block UI during vault resolution
```typescript
const vaultContext = await resolveVaultContext(...);
// UI frozen while fetching
```

### ✅ Do: Show loading state
```typescript
setStatusLabel("Fetching vault context...");
const vaultContext = await resolveVaultContext(...);
setStatusLabel(null);
```

---

## Debugging Tips

### Check current execution state
```typescript
console.log('Current state:', execState);
console.log('Can submit:', canSubmit);
console.log('Request ID:', requestId);
```

### Monitor state transitions
```typescript
// In reducer
function execReducer(state, action) {
  console.log('Transition:', state.state, '→', action.type);
  // ... rest of reducer
}
```

### Track vault resolution
```typescript
console.log('Vault refs:', vaultRefs);
console.log('Budget:', budget);
console.log('Resolved context:', vaultContext);
console.log('Total chars:', vaultContext.totalChars);
```

### Monitor streaming
```typescript
const onToken = (token: string) => {
  console.log('Token:', token.slice(0, 20), '...');
  console.log('Total chars:', streamingContent.length);
  console.log('Token count:', tokenCount);
};
```

---

## Environment Variables

```bash
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...

# Firebase Admin SDK
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# LLM API Keys
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_AI_API_KEY=...
```

---

## Next Context Window Plan

When continuing in a fresh session:

1. **Start with:** Reducer implementation (foundation)
2. **Then:** Deterministic termination (builds on reducer)
3. **Finally:** Autocomplete + vault resolution (most complex)

Or if preferring user-facing value first:

1. **Start with:** Autocomplete UI (immediate user value)
2. **Then:** Vault resolution (enables autocomplete)
3. **Finally:** Reducer refactor (internal improvement)

---

## Quick Links

- **Plan:** `.cursor/plans/vault-cf2b7a61.plan.md`
- **Architecture:** `docs/system-architecture.md`
- **Review:** `docs/current-implementation-review.md`
- **Flows:** `docs/state-machine-flows.md`
- **Checklist:** `docs/implementation-checklist.md`
- **This file:** `docs/quick-reference.md`

---

## Summary

**Foundation is solid.** You have:
- All state types defined
- Request tracking and abort control
- Queue system for pending submissions
- Vault storage backend
- Basic +token extraction

**Three major features remain:**
1. Reducer-based state machine (~6 hours)
2. Deterministic termination (~5 hours)
3. +Context autocomplete + vault resolution (~19 hours)

**Total estimated:** ~30 hours of focused development

**Recommendation:** Implement reducer first (foundation), then build up from there. Or start with autocomplete if you want user-facing value sooner.

The architecture is clean and the foundation is strong. The remaining work is well-defined and achievable in a fresh context window.

