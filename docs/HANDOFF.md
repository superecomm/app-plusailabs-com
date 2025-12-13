# Session Handoff Document
*Context Review Completed: December 13, 2025*

## Executive Summary

This session completed a comprehensive review of the +AI chat implementation. The codebase has a **solid foundation** with execution states, request tracking, vault storage, and basic +token extraction already in place. Three major architectural features remain to be implemented:

1. **Reducer-based state machine** (6 hours)
2. **Deterministic termination** (5 hours)
3. **+Context autocomplete with vault resolution** (19 hours)

**Total remaining work:** ~30 hours of focused development

---

## What Was Accomplished This Session

### Documentation Created
1. ✅ **`docs/current-implementation-review.md`**
   - Comprehensive inventory of completed features
   - Detailed gap analysis for each outstanding feature
   - Code quality observations and technical debt notes
   - Estimated complexity and time breakdown

2. ✅ **`docs/state-machine-flows.md`**
   - Visual flow diagrams (current vs. desired)
   - Transition guard rules
   - Implementation examples for each phase
   - Testing checklist with specific scenarios

3. ✅ **`docs/implementation-checklist.md`**
   - Phase-by-phase task breakdown
   - Acceptance criteria for each feature
   - Risk mitigation strategies
   - Success metrics

4. ✅ **`docs/quick-reference.md`**
   - Quick access to key code locations
   - Common patterns and pitfalls
   - Debugging tips
   - Environment variables reference

5. ✅ **`docs/HANDOFF.md`** (this file)
   - Session summary
   - Next steps recommendation
   - Key decisions documented

### Code Review Completed
- ✅ Analyzed 19+ files across contexts, components, lib, and API routes
- ✅ Identified all execution state types and transitions
- ✅ Mapped vault storage infrastructure (Firestore + Firebase Storage)
- ✅ Reviewed streaming implementation and stall detection
- ✅ Examined +token extraction and prompt assembly
- ✅ Documented pending queue and abort controller integration

---

## Current State Assessment

### Strengths ✓
- **Well-structured codebase:** Clear separation of concerns (contexts, components, lib)
- **Type safety:** Comprehensive TypeScript definitions
- **Error handling:** LLM error classification with user-friendly messages
- **Security:** Binary data guards prevent unsafe payloads
- **Streaming:** Token-by-token streaming with soft caps
- **Vault backend:** Firestore collections and Firebase Storage integrated
- **Queue system:** Handles submissions while busy
- **Subscription logic:** Tier-based features partially implemented

### Technical Debt 📝
- **No-op transition function:** `transition()` in ChatContext is a placeholder
- **Direct setState calls:** Bypass centralized state management logic
- **Missing retry mechanism:** Transient failures have no auto-retry
- **Stalled state passive:** Detection works but no UI actions presented
- **Vault policy not implemented:** Plan exists but no code for retrieval/budget logic

### Critical Gaps ❌
1. **State machine:** No enforcement of valid transitions, no guard conditions
2. **Token budgets:** No per-tier token tracking or budget enforcement
3. **Semantic stops:** No detection of natural completion signals
4. **Autocomplete UI:** Only regex extraction, no dropdown or pill rendering
5. **Vault resolution:** No code to fetch referenced items and inject into prompts
6. **Audit trail:** No usage event logging for vault items

---

## Recommended Implementation Order

### Option A: Foundation First (Recommended)
**Best for:** Ensuring reliable execution before building features

1. **Phase 1:** Reducer-based state machine (6 hours)
   - Establishes reliable state management
   - Prevents invalid transitions
   - Makes debugging deterministic
   - **Files:** `contexts/ChatContext.tsx`, `components/viim/NeuralBox.tsx`

2. **Phase 2:** Deterministic termination (5 hours)
   - Adds token budgets per tier
   - Implements semantic stop detection
   - Surfaces Retry/Cancel during stalls
   - **Files:** `contexts/ChatContext.tsx`, `components/viim/NeuralBox.tsx`, `components/StallActionsBar.tsx` (NEW)

3. **Phase 3:** Autocomplete + Vault resolution (19 hours)
   - Autocomplete dropdown on "+" character
   - Pill-style token insertion
   - Vault content fetching and injection
   - Context sources bar and audit logging
   - **Files:** 7 new files, 4 modified

**Pros:**
- Lower regression risk
- Each phase builds on the previous
- Easier debugging if issues arise
- Reducer makes later phases cleaner

**Cons:**
- No user-visible features until Phase 3

---

### Option B: User Value First
**Best for:** Demonstrating features to stakeholders/users

1. **Phase 1:** Autocomplete UI (10 hours)
   - Dropdown appears on "+" character
   - Fuzzy search vault items
   - Pill insertion (without actual content resolution yet)
   - **Files:** `hooks/useVaultAutocomplete.ts` (NEW), `components/vault/VaultAutocomplete.tsx` (NEW), etc.

2. **Phase 2:** Vault resolution (9 hours)
   - Fetch vault content for referenced tokens
   - Inject into prompts with budget enforcement
   - Show context sources bar
   - Log usage events
   - **Files:** `lib/vaultPolicy.ts` (NEW), `lib/vaultUsage.ts` (NEW), etc.

3. **Phase 3:** Reducer + Termination (11 hours)
   - Refactor state management
   - Add token budgets and semantic stops
   - **Files:** `contexts/ChatContext.tsx`, `components/viim/NeuralBox.tsx`

**Pros:**
- Immediate user-visible feature
- Can demo +context autocomplete early
- Parallel work possible (if multiple devs)

**Cons:**
- Higher regression risk
- Harder to debug issues
- Phase 3 refactor might require rework of Phases 1-2

---

## Key Decisions to Make

Before starting implementation, decide:

1. **Which implementation order?**
   - Foundation first (Option A) - recommended
   - User value first (Option B)

2. **Autocomplete trigger:**
   - Just "+" character? (simpler)
   - Or "+" followed by start typing? (reduces false triggers)

3. **Vault budget strategy:**
   - Strict cutoff when budget exceeded? (cleaner)
   - Or allow slight overage (better UX, harder to enforce)

4. **Semantic stop aggressiveness:**
   - Conservative (fewer false stops, longer responses)
   - Aggressive (more stops, shorter responses)

5. **Stall UI placement:**
   - Inline in message stream?
   - Fixed bar at bottom?
   - Modal overlay?

6. **Token pill rendering:**
   - Inline in textarea (complex)
   - Separate pill list below textarea (simpler)

7. **Mobile autocomplete:**
   - Full feature parity with desktop?
   - Or simplified mobile experience?

---

## Files You'll Be Modifying

### Core State Management (Phase 1 & 2)
```
contexts/ChatContext.tsx
components/viim/NeuralBox.tsx
```

### New Components (Phase 3)
```
components/vault/VaultAutocomplete.tsx
components/vault/VaultTokenPill.tsx
components/vault/ContextSourcesBar.tsx
components/StallActionsBar.tsx (Phase 2)
```

### New Hooks (Phase 3)
```
hooks/useVaultAutocomplete.ts
```

### New Services (Phase 3)
```
lib/vaultPolicy.ts
lib/vaultUsage.ts
```

### Type Definitions
```
types/conversation.ts (add vaultRefs field)
```

---

## Testing Strategy

### Unit Tests
- Reducer transition validation
- Vault budget enforcement
- Fuzzy search for autocomplete
- Token counting accuracy
- Semantic stop detection

### Integration Tests
- Full flow: type +token → autocomplete → select → submit → vault resolved → LLM response
- Error recovery paths
- Concurrent request handling
- Tier-based budget enforcement

### Manual Testing
- Desktop browsers (Chrome, Firefox, Safari)
- Mobile browsers (iOS Safari, Chrome mobile)
- Keyboard navigation
- Screen reader compatibility
- Performance with large vaults

---

## Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Autocomplete appear time | <200ms | <500ms |
| Vault resolution time | <500ms | <1000ms |
| Token counting overhead | <10ms per token | <50ms |
| Stall detection latency | 2s ±100ms | <3s |
| Firestore read latency | <200ms | <500ms |

---

## Risk Assessment

### High Risk 🔴
- **State machine refactor:** Core execution flow, potential for regressions
  - *Mitigation:* Incremental implementation, comprehensive testing, keep old code until verified
- **Autocomplete on mobile:** Complex cursor/selection logic, OS-specific edge cases
  - *Mitigation:* Early testing on real devices, fallback to disable on problematic platforms

### Medium Risk 🟡
- **Vault resolution latency:** Network calls in critical path
  - *Mitigation:* Aggressive caching, batch reads, show loading state
- **Token counting accuracy:** Estimation vs. actual usage
  - *Mitigation:* Conservative estimates, 10% buffer, tier-specific tuning

### Low Risk 🟢
- **Context sources bar:** Purely additive UI
- **Audit logging:** Fire-and-forget, non-blocking

---

## Open Questions

1. **Should we support nested vault references?**
   - e.g., "Tell me about +family using context from +recipes"
   - Complexity: High
   - User value: Medium
   - **Decision pending**

2. **How should we handle vault items that change during a conversation?**
   - Use snapshot from when referenced?
   - Or always fetch latest?
   - **Decision pending**

3. **Should we show vault content preview in autocomplete dropdown?**
   - Pro: Better user understanding
   - Con: More API calls, slower dropdown
   - **Decision pending**

4. **How do we handle vault items the user no longer has access to?**
   - Show error in sources bar?
   - Silently exclude?
   - **Decision pending**

5. **Should semantic stop be user-configurable?**
   - Setting in preferences?
   - Per-message toggle?
   - Always on/always off?
   - **Decision pending**

---

## Code Snippets for Quick Start

### Reducer Setup (Phase 1)
```typescript
// contexts/ChatContext.tsx

type ExecAction = 
  | { type: 'START_VALIDATION'; requestId: string }
  | { type: 'BEGIN_ROUTING' }
  | { type: 'BEGIN_PREFLIGHT' }
  | { type: 'START_STREAMING' }
  | { type: 'MARK_STALLED' }
  | { type: 'RESUME_STREAMING' }
  | { type: 'COMPLETE'; reason?: string }
  | { type: 'FAIL'; error: string; category: LLMErrorCategory }
  | { type: 'CANCEL' }
  | { type: 'HIT_LIMIT' }
  | { type: 'RESET' };

interface ExecStateData {
  state: ExecState;
  requestId: string | null;
  error: string | null;
  errorCategory: LLMErrorCategory | null;
  tokenCount: number;
  charCount: number;
}

function execReducer(state: ExecStateData, action: ExecAction): ExecStateData {
  switch (action.type) {
    case 'START_VALIDATION':
      if (state.state !== 'idle') {
        console.warn(`Invalid transition: ${state.state} → START_VALIDATION`);
        return state;
      }
      return {
        ...state,
        state: 'validating',
        requestId: action.requestId,
        error: null,
        errorCategory: null,
        tokenCount: 0,
        charCount: 0,
      };
    
    case 'BEGIN_ROUTING':
      if (state.state !== 'validating') {
        console.warn(`Invalid transition: ${state.state} → BEGIN_ROUTING`);
        return state;
      }
      return { ...state, state: 'routing' };
    
    // ... more cases
    
    default:
      console.warn(`Unknown action type:`, action);
      return state;
  }
}

const [execData, dispatchExec] = useReducer(execReducer, {
  state: 'idle',
  requestId: null,
  error: null,
  errorCategory: null,
  tokenCount: 0,
  charCount: 0,
});
```

### Autocomplete Hook (Phase 3)
```typescript
// hooks/useVaultAutocomplete.ts

export function useVaultAutocomplete(inputRef: RefObject<HTMLTextAreaElement>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<VaultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Monitor input for "+" trigger
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    const handleInput = (e: InputEvent) => {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.slice(0, cursorPos);
      const match = textBeforeCursor.match(/(?:^|\s)\+([A-Za-z0-9_-]*)$/);
      
      if (match) {
        setQuery(match[1]);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    textarea.addEventListener('input', handleInput);
    return () => textarea.removeEventListener('input', handleInput);
  }, [inputRef]);
  
  // Fetch and filter vault items
  useEffect(() => {
    if (!isOpen) return;
    
    // Debounced fetch
    const timerId = setTimeout(async () => {
      const allItems = await fetchVaultItems(); // from Firestore
      const filtered = fuzzyFilter(allItems, query);
      setItems(filtered.slice(0, 10));
    }, 150);
    
    return () => clearTimeout(timerId);
  }, [query, isOpen]);
  
  return { isOpen, query, items, selectedIndex, setSelectedIndex };
}
```

### Vault Resolution (Phase 3)
```typescript
// lib/vaultPolicy.ts

export async function resolveVaultContext(
  userId: string,
  vaultRefs: VaultRef[],
  budget: number
): Promise<VaultContext> {
  const items: Array<{ source: string; content: string; chars: number }> = [];
  let totalChars = 0;
  
  for (const ref of vaultRefs) {
    if (totalChars >= budget) break;
    
    const item = await fetchVaultItem(userId, ref.id, ref.type);
    if (!item) continue;
    if (!item.allowInChat) continue;
    
    const remainingBudget = budget - totalChars;
    const content = truncate(item.content, remainingBudget);
    
    items.push({
      source: ref.name,
      content,
      chars: content.length,
    });
    
    totalChars += content.length;
  }
  
  return {
    items,
    totalChars,
    exceeded: totalChars >= budget,
  };
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + '...';
}
```

---

## Success Criteria

### Phase 1: Reducer State Machine ✓
- [ ] All state transitions validated by reducer
- [ ] Invalid transitions blocked and logged (console.warn)
- [ ] No direct `setExecState()` calls remain
- [ ] Tests pass for all transition scenarios
- [ ] No regressions in existing functionality

### Phase 2: Deterministic Termination ✓
- [ ] Token budget enforced per tier (10k/100k/500k)
- [ ] Character limit stops at 8k
- [ ] Semantic stop detection works (sentence endings)
- [ ] Stall UI appears after 2s without tokens
- [ ] Retry/Cancel buttons functional
- [ ] Tests pass for all termination scenarios

### Phase 3: Autocomplete + Vault Resolution ✓
- [ ] Dropdown appears on "+" character (<200ms)
- [ ] Fuzzy search filters vault items correctly
- [ ] Keyboard navigation works (↑↓, Enter, Esc)
- [ ] Mouse selection works
- [ ] Pills inserted correctly
- [ ] Entity refs saved to message metadata
- [ ] Vault content fetched and injected (<500ms)
- [ ] Budget enforced per tier (1.5k/6k/12k chars)
- [ ] Context sources bar displays correctly
- [ ] Usage events logged to Firestore
- [ ] Works on desktop and mobile
- [ ] Tests pass for all scenarios

---

## Next Session Kickoff

### If Starting Fresh Context Window

1. **Read these docs first:**
   - `docs/quick-reference.md` (fastest overview)
   - `docs/implementation-checklist.md` (detailed tasks)
   - `docs/state-machine-flows.md` (if implementing reducer)

2. **Confirm implementation order:**
   - Foundation first (Option A) - recommended
   - Or user value first (Option B)

3. **Start coding:**
   - Begin with Phase 1 of chosen order
   - Follow checklist step by step
   - Test incrementally

### If Continuing in This Session

**We're ready to start implementation now.** Choose:
- **Option A:** Reducer first (recommended)
- **Option B:** Autocomplete first

Let me know which you prefer and I'll begin implementing.

---

## Resources

### Documentation
- **Current state:** `docs/current-implementation-review.md`
- **Flow diagrams:** `docs/state-machine-flows.md`
- **Task checklist:** `docs/implementation-checklist.md`
- **Quick reference:** `docs/quick-reference.md`
- **This handoff:** `docs/HANDOFF.md`

### Original Plans
- **Vault plan:** `.cursor/plans/vault-cf2b7a61.plan.md`
- **System architecture:** `docs/system-architecture.md`

### Key Files
- **ChatContext:** `contexts/ChatContext.tsx`
- **NeuralBox:** `components/viim/NeuralBox.tsx`
- **Firestore helpers:** `lib/firestore.ts`
- **LLM models:** `lib/models/llmModels.ts`
- **Conversation types:** `types/conversation.ts`

---

## Final Recommendation

**Start with the reducer-based state machine (Option A, Phase 1).**

**Why:**
- Foundation for all other features
- Lower risk of regressions
- Makes debugging deterministic
- Cleaner implementation of later phases
- Only 6 hours to complete

**Then** proceed to deterministic termination (5 hours), then autocomplete + vault resolution (19 hours).

**Total: ~30 hours** of focused development to complete all three major features.

The codebase is solid and well-structured. The remaining work is well-defined and achievable. You're set up for success. 🚀

---

*End of handoff document. Ready to proceed with implementation.*

