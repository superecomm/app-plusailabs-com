<!-- cf2b7a61-03a7-4c4c-a6b9-355db7596460 9a27f7e4-a59f-4523-8647-d1558e4c30cb -->
# +Vault Knowledge Base Plan (updated)

## Phase 1: Vault Lite (MVP)

- **Data model (Firestore):** `vaultCollections` (user-scoped buckets) with fields: `title`, `tags`, `allowInChat` (default per template), `scope` (private|agent-usable|shareable), `sensitivity` (general|personal|financial|legal|medical), `retentionTTL`, `version`, `pinned` flag. `vaultItems` with `collectionId`, `title`, `type` (note|file|link), `tags`, `content` (for notes), `fileRef`, `scope`, `allowInChat`, `sensitivity`, `pinned`, `retentionTTL`, `version`, `updatedAt` (server), `createdAt` (server), `lastUsedAt`.
- **Permissions:** Enforce per-user ownership; `scope` controls sharing surface (Phase 1: private/agent-usable only). `allowInChat` gate at collection + item level (collection default + item override). Default templates: Family=ON, Projects=ON, Finance/Receipts=OFF.
- **Upload defaults:** Firebase Storage path `vault/{uid}/{collectionId}/{itemId}`; allowlist MIME (text/markdown/pdf/png/jpg); max file size per tier (e.g., free 2MB, paid 10MB, super 50MB); block executables; PDF text extraction deferred to Phase 2.
- **Retrieval policy v0:**
- Always include pinned items (max 3).
- Add most recent items (max 2) if allowInChat.
- Query-matched items by keyword (title/tags/content) max 3.
- Hard cap injected context chars: Free ≤1,500; Paid ≤6,000; Super ≤12,000. Global cap 6k for MVP if tiering isn’t wired yet.
- **Audit trail:** `users/{uid}/vaultUsageEvents/{eventId}` with `conversationId`, `messageId`, `vaultItemIdsUsed[]`, `timestamp`, `model/provider`, `charCount`. Surface thin UI line: “Used +Vault: Collection/Item” with expandable list.
- **Product taxonomy:** +Memory (small facts, frequent) vs +Vault (docs/notes/files, selective). Only Vault participates in this feature; keep memory separate to avoid surprise recalls.
- **APIs:** Next.js API routes `app/api/vault/*` for collections/items CRUD, search (keyword), list pinned/recent, usage logging. Guard allowInChat, scope, user checks, version checks (reject stale updates).
- **UI:** Add sidebar entry “+Vault” above conversations. Vault screen: left rail collections, top search, main grid/list with pinned/recent filters, type/tag chips, highlights for matches. Item modal (create/edit), Use-in-Chat toggle, Sensitivity badge. Minimal upload UI (note/file placeholder).
- **Chat integration:** Before LLM call, fetch vault context via `vaultPolicy` rules (pinned/recent/matched within char budget), inject into prompt as “User Vault Context.” Show `ContextSourcesBar` under assistant message with cited items. Log `vaultUsageEvent` per response.
- **Concurrency/versioning:** Include `version` increment; server enforces updatedAt + version to prevent stale writes; optimistic UI but server is source of truth.
- **Acceptance (Phase 1):**
- Create collections and notes; per-collection/item Use-in-Chat toggle respected.
- Retrieval honors policy + char budget; sources surfaced in UI.
- Vault usage event logged per assistant response.
- No cross-user leakage; allowInChat + scope enforced.

## Phase 2: Vault RAG (upgrade path)

- Add ingestion pipeline: chunk text/PDF; store chunks metadata; generate embeddings via provider (OpenAI/Gemini); vector index (Pinecone/Supabase/etc.).
- Retrieval: hybrid keyword + vector; citations included in injected context; respect same policy/budgets. Add file text extraction (PDF) and basic virus scan hook.
- UI: “Add to Vault” from chat message; show retrieved sources with citations; richer filters.

## Files / Components

- Backend: `lib/vaultService.ts` (Firestore CRUD), `lib/vaultPolicy.ts` (retrieval/budget rules), `lib/vaultUsage.ts` (audit logging), `lib/promptComposer.ts` (context injection), `app/api/vault/*` routes.
- Frontend: `components/vault/Sidebar`, `VaultList/Grid`, `VaultItemModal`, `UseInChatToggle.tsx`, `SensitivityBadge.tsx`, `ContextSourcesBar.tsx`, sidebar entry in `components/chat/ChatInterface.tsx`.

## Risks / Decisions

- Need final tier limits for size/context; choose embedding/vector backend before Phase 2.
- File scanning to add later; start with strict MIME allowlist.
- Latency: keep retrieval bounded; consider caching recent/pinned per conversation.

### To-dos

- [ ] Define Firestore schema/types for vault collections/items
- [ ] Add Vault CRUD/search API routes
- [ ] Add +Vault sidebar entry and Drive-lite UI
- [ ] Inject vault context into model calls
- [ ] Plan embeddings/vector index and semantic retrieval