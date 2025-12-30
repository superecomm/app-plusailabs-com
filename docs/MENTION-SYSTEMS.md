# Mention Systems Documentation

**Last Updated:** December 15, 2025  
**Status:** ✅ Implemented

---

## Overview

The platform supports two distinct mention systems, each serving a different strategic purpose:

### At Mention (@) - Social Mention System
**Purpose:** Reference people and facilitate messaging  
**Trigger:** `@` symbol  
**Context:** Social interactions, direct messaging, comments

### Plus Mention (+) - Prompt-Native Invocation Operator
**Purpose:** Invoke intelligence objects (vault items, future: users, products, places, actions)  
**Trigger:** `+` symbol  
**Context:** AI conversations, prompt construction, context injection

---

## Strategic Vision

```
@ mentions a person
+ invokes intelligence
```

**At mention (@)** = Identity linking for social interactions  
**Plus mention (+)** = Context binding for AI intelligence

---

## At Mention (@) Implementation

### Files Created
- `hooks/useAtMentionAutocomplete.ts` - Hook for @ trigger detection and user search
- `components/messages/AtMentionAutocomplete.tsx` - Dropdown UI for user selection

### Features
- Triggers when typing `@` in message composer
- Searches users via `/api/profile/search`
- Displays: avatar, displayName, @handle
- Keyboard navigation (arrows, Enter, Escape)
- Dark mode support
- Inserts `@handle` with space after selection

### Usage
```typescript
import { useAtMentionAutocomplete } from "@/hooks/useAtMentionAutocomplete";
import { AtMentionAutocomplete } from "@/components/messages/AtMentionAutocomplete";

const atMention = useAtMentionAutocomplete(textareaRef);

// In render:
{atMention.isOpen && (
  <AtMentionAutocomplete
    users={atMention.users}
    selectedIndex={atMention.selectedIndex}
    position={atMention.position}
    onSelect={atMention.onSelect}
    onClose={atMention.onClose}
  />
)}
```

### Integrated In
- `components/messages/MessageComposer.tsx` - Direct messaging

---

## Plus Mention (+) Implementation

### Files Renamed
- `hooks/useVaultAutocomplete.ts` → `hooks/usePlusMentionAutocomplete.ts`
- `components/vault/VaultAutocomplete.tsx` → `components/vault/PlusMentionAutocomplete.tsx`

### Current State (v1)
**Resolves:** Private vault items (files, folders, bio)  
**Future:** Users, products, places, actions

### Features
- Triggers when typing `+` in chat input
- Searches vault items (mock data, TODO: connect to API)
- Displays: icon, name, type
- Keyboard navigation (arrows, Enter, Escape)
- Dark mode support
- Inserts `+token` with space after selection

### Usage
```typescript
import { usePlusMentionAutocomplete } from "@/hooks/usePlusMentionAutocomplete";
import { PlusMentionAutocomplete } from "@/components/vault/PlusMentionAutocomplete";

const plusMention = usePlusMentionAutocomplete(textareaRef, (token, item) => {
  // Handle token insertion
});

// In render:
{plusMention.isOpen && (
  <PlusMentionAutocomplete
    items={plusMention.items}
    selectedIndex={plusMention.selectedIndex}
    position={plusMention.position}
    onSelect={plusMention.onSelect}
    onClose={plusMention.onClose}
  />
)}
```

### Integrated In
- `components/viim/NeuralBox.tsx` - Chat interface

---

## How Each System Works

### At Mention (@)

**Trigger Pattern:** `/(?:^|\s)@([A-Za-z0-9_-]*)$/`

**Flow:**
1. User types `@` in message composer
2. Hook detects trigger and extracts query
3. Fetches matching users from `/api/profile/search?q=<query>`
4. Displays dropdown with user profiles
5. User selects with keyboard or mouse
6. Inserts `@handle` into text
7. Autocomplete closes

**Data Structure:**
```typescript
interface UserProfile {
  userId: string;
  displayName: string;
  handle: string;
  photoURL?: string;
  bio?: string;
  isYou?: boolean;
}
```

### Plus Mention (+)

**Trigger Pattern:** `/(?:^|\s)\+([A-Za-z0-9_-]*)$/`

**Flow:**
1. User types `+` in chat input
2. Hook detects trigger and extracts query
3. Fetches matching vault items (currently mock)
4. Displays dropdown with vault items
5. User selects with keyboard or mouse
6. Inserts `+token` into text
7. Adds vault reference to conversation context
8. Autocomplete closes

**Data Structure:**
```typescript
interface VaultItem {
  id: string;
  type: "bio" | "folder" | "file";
  name: string;
  content?: string;
  folderId?: string | null;
  allowInChat?: boolean;
}
```

---

## Future Expansion Path

### Phase 1: +users (NOT THIS SESSION)
- Add user profiles to plus mention
- Enable: `+terry` → reference user context
- Read-only context injection
- No permissions complexity yet

### Phase 2: +products (AFTER REVENUE LIVE)
- Add product catalog to plus mention
- Enable: `+airforce1` → reference product
- Commerce hooks and transaction integration
- Ranking signals (vibes, reviews)

### Phase 3: +actions (LATER)
- Add action verbs to plus mention
- Enable: `+summarize`, `+compare`, `+plan`
- Requires action registry and safety checks
- More UX complexity

---

## Architectural Philosophy

> "At mention (@) is a social mention system for people and messaging. Plus mention (+) is a prompt-native invocation operator for intelligence. Today, + only resolves private vault items. The architecture must support future expansion to users, products, places, and actions without changing the input model."

### Key Principles

1. **Separate Concerns**
   - `@` for social identity
   - `+` for intelligence invocation

2. **Coexistence**
   - Both systems work in parallel
   - No conflicts or interference
   - Users can use both in same input

3. **Future-Ready**
   - Designed for expansion
   - No breaking changes to input model
   - Incremental feature additions

4. **User Mental Model**
   - `@` = familiar (Twitter, Instagram, Slack)
   - `+` = new but intuitive
   - Visual distinction clear

---

## Comparison with Other Platforms

| Feature | @ Mentions (Social) | Plus Mention (+AI) |
|---------|---------------------|-------------------|
| References people | ✅ | Future ✅ |
| References brands/products | ❌ | Future ✅ |
| Triggers notifications | ✅ | Optional |
| Adds intelligence context | ❌ | ✅ |
| Executes actions | ❌ | Future ✅ |
| Works across surfaces | Limited | ✅ |
| Affects discovery | ❌ | Future ✅ |
| Tied to commerce | ❌ | Future ✅ |
| Intent-aware | ❌ | ✅ |

### Similar Systems

**Slack / Commands:** `/` executes actions (admin-defined, not conversational)  
**Notion / Commands:** `/` invokes actions (document-only, no identity)  
**Google @ Chips:** `@file`, `@person` (smart embeds, no execution)  
**ChatGPT Tools:** Implicit, not user-invoked (no shared syntax)

**Plus mention (+) is unique:** Combines identity, commands, discovery, context, execution, and language into one symbol.

---

## Developer Notes

### Backwards Compatibility

Old files maintained with deprecation warnings:
- `hooks/useVaultAutocomplete.ts` - Deprecated, use `usePlusMentionAutocomplete`
- `components/vault/VaultAutocomplete.tsx` - Deprecated, use `PlusMentionAutocomplete`

These will be removed in a future version.

### Testing Checklist

**At mention (@):**
- [ ] Type `@` in message composer → dropdown appears
- [ ] Type `@john` → filters users matching "john"
- [ ] Arrow up/down → navigates suggestions
- [ ] Enter → inserts `@handle` with space
- [ ] Escape → closes dropdown
- [ ] Click outside → closes dropdown
- [ ] Dark mode styling correct
- [ ] Shows current user for self-mentions

**Plus mention (+):**
- [ ] Type `+` in chat → dropdown appears
- [ ] Type `+family` → filters vault items
- [ ] Arrow navigation works
- [ ] Enter inserts `+token`
- [ ] Vault reference added to context
- [ ] Dark mode styling correct
- [ ] Header displays "Plus mention (+)"

### TODOs

1. Connect plus mention to actual vault API (currently uses mock data)
2. Consider adding at mention to new message draft textarea
3. Add analytics for mention usage
4. Plan Phase 1: +users expansion
5. Document mention syntax in user onboarding

---

## One-Sentence Explanation

**"@ mentions people. + mentions intelligence — people, products, places, and actions — and turns them into outcomes."**

---

**This is a new interaction primitive. Not a UX shortcut. A platform-level innovation.**

