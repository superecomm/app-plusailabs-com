# State Machine Flow Diagrams

## Current Implementation (Direct setState)

```
User Input
    ↓
[IDLE] ←─────────────────┐
    ↓                     │
setExecState("validating")│
    ↓                     │
[VALIDATING]              │
    ↓                     │
setExecState("routing")   │
    ↓                     │
[ROUTING]                 │
    ↓                     │
setExecState("preflight") │
    ↓                     │
[PREFLIGHT]               │
    ↓                     │
setExecState("streaming") │
    ↓                     │
[STREAMING] ←─────────────┤
    ↓     │               │
    │   >2s no tokens     │
    ↓     │               │
[STALLED] ─┘              │
    ↓                     │
  Done?                   │
    ↓                     │
setExecState("done") ─────┘

Issues:
- No validation of transitions
- Direct setState() bypasses logic
- No guard conditions
- Error states not integrated
- Stalled state has no user actions
```

## Desired Implementation (Reducer-Based)

```
User Input
    ↓
dispatch({ type: 'START_VALIDATION', requestId })
    ↓
[IDLE] ─────────────────────────────────────┐
    ↓                                        │
    ├─ validates user authenticated          │
    ├─ validates not rate limited            │
    ├─ validates input not empty             │
    ↓                                        │
[VALIDATING]                                 │
    ↓                                        │
dispatch({ type: 'BEGIN_ROUTING' })          │
    ↓                                        │
    ├─ guards: must be in VALIDATING         │
    ↓                                        │
[ROUTING]                                    │
    ↓                                        │
    ├─ determines model/endpoint             │
    ├─ checks model availability             │
    ↓                                        │
dispatch({ type: 'BEGIN_PREFLIGHT' })        │
    ↓                                        │
    ├─ guards: must be in ROUTING            │
    ↓                                        │
[PREFLIGHT]                                  │
    ↓                                        │
    ├─ resolves +vault tokens               │
    ├─ checks context budget                │
    ├─ validates prompt assembly            │
    ↓                                        │
dispatch({ type: 'START_STREAMING' })        │
    ↓                                        │
    ├─ guards: must be in PREFLIGHT          │
    ↓                                        │
[STREAMING] ←──────────────┐                 │
    ↓     │                │                 │
    │   Token arrives      │                 │
    │     │                │                 │
    │   dispatch({ type: 'RESUME_STREAMING' })
    │     │                │                 │
    │   >2s no tokens      │                 │
    │     │                │                 │
    │   dispatch({ type: 'MARK_STALLED' })   │
    │     ↓                │                 │
    └─> [STALLED] ─────────┘                 │
          ↓     ↓                            │
      User Action                            │
          │     │                            │
      Retry  Cancel                          │
          │     │                            │
          │     └──> dispatch({ type: 'CANCEL' })
          │              ↓                   │
          │          [CANCELLED] ────────────┤
          │                                  │
          └──> dispatch({ type: 'RETRY' })   │
                 └─> [STREAMING]             │
                                             │
    ↓                                        │
  Check termination conditions:              │
    - Natural stop detected                  │
    - Token budget exceeded                  │
    - Character limit reached                │
    - User stopped                           │
    ↓                                        │
dispatch({ type: 'COMPLETE' })               │
    ↓                                        │
    ├─ guards: must be in STREAMING          │
    ↓                                        │
[FINALIZING]                                 │
    ↓                                        │
    ├─ saves message to Firestore            │
    ├─ logs vault usage                      │
    ├─ updates token count                   │
    ↓                                        │
[DONE] ──────────────────────────────────────┘

Error Path:
    Any state
        ↓
    dispatch({ type: 'FAIL', error, category })
        ↓
    ├─ guards: can fail from any non-terminal state
    ↓
    [ERROR]
        ↓
      User Action (Retry / Switch Model)
        ↓
    dispatch({ type: 'RESET' })
        ↓
    [IDLE]

Limit Path:
    [STREAMING or PREFLIGHT]
        ↓
    dispatch({ type: 'HIT_LIMIT' })
        ↓
    ├─ guards: checks token budget exceeded
    ↓
    [LIMITED]
        ↓
      User Action (Upgrade)
        ↓
    Navigate to /pricing

Benefits:
✓ All transitions validated
✓ Guard conditions enforced
✓ Invalid transitions logged and blocked
✓ Side effects isolated to useEffect
✓ Deterministic behavior
✓ Easy to test
```

## Transition Guard Rules

### Valid Transitions
```
IDLE → VALIDATING
VALIDATING → ROUTING | ERROR | LIMITED
ROUTING → PREFLIGHT | ERROR
PREFLIGHT → STREAMING | TOOLING | ERROR | LIMITED
TOOLING → STREAMING | ERROR
STREAMING → STALLED | FINALIZING | CANCELLED | ERROR | LIMITED
STALLED → STREAMING | CANCELLED | RETRYING | ERROR
RETRYING → STREAMING | ERROR | CANCELLED
FINALIZING → DONE | ERROR
DONE → IDLE
ERROR → IDLE
LIMITED → IDLE (after upgrade)
CANCELLED → IDLE
```

### Invalid Transitions (Blocked by Reducer)
```
DONE → STREAMING (can't restart completed request)
ERROR → STREAMING (must reset to IDLE first)
LIMITED → STREAMING (must upgrade first)
CANCELLED → FINALIZING (cancelled requests don't finalize)
IDLE → FINALIZING (can't skip execution)
STREAMING → VALIDATING (can't go backwards)
```

## +Context Autocomplete Flow

```
User typing in textarea
    ↓
  Types "+"
    ↓
Trigger autocomplete
    ↓
    ├─ Get cursor position
    ├─ Calculate dropdown placement
    ├─ Fetch vault items (bio, folders, files)
    ↓
[Show Dropdown]
    ↓
    ├─ Filter items by query (fuzzy search)
    ├─ Show up to 10 results
    ├─ Highlight first item
    ↓
User types more chars (e.g., "+fam")
    ↓
    ├─ Update query
    ├─ Re-filter results
    ├─ Keep dropdown open
    ↓
User navigates with ↓↑
    ↓
    ├─ Update highlight
    ├─ Update accessibility
    ↓
User presses Enter OR clicks item
    ↓
    ├─ Insert token as pill (+family)
    ├─ Store entity ref in metadata
    ├─ Close dropdown
    ├─ Focus back to textarea
    ↓
[Token Inserted]
    ↓
User continues typing...
    ↓
User submits message
    ↓
[Vault Resolution Phase]
    ↓
    ├─ Extract entity refs from metadata
    ├─ Fetch each item from Firestore
    ├─ Check allowInChat permissions
    ├─ Accumulate content within budget
    │   ├─ Free tier: 1,500 chars max
    │   ├─ Paid tier: 6,000 chars max
    │   └─ Super tier: 12,000 chars max
    ↓
[Build Final Prompt]
    ↓
    ├─ System instructions
    ├─ Safety guidelines
    ├─ Vault context (if refs exist)
    │   └─ "User Context (from +Vault):"
    │       "Bio: [content...]"
    │       "Family Notes: [content...]"
    ├─ User message
    ↓
Send to LLM
    ↓
Stream response
    ↓
[Save Message]
    ↓
    ├─ Store assistant message
    ├─ Log vault usage event
    │   └─ vaultUsageEvents/{eventId}
    │       - conversationId
    │       - messageId
    │       - vaultItemIds[]
    │       - timestamp
    │       - model
    │       - charCount
    ├─ Display ContextSourcesBar
    │   └─ "Used +Vault: Bio, Family Notes"
    ↓
[Done]
```

## Deterministic Termination Checks

```
During [STREAMING] state:
    ↓
Every token received:
    ↓
    ├─ Increment token count
    ├─ Check character count
    ├─ Check budget remaining
    ├─ Check semantic stop signals
    ↓
If any limit reached:
    ↓
    ├─ Token budget exceeded?
    │   └─> dispatch({ type: 'HIT_LIMIT' })
    │
    ├─ Character cap reached (8k)?
    │   └─> dispatch({ type: 'COMPLETE', reason: 'char_limit' })
    │
    ├─ Natural stop detected?
    │   └─> dispatch({ type: 'COMPLETE', reason: 'semantic_stop' })
    │
    ├─ >2s no tokens?
    │   └─> dispatch({ type: 'MARK_STALLED' })
    │       └─> Show UI: [Retry] [Cancel]
    │
    └─ User clicked stop?
        └─> dispatch({ type: 'CANCEL' })

Semantic Stop Signals:
    - Sentence ending: /[.!?]\s*$/
    - Code fence closed: /```\s*$/
    - List completion: /\n\s*\n/
    - Response threshold: >500 tokens and natural pause
```

## Implementation Phases

### Phase 1: Core Reducer (4-6 hours)
```typescript
// contexts/ChatContext.tsx

type ExecAction = 
  | { type: 'START_VALIDATION'; requestId: string }
  | { type: 'BEGIN_ROUTING' }
  | { type: 'BEGIN_PREFLIGHT' }
  | { type: 'START_STREAMING' }
  | { type: 'MARK_STALLED' }
  | { type: 'RESUME_STREAMING' }
  | { type: 'RETRY' }
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
  // Validate transitions
  // Update state
  // Log invalid attempts
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

### Phase 2: Termination Logic (3-4 hours)
```typescript
// Add to reducer state
tokenBudget: number; // based on tier
semanticStopEnabled: boolean;

// In streaming callback
const onToken = (token: string) => {
  const estimatedTokens = estimateTokenCount(token);
  dispatchExec({ 
    type: 'TOKEN_RECEIVED', 
    token, 
    estimatedTokens 
  });
  
  // Reducer handles budget checks internally
};

// Semantic stop detection
function detectNaturalStop(text: string): boolean {
  const sentences = text.match(/[.!?]\s/g)?.length ?? 0;
  const hasEnding = /[.!?]\s*$/.test(text.trim());
  return sentences >= 3 && hasEnding;
}
```

### Phase 3: Autocomplete UI (6-8 hours)
```typescript
// hooks/useVaultAutocomplete.ts
export function useVaultAutocomplete(
  inputRef: RefObject<HTMLTextAreaElement>
) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<VaultItem[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Monitor input for "+" trigger
  // Fetch and filter vault items
  // Handle keyboard navigation
  // Return state and handlers
}

// components/vault/VaultAutocomplete.tsx
export function VaultAutocomplete({ 
  items, 
  selectedIndex, 
  onSelect, 
  onClose 
}) {
  // Render dropdown with items
  // Handle click/keyboard selection
}
```

### Phase 4: Vault Resolution (4-5 hours)
```typescript
// lib/vaultPolicy.ts
export async function resolveVaultContext(
  userId: string,
  vaultRefs: VaultRef[],
  budget: number
): Promise<VaultContext> {
  const items = [];
  let totalChars = 0;
  
  for (const ref of vaultRefs) {
    if (totalChars >= budget) break;
    
    const item = await fetchVaultItem(userId, ref.id, ref.type);
    if (!item?.allowInChat) continue;
    
    const content = truncate(item.content, budget - totalChars);
    items.push({ source: ref.name, content, chars: content.length });
    totalChars += content.length;
  }
  
  return {
    items,
    totalChars,
    exceeded: totalChars >= budget,
  };
}
```

---

## Testing Checklist

### Reducer State Machine
- [ ] Valid transition: idle → validating → routing → preflight → streaming → done
- [ ] Invalid transition blocked: done → streaming
- [ ] Invalid transition blocked: error → streaming (without reset)
- [ ] Concurrent dispatch handled gracefully
- [ ] State logged on invalid transition

### Termination Logic
- [ ] Character limit enforced (8k cap)
- [ ] Token budget enforced per tier
- [ ] Semantic stop detected on natural ending
- [ ] Stall UI shown after 2s no tokens
- [ ] Retry action works from stalled state
- [ ] Cancel action aborts and cleans up

### Autocomplete
- [ ] Dropdown appears on "+" character
- [ ] Fuzzy search filters results
- [ ] Keyboard ↑↓ navigation works
- [ ] Enter selects highlighted item
- [ ] Click selects item
- [ ] Pill inserted with correct token
- [ ] Entity ref stored in metadata
- [ ] Dropdown closes after selection

### Vault Resolution
- [ ] Bio content fetched correctly
- [ ] Folder/file content fetched correctly
- [ ] allowInChat permission respected
- [ ] Character budget enforced (1.5k/6k/12k)
- [ ] Content truncated when budget exceeded
- [ ] Prompt includes vault context
- [ ] ContextSourcesBar displays correctly
- [ ] Usage event logged to Firestore

---

## Performance Optimizations

1. **Debounce autocomplete search:** Wait 150ms after typing stops
2. **Cache vault items:** Store recently fetched items in memory
3. **Lazy load vault content:** Only fetch when user selects token
4. **Batch Firestore reads:** Use `getAll()` for multiple refs
5. **Optimize stall watchdog:** Check every 2s instead of 1s
6. **Virtualize long conversations:** Render only visible messages

