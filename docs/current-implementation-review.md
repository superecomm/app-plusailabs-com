# Current Implementation Review
*Generated: December 13, 2025*

## Overview
This document provides a comprehensive review of the current +AI chat implementation, identifying what's been completed and what remains to fully implement the reducer-based state machine and +context autocomplete features.

---

## 1. COMPLETED FEATURES ✓

### 1.1 Execution State Types
**Location:** `contexts/ChatContext.tsx:21-34`

All execution states are properly defined:
- `idle` - Ready to accept new requests
- `validating` - Checking user input
- `routing` - Determining which model/endpoint to use
- `preflight` - Pre-request checks
- `tooling` - Processing with tools (placeholder)
- `streaming` - Actively receiving tokens
- `stalled` - Streaming paused (>2s without token)
- `retrying` - Attempting recovery (placeholder)
- `finalizing` - Post-processing response
- `limited` - User hit usage limit
- `error` - Request failed
- `cancelled` - User aborted request
- `done` - Successfully completed

### 1.2 Request ID Tracking
**Location:** `contexts/ChatContext.tsx:113`, `components/viim/NeuralBox.tsx:676`

- Request IDs generated via `nanoid()`
- Tracked in ChatContext state
- Used to prevent duplicate submissions
- Cleared on completion/error

### 1.3 AbortController Integration
**Location:** `contexts/ChatContext.tsx:166-171`, `components/viim/NeuralBox.tsx:457-462`

- AbortController created per request
- Signal passed to fetch calls
- Proper cleanup on abort/completion
- Handles partial streaming content on abort

### 1.4 Pending Queue System
**Location:** `contexts/ChatContext.tsx:132,149-164`, `components/viim/NeuralBox.tsx:907-914`

- Queue stores submissions when system is busy
- Automatically drains when `canSubmit` becomes true
- Prevents message loss during high-frequency input

**Implementation:**
```typescript
// Enqueue logic in NeuralBox handleTextSubmit
if (!canSubmit) {
  enqueueSubmission({ text: value });
  return;
}

// Auto-drain in useEffect
useEffect(() => {
  if (!canSubmit || isProcessingInput) return;
  const next = pendingQueue[0];
  if (!next) return;
  shiftSubmission();
  handleTextSubmit(undefined, next.text);
}, [canSubmit, isProcessingInput, pendingQueue]);
```

### 1.5 Prompt Assembly with +Token Extraction
**Location:** `components/viim/NeuralBox.tsx:208-222,686`

- Regex pattern extracts `+tokenName` from user input
- Builds structured prompt with context block
- Currently just lists token names (not yet resolving Vault content)

```typescript
function extractPlusTokens(text: string): string[] {
  const matches = [...text.matchAll(/(?:^|\s)\+([A-Za-z0-9_-]+)/g)];
  return matches.map((m) => m[1]);
}

function buildPrompt(userText: string, plusTokens: string[]): string {
  const blocks: string[] = [];
  blocks.push("System: You are a helpful, concise assistant...");
  blocks.push("Safety: Avoid harmful, private, or disallowed content.");
  if (plusTokens.length) {
    blocks.push(`User Context (from +): ${plusTokens.join(", ")}`);
  }
  blocks.push("Task:");
  blocks.push(userText.trim());
  return blocks.join("\n\n");
}
```

### 1.6 Streaming with Soft Cap
**Location:** `components/viim/NeuralBox.tsx:454-554`

- 8,000 character streaming limit (`MAX_STREAM_CHARS`)
- Auto-aborts when limit reached
- Token-by-token callback updates UI
- First token tracking for latency detection

### 1.7 Stall Detection
**Location:** `contexts/ChatContext.tsx:182-199`

- Watchdog timer checks every 1s during streaming
- Transitions to "stalled" if >2s without token
- Auto-recovers when tokens resume
- `markTokenActivity()` updates timestamp

```typescript
useEffect(() => {
  if (execState !== "streaming") return;
  const id = window.setInterval(() => {
    const last = lastTokenAtRef.current;
    if (!last) return;
    if (Date.now() - last > 2000) {
      setExecState("stalled");
    }
  }, 1000);
  return () => window.clearInterval(id);
}, [execState]);
```

### 1.8 Vault Storage Infrastructure
**Location:** `lib/firestore.ts:606-723`, `app/api/vault/*`

**Firestore Collections:**
- `users/{uid}/vault/bio` - User bio/context document
- `users/{uid}/vaultFolders/{folderId}` - Folder metadata
- `users/{uid}/vaultFiles/{fileId}` - File metadata with download URLs

**Firebase Storage:**
- Path: `vault/{uid}/{folderId}/{fileName}`
- Integrated with client-side uploads
- Download URLs stored in Firestore

**API Routes:**
- `GET/POST /api/vault/bio` - Bio content CRUD
- `GET/POST /api/vault/folders` - Folder management
- `GET/POST /api/vault/files` - File metadata CRUD

### 1.9 Theme & Text Size Controls
**Location:** `components/chat/ChatInterface.tsx:45-47,959-981`

- Theme slider: 0 (light) → 1 (dark)
- Text size slider: 0 (smallest) → 1 (largest)
- Gradient slider UI
- State persisted in component

### 1.10 Cloud/Vault UI (Drive-lite)
**Location:** `components/chat/ChatInterface.tsx:473-854`

- Folder/file list view
- Upload functionality with Firebase Storage
- Bio/context editor textarea
- Usage percentage display (placeholder)

### 1.11 Error Classification & Handling
**Location:** `lib/models/llmModels.ts:13-28`, `components/viim/NeuralBox.tsx:507-529`

- Error categories: `MODEL_UNAVAILABLE`, `MODEL_OVERLOADED`, `MODEL_TIMEOUT`, `RATE_LIMITED`, `NETWORK_ERROR`
- User-friendly error messages with randomization
- Action buttons (Try again, Switch model, Upgrade)
- Limit detection triggers subscription upsell

### 1.12 Conversation Management
**Location:** `lib/conversationService.ts`, `contexts/ChatContext.tsx:201-322`

- Firestore-backed conversation persistence
- Real-time subscription to conversation list
- Optimistic UI updates
- Auto-title generation from first message

---

## 2. OUTSTANDING IMPLEMENTATION GAPS

### 2.1 Reducer-Based State Machine ❌

**Current State:** Direct `setState()` calls scattered throughout code
**Location:** `contexts/ChatContext.tsx:173-176`

```typescript
const transition = (next: ExecState, reason?: string) => {
  // noop for now; placeholder to centralize state transitions later
  setExecState(next);
}
```

**Problem:**
- No enforcement of valid transitions
- No guard conditions
- Direct `setExecState()` calls bypass `transition()`
- Example: `setExecState("routing"); setExecState("preflight");` happens synchronously without validation

**Required:**
- Replace with `useReducer` hook
- Define action types for each transition
- Implement reducer with transition validation
- Guard against invalid state changes (e.g., `done → streaming`)
- Side effects managed via `useEffect` watching state

**Recommended Architecture:**
```typescript
type ExecAction = 
  | { type: 'START_VALIDATION'; requestId: string }
  | { type: 'BEGIN_ROUTING' }
  | { type: 'START_STREAMING' }
  | { type: 'MARK_STALLED' }
  | { type: 'RESUME_STREAMING' }
  | { type: 'COMPLETE'; reason?: string }
  | { type: 'FAIL'; error: string; category: LLMErrorCategory }
  | { type: 'CANCEL' }
  | { type: 'HIT_LIMIT' };

function execReducer(state: ExecState, action: ExecAction): ExecState {
  // Enforce valid transitions
  // Log invalid attempts
  // Return new state
}
```

### 2.2 Deterministic Termination ❌

**Current State:** Partial implementation
- ✓ Soft streaming cap (8k chars)
- ✓ Stall detection (>2s)
- ✗ No semantic stop detection
- ✗ No explicit token budget enforcement
- ✗ No surface-level Retry/Cancel actions during stall

**Missing:**
1. **Token Counter:** Track cumulative tokens per request against model limits
2. **Semantic Stop:** Detect natural completion signals (e.g., sentence endings, code blocks closed)
3. **Stall Actions:** When "stalled" state is reached, show UI with Retry/Cancel buttons
4. **Budget Enforcement:** Fail with "limited" state when approaching tier token limits

**Recommended Implementation:**
```typescript
// Token budget tracking
const [tokenCount, setTokenCount] = useState(0);
const [tokenLimit] = useState(getTierLimit(userSubscription)); // e.g., 10k free, 100k paid

// In streaming callback
const onToken = (token: string) => {
  const estimated = estimateTokenCount(token);
  setTokenCount(prev => {
    const next = prev + estimated;
    if (next > tokenLimit * 0.95) {
      abortController.abort();
      setExecState("limited");
    }
    return next;
  });
  // ... rest of token handling
};

// Semantic stop detection
function detectNaturalStop(fullText: string): boolean {
  // Check for sentence endings
  // Check for code fence closures
  // Check for list completions
  return /[.!?]\s*$/.test(fullText.trim());
}
```

### 2.3 +Context Autocomplete UI ❌

**Current State:** Only regex extraction implemented
**Location:** `components/viim/NeuralBox.tsx:208-211`

**Missing:**
1. **Autocomplete Dropdown:**
   - Trigger on typing "+" character
   - Fuzzy search Vault items (bio, folders, files)
   - Keyboard navigation (↑↓ arrows, Enter to select)
   - Mouse selection support

2. **Pill-Style Token Insertion:**
   - Insert `+tokenName` as styled pill/chip
   - Allow deletion via Backspace
   - Visual distinction from regular text

3. **Entity Refs in Message Metadata:**
   - Store structured refs in `ConversationMessage`
   - Link to actual Vault items by ID
   - Preserve ref integrity across edits

4. **Vault Resolution Before LLM Call:**
   - Fetch referenced items from Firestore
   - Check `allowInChat` permissions
   - Enforce tier-based context budget (free: 1.5k chars, paid: 6k, super: 12k)
   - Inject actual content into prompt

**Recommended UI Component:**
```typescript
// New component: VaultAutocomplete.tsx
interface VaultAutocompleteProps {
  onSelect: (item: VaultItem) => void;
  position: { x: number; y: number };
  query: string;
}

// New hook: useVaultAutocomplete.tsx
function useVaultAutocomplete(textareaRef: RefObject<HTMLTextAreaElement>) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [query, setQuery] = useState("");
  
  // Monitor cursor position for "+" trigger
  // Fuzzy search vault items
  // Return { showDropdown, position, query, items, onSelect }
}
```

**Message Type Extension:**
```typescript
// types/conversation.ts
export type ConversationMessage = {
  // ... existing fields
  vaultRefs?: Array<{
    id: string;
    type: 'bio' | 'folder' | 'file';
    name: string;
    token: string; // e.g., "+family"
  }>;
};
```

**Vault Resolution Service:**
```typescript
// lib/vaultPolicy.ts (new file)
interface VaultContext {
  items: Array<{ source: string; content: string; chars: number }>;
  totalChars: number;
  exceeded: boolean;
}

async function resolveVaultContext(
  userId: string,
  vaultRefs: Array<{ id: string; type: string }>,
  budget: number
): Promise<VaultContext> {
  // Fetch items from Firestore
  // Check allowInChat permissions
  // Accumulate content within budget
  // Return structured context
}
```

### 2.4 Context Sources Bar ❌

**Current State:** Not implemented
**Required:** Show which Vault items were used in each assistant response

**Recommended Component:**
```typescript
// components/vault/ContextSourcesBar.tsx
interface ContextSourcesBarProps {
  sources: Array<{ name: string; type: string; chars: number }>;
  expandable?: boolean;
}

// Display under assistant message:
// "Used +Vault: Bio, Family Notes (+2 more)" [expand icon]
```

### 2.5 Vault Usage Audit Trail ❌

**Current State:** Not implemented
**Required:** Log which Vault items were used per response

**Firestore Schema:**
```typescript
// users/{uid}/vaultUsageEvents/{eventId}
interface VaultUsageEvent {
  conversationId: string;
  messageId: string;
  vaultItemIds: string[];
  timestamp: number;
  model: string;
  provider: string;
  charCount: number;
}
```

---

## 3. ARCHITECTURAL RECOMMENDATIONS

### 3.1 State Machine Implementation Order

1. **Phase 1: Reducer Foundation**
   - Define `ExecAction` types
   - Implement `execReducer` with transition guards
   - Replace `setExecState()` with `dispatch()`
   - Add logging for invalid transitions

2. **Phase 2: Termination Logic**
   - Add token counter to reducer state
   - Implement budget enforcement
   - Add semantic stop detection
   - Surface Retry/Cancel UI during stalls

3. **Phase 3: +Context Autocomplete**
   - Build autocomplete dropdown component
   - Implement Vault search hook
   - Add pill-style token rendering
   - Store entity refs in message metadata

4. **Phase 4: Vault Resolution**
   - Create `vaultPolicy.ts` service
   - Implement `resolveVaultContext()` with budget checks
   - Inject resolved content into prompts
   - Add ContextSourcesBar component
   - Log usage events

### 3.2 Key Files to Modify

**Core State Management:**
- `contexts/ChatContext.tsx` - Add reducer, actions
- `components/viim/NeuralBox.tsx` - Replace setState with dispatch

**New Files to Create:**
- `lib/vaultPolicy.ts` - Vault resolution logic
- `lib/vaultUsage.ts` - Audit logging
- `components/vault/VaultAutocomplete.tsx` - Dropdown UI
- `hooks/useVaultAutocomplete.ts` - Autocomplete logic
- `components/vault/ContextSourcesBar.tsx` - Sources display
- `components/vault/VaultTokenPill.tsx` - Pill rendering

**Type Extensions:**
- `types/conversation.ts` - Add `vaultRefs` field
- `contexts/ChatContext.tsx` - Add action types

### 3.3 Testing Strategy

1. **Reducer Invariants:**
   - Test all valid transitions
   - Test all invalid transitions are blocked
   - Test concurrent state updates

2. **Autocomplete:**
   - Test "+" trigger detection
   - Test fuzzy search ranking
   - Test keyboard navigation
   - Test token insertion

3. **Vault Resolution:**
   - Test budget enforcement (1.5k/6k/12k limits)
   - Test `allowInChat` filtering
   - Test permission denial
   - Test character counting accuracy

---

## 4. MIGRATION RISKS

### High Risk
- **State machine refactor:** Touching core execution flow, high regression potential
- **Autocomplete input handling:** Complex cursor/selection logic, edge cases with mobile

### Medium Risk
- **Vault resolution:** Network calls in critical path, latency impact
- **Token counting:** Estimation inaccuracy, potential budget overruns

### Low Risk
- **ContextSourcesBar:** Purely additive UI component
- **Audit logging:** Fire-and-forget, no blocking operations

---

## 5. CURRENT CODE QUALITY OBSERVATIONS

### Strengths ✓
- Clear separation of concerns (contexts, components, lib)
- Consistent error handling patterns
- Good type definitions
- Proper cleanup of effects and subscriptions
- Security consciousness (binary data guards in `llmModels.ts`)

### Technical Debt 📝
- `transition()` function is a no-op placeholder
- Direct `setExecState()` calls bypass centralized logic
- No retry mechanism for transient failures
- Stall state detection but no UI actions
- Vault retrieval policy defined in plan but not implemented

### Performance Considerations ⚡
- Stall watchdog runs every 1s (consider throttling to 2s)
- Pending queue drains in useEffect (could batch multiple items)
- Conversation history loaded entirely (consider pagination for long chats)

---

## 6. NEXT STEPS RECOMMENDATION

For a clean implementation:

1. **Start Fresh Context Window:** Implement reducer state machine first (foundation)
2. **Then:** Add deterministic termination logic
3. **Finally:** Build +context autocomplete (most complex UX)

Alternatively, if you prefer user-facing value first:
1. **Start:** +context autocomplete (immediate user benefit)
2. **Then:** Vault resolution and budget enforcement
3. **Finally:** Reducer refactor (internal improvement)

---

## 7. ESTIMATED COMPLEXITY

| Task | Lines of Code | Files Modified | Risk Level | Time Estimate |
|------|---------------|----------------|------------|---------------|
| Reducer State Machine | ~300 | 2 core files | High | 4-6 hours |
| Deterministic Termination | ~200 | 3 files | Medium | 3-4 hours |
| +Context Autocomplete UI | ~500 | 5 new files, 2 modified | High | 6-8 hours |
| Vault Resolution Service | ~300 | 4 new files, 2 modified | Medium | 4-5 hours |
| Audit Trail & Sources UI | ~150 | 3 new files | Low | 2-3 hours |
| **Total** | **~1,450** | **~19 files** | **High** | **19-26 hours** |

---

## CONCLUSION

You've built a solid foundation with:
- ✓ All state types defined
- ✓ Request tracking infrastructure
- ✓ Queue system
- ✓ Basic +token extraction
- ✓ Streaming with caps
- ✓ Vault storage backend
- ✓ UI scaffolding

The three major gaps (reducer, termination, autocomplete) are **significant architectural changes** that require:
- Careful planning to avoid regressions
- Comprehensive testing of edge cases
- Potentially multiple context windows to implement cleanly

I recommend proceeding with one major feature at a time, starting with whichever provides the most value to your users or unblocks other work.

