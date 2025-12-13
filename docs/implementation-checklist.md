# Implementation Checklist

## Phase 1: Reducer-Based State Machine

### 1.1 Define Action Types
- [ ] Create `ExecAction` type union in `contexts/ChatContext.tsx`
- [ ] Define action types for each transition:
  - [ ] `START_VALIDATION`
  - [ ] `BEGIN_ROUTING`
  - [ ] `BEGIN_PREFLIGHT`
  - [ ] `START_STREAMING`
  - [ ] `MARK_STALLED`
  - [ ] `RESUME_STREAMING`
  - [ ] `RETRY`
  - [ ] `COMPLETE`
  - [ ] `FAIL`
  - [ ] `CANCEL`
  - [ ] `HIT_LIMIT`
  - [ ] `RESET`

### 1.2 Create Reducer Function
- [ ] Create `ExecStateData` interface
  - [ ] `state: ExecState`
  - [ ] `requestId: string | null`
  - [ ] `error: string | null`
  - [ ] `errorCategory: LLMErrorCategory | null`
  - [ ] `tokenCount: number`
  - [ ] `charCount: number`
- [ ] Implement `execReducer(state, action)` function
- [ ] Add transition validation logic
- [ ] Add guard conditions for each transition
- [ ] Add logging for invalid transitions
- [ ] Add default case for unknown actions

### 1.3 Replace useState with useReducer
- [ ] Replace `const [execState, setExecState] = useState<ExecState>("idle")`
- [ ] With `const [execData, dispatchExec] = useReducer(execReducer, initialState)`
- [ ] Update context interface to expose `dispatchExec`
- [ ] Update context provider value

### 1.4 Replace Direct setState Calls
**In `contexts/ChatContext.tsx`:**
- [ ] Replace `setExecState("idle")` with `dispatchExec({ type: 'RESET' })`
- [ ] Replace `setExecState("stalled")` with `dispatchExec({ type: 'MARK_STALLED' })`
- [ ] Replace `setExecState("streaming")` with `dispatchExec({ type: 'RESUME_STREAMING' })`

**In `components/viim/NeuralBox.tsx`:**
- [ ] Replace `setExecState("validating")` with `dispatchExec({ type: 'START_VALIDATION', requestId })`
- [ ] Replace `setExecState("routing")` with `dispatchExec({ type: 'BEGIN_ROUTING' })`
- [ ] Replace `setExecState("preflight")` with `dispatchExec({ type: 'BEGIN_PREFLIGHT' })`
- [ ] Replace `setExecState("streaming")` with `dispatchExec({ type: 'START_STREAMING' })`
- [ ] Replace `setExecState("error")` with `dispatchExec({ type: 'FAIL', error, category })`
- [ ] Replace `setExecState("limited")` with `dispatchExec({ type: 'HIT_LIMIT' })`
- [ ] Replace `setExecState("done")` with `dispatchExec({ type: 'COMPLETE' })`

### 1.5 Update Component Access
- [ ] Update `canSubmit` to use `execData.state` instead of `execState`
- [ ] Update UI conditionals to use `execData.state`
- [ ] Update stall detection to use `execData.state`

### 1.6 Testing
- [ ] Test valid transition: idle → validating → routing → preflight → streaming → done
- [ ] Test invalid transition blocked: done → streaming
- [ ] Test error state transitions
- [ ] Test concurrent dispatches
- [ ] Test state persistence across renders

---

## Phase 2: Deterministic Termination

### 2.1 Token Budget Tracking
- [ ] Add `tokenBudget` to `ExecStateData`
- [ ] Create `getTierTokenBudget(subscription)` helper
  - [ ] Free tier: 10,000 tokens
  - [ ] Paid tier: 100,000 tokens
  - [ ] Super tier: 500,000 tokens
- [ ] Add `TOKEN_RECEIVED` action type
- [ ] Update reducer to increment `tokenCount` on `TOKEN_RECEIVED`
- [ ] Add budget check in reducer
  - [ ] If `tokenCount > tokenBudget * 0.95` → `HIT_LIMIT`

### 2.2 Character Counting
- [ ] Update `charCount` in reducer on `TOKEN_RECEIVED`
- [ ] Add hard cap check (8,000 chars)
- [ ] If cap reached → `COMPLETE` with reason `'char_limit'`

### 2.3 Semantic Stop Detection
- [ ] Create `detectNaturalStop(text: string)` helper
- [ ] Check for sentence endings: `/[.!?]\s*$/`
- [ ] Check for code fence closures: `/```\s*$/`
- [ ] Check for natural pauses: multiple sentences + ending
- [ ] Add check in streaming callback
- [ ] If detected → `COMPLETE` with reason `'semantic_stop'`

### 2.4 Stall Actions UI
- [ ] Create `StallActionsBar.tsx` component
- [ ] Add Retry button
  - [ ] Calls `dispatchExec({ type: 'RETRY' })`
  - [ ] Resumes streaming from last position
- [ ] Add Cancel button
  - [ ] Calls `dispatchExec({ type: 'CANCEL' })`
  - [ ] Aborts request and saves partial content
- [ ] Show bar when `execData.state === 'stalled'`
- [ ] Hide bar when state changes to streaming/done

### 2.5 Testing
- [ ] Test token budget enforcement per tier
- [ ] Test character limit stops streaming
- [ ] Test semantic stop detection
- [ ] Test stall UI appears after 2s
- [ ] Test retry resumes streaming
- [ ] Test cancel saves partial content

---

## Phase 3: +Context Autocomplete

### 3.1 Autocomplete Hook
- [ ] Create `hooks/useVaultAutocomplete.ts`
- [ ] Monitor textarea input for "+" character
- [ ] Track cursor position
- [ ] Calculate dropdown placement
- [ ] Debounce query updates (150ms)
- [ ] Fetch vault items from Firestore
- [ ] Implement fuzzy search filtering
- [ ] Handle keyboard navigation (↑↓ arrows)
- [ ] Handle Enter key selection
- [ ] Handle Escape key close
- [ ] Return state: `{ isOpen, items, selectedIndex, position, query }`

### 3.2 Autocomplete Dropdown Component
- [ ] Create `components/vault/VaultAutocomplete.tsx`
- [ ] Render dropdown at calculated position
- [ ] List vault items (bio, folders, files)
- [ ] Show item type icons
- [ ] Highlight selected item
- [ ] Handle mouse hover/click selection
- [ ] Show empty state if no results
- [ ] Add accessibility attributes (role, aria-*)

### 3.3 Token Pill Component
- [ ] Create `components/vault/VaultTokenPill.tsx`
- [ ] Render styled pill/chip
- [ ] Show token name (e.g., "+family")
- [ ] Add delete button (×)
- [ ] Handle backspace deletion when adjacent
- [ ] Make non-editable (contentEditable=false)

### 3.4 Input Integration
- [ ] Modify `NeuralBox.tsx` textarea handling
- [ ] Use `useVaultAutocomplete` hook
- [ ] Detect "+" trigger and show dropdown
- [ ] Insert token pill on selection
- [ ] Store entity ref in component state
- [ ] Include refs in message metadata on submit

### 3.5 Message Type Extension
- [ ] Update `types/conversation.ts`
- [ ] Add `vaultRefs` field to `ConversationMessage`
  ```typescript
  vaultRefs?: Array<{
    id: string;
    type: 'bio' | 'folder' | 'file';
    name: string;
    token: string;
  }>;
  ```
- [ ] Update Firestore save logic to include `vaultRefs`

### 3.6 Testing
- [ ] Test dropdown appears on "+" character
- [ ] Test fuzzy search filters correctly
- [ ] Test keyboard navigation
- [ ] Test mouse selection
- [ ] Test pill insertion
- [ ] Test pill deletion
- [ ] Test entity refs saved to Firestore
- [ ] Test autocomplete on mobile devices

---

## Phase 4: Vault Resolution

### 4.1 Vault Policy Service
- [ ] Create `lib/vaultPolicy.ts`
- [ ] Implement `resolveVaultContext(userId, vaultRefs, budget)` function
- [ ] Fetch bio content from Firestore
- [ ] Fetch folder/file content from Firestore
- [ ] Check `allowInChat` permissions per item
- [ ] Accumulate content within budget
- [ ] Truncate content if budget exceeded
- [ ] Return structured `VaultContext` object

### 4.2 Budget Configuration
- [ ] Create `getTierContextBudget(subscription)` helper
  - [ ] Free tier: 1,500 chars
  - [ ] Paid tier: 6,000 chars
  - [ ] Super tier: 12,000 chars
- [ ] Add budget to `ExecStateData`
- [ ] Enforce budget in `resolveVaultContext`

### 4.3 Prompt Injection
- [ ] Update `buildPrompt()` in `NeuralBox.tsx`
- [ ] Add `vaultContext` parameter
- [ ] Inject vault content after system/safety instructions
- [ ] Format: 
  ```
  User Context (from +Vault):
  - Bio: [content]
  - Family Notes: [content]
  ```

### 4.4 Vault Resolution Integration
- [ ] Update `handleTextSubmit()` in `NeuralBox.tsx`
- [ ] After extracting +tokens, call `resolveVaultContext()`
- [ ] Pass resolved content to `buildPrompt()`
- [ ] Handle resolution errors gracefully
- [ ] Log resolution time for debugging

### 4.5 Context Sources Bar
- [ ] Create `components/vault/ContextSourcesBar.tsx`
- [ ] Display under assistant messages
- [ ] Show list of vault items used
- [ ] Format: "Used +Vault: Bio, Family Notes (+2 more)"
- [ ] Add expand/collapse for long lists
- [ ] Link to vault items (optional)

### 4.6 Usage Audit Logging
- [ ] Create `lib/vaultUsage.ts`
- [ ] Implement `logVaultUsage(params)` function
- [ ] Write to `users/{uid}/vaultUsageEvents/{eventId}`
- [ ] Include:
  - [ ] `conversationId`
  - [ ] `messageId`
  - [ ] `vaultItemIds[]`
  - [ ] `timestamp`
  - [ ] `model`
  - [ ] `provider`
  - [ ] `charCount`
- [ ] Call after each assistant response

### 4.7 Testing
- [ ] Test bio content fetched correctly
- [ ] Test folder/file content fetched correctly
- [ ] Test `allowInChat=false` items excluded
- [ ] Test budget enforcement (1.5k/6k/12k)
- [ ] Test content truncation when over budget
- [ ] Test prompt includes vault context
- [ ] Test sources bar displays correctly
- [ ] Test usage event logged to Firestore
- [ ] Test performance with many vault items

---

## Phase 5: Polish & Cleanup

### 5.1 Error Handling
- [ ] Add error boundary around autocomplete
- [ ] Handle vault fetch failures gracefully
- [ ] Show user-friendly error messages
- [ ] Log errors to console for debugging

### 5.2 Performance Optimization
- [ ] Debounce autocomplete search (150ms)
- [ ] Cache vault items in memory (5 min TTL)
- [ ] Lazy load vault content on selection
- [ ] Batch Firestore reads with `getAll()`
- [ ] Optimize stall watchdog interval (2s)

### 5.3 Accessibility
- [ ] Add ARIA labels to autocomplete
- [ ] Add keyboard shortcuts documentation
- [ ] Test with screen reader
- [ ] Ensure focus management is correct
- [ ] Add skip links if needed

### 5.4 Mobile Optimization
- [ ] Test autocomplete on mobile Safari
- [ ] Test autocomplete on Chrome mobile
- [ ] Adjust dropdown positioning for small screens
- [ ] Test pill insertion/deletion with touch
- [ ] Ensure keyboard behavior on mobile

### 5.5 Documentation
- [ ] Update README with +context feature
- [ ] Document autocomplete keyboard shortcuts
- [ ] Document vault resolution logic
- [ ] Add code comments for complex logic
- [ ] Update type definitions

### 5.6 Testing
- [ ] End-to-end test: type +token → autocomplete → select → submit → vault resolved → response
- [ ] Test error recovery paths
- [ ] Test concurrent requests
- [ ] Test with different subscription tiers
- [ ] Performance test with large vault

---

## Acceptance Criteria

### Reducer State Machine ✓
- [ ] All state transitions validated by reducer
- [ ] Invalid transitions blocked and logged
- [ ] State updates are deterministic
- [ ] No direct `setExecState()` calls remain
- [ ] Tests pass for all transition scenarios

### Deterministic Termination ✓
- [ ] Token budget enforced per tier
- [ ] Character limit stops streaming at 8k
- [ ] Semantic stop detection works
- [ ] Stall UI appears after 2s no tokens
- [ ] Retry/Cancel actions work correctly
- [ ] Tests pass for all termination scenarios

### +Context Autocomplete ✓
- [ ] Dropdown appears on "+" character
- [ ] Fuzzy search filters vault items
- [ ] Keyboard navigation works (↑↓, Enter, Esc)
- [ ] Mouse selection works
- [ ] Pill inserted correctly
- [ ] Entity refs saved to message metadata
- [ ] Works on desktop and mobile
- [ ] Tests pass for all autocomplete scenarios

### Vault Resolution ✓
- [ ] Bio content fetched and injected
- [ ] Folder/file content fetched and injected
- [ ] `allowInChat` permissions respected
- [ ] Character budget enforced per tier
- [ ] Prompt includes vault context
- [ ] Sources bar displays correctly
- [ ] Usage events logged to Firestore
- [ ] Tests pass for all resolution scenarios

### Performance ✓
- [ ] Autocomplete search debounced
- [ ] Vault items cached appropriately
- [ ] Firestore reads batched when possible
- [ ] No UI jank during streaming
- [ ] Mobile performance acceptable

### Accessibility ✓
- [ ] Keyboard navigation fully functional
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Focus management correct

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Linting errors resolved
- [ ] TypeScript errors resolved
- [ ] Manual testing completed
- [ ] Performance profiling done
- [ ] Security review done

### Firestore Setup
- [ ] Add indexes if needed
- [ ] Update security rules for `vaultUsageEvents`
- [ ] Verify storage rules for vault files

### Environment Variables
- [ ] No new env vars needed (using existing Firebase config)

### Deployment
- [ ] Deploy to staging environment
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Monitor performance metrics

### Post-Deployment
- [ ] Verify autocomplete works in production
- [ ] Verify vault resolution works in production
- [ ] Check Firestore usage logs
- [ ] Monitor user feedback
- [ ] Fix any critical bugs

---

## Estimated Time Breakdown

| Phase | Task | Time Estimate |
|-------|------|---------------|
| **Phase 1** | Define action types | 30 min |
| | Create reducer function | 2 hours |
| | Replace useState with useReducer | 1 hour |
| | Replace direct setState calls | 1.5 hours |
| | Testing | 1 hour |
| | **Phase 1 Total** | **6 hours** |
| **Phase 2** | Token budget tracking | 1 hour |
| | Character counting | 30 min |
| | Semantic stop detection | 1.5 hours |
| | Stall actions UI | 1 hour |
| | Testing | 1 hour |
| | **Phase 2 Total** | **5 hours** |
| **Phase 3** | Autocomplete hook | 2 hours |
| | Autocomplete dropdown | 2 hours |
| | Token pill component | 1 hour |
| | Input integration | 2 hours |
| | Message type extension | 1 hour |
| | Testing | 2 hours |
| | **Phase 3 Total** | **10 hours** |
| **Phase 4** | Vault policy service | 2 hours |
| | Budget configuration | 30 min |
| | Prompt injection | 1 hour |
| | Vault resolution integration | 1.5 hours |
| | Context sources bar | 1 hour |
| | Usage audit logging | 1 hour |
| | Testing | 2 hours |
| | **Phase 4 Total** | **9 hours** |
| **Phase 5** | Error handling | 1 hour |
| | Performance optimization | 2 hours |
| | Accessibility | 1.5 hours |
| | Mobile optimization | 1.5 hours |
| | Documentation | 1 hour |
| | Testing | 1 hour |
| | **Phase 5 Total** | **8 hours** |
| **Total** | | **38 hours** |

---

## Risk Mitigation

### High Risk Items
1. **Reducer refactor touching core execution flow**
   - Mitigation: Implement incrementally, test each transition type
   - Rollback plan: Keep old code commented until verified

2. **Autocomplete on mobile devices**
   - Mitigation: Test early on iOS Safari and Chrome mobile
   - Fallback: Disable autocomplete on mobile if critical issues

3. **Vault resolution latency impact**
   - Mitigation: Cache aggressively, batch Firestore reads
   - Fallback: Limit max vault items to 5 per message

### Medium Risk Items
1. **Token counting accuracy**
   - Mitigation: Use conservative estimates, buffer 10%
   - Fallback: Increase budgets slightly if too restrictive

2. **Semantic stop false positives**
   - Mitigation: Make configurable, allow user override
   - Fallback: Disable by default, enable per-user preference

### Low Risk Items
1. **Context sources bar UI**
   - Mitigation: Purely additive, can iterate
   - Fallback: Hide if rendering issues

2. **Audit logging**
   - Mitigation: Fire-and-forget, non-blocking
   - Fallback: Log locally if Firestore write fails

---

## Success Metrics

- [ ] State machine blocks 100% of invalid transitions
- [ ] Token budget prevents overages 99%+ of time
- [ ] Autocomplete appears within 200ms of "+" character
- [ ] Vault resolution completes within 500ms for typical vault
- [ ] <1% error rate on vault permission checks
- [ ] Mobile autocomplete works on iOS and Android
- [ ] No regression in streaming performance
- [ ] User feedback positive (qualitative)

