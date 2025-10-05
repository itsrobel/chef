# 🔥 CHEF INDEPENDENCE PROJECT - COMPLETE REMOVAL PLAN

## Executive Summary

This plan removes all Convex-specific integrations (WorkOS auth, Big Brain provisioning, analytics, admin tools) to make Chef a standalone, open project. All sessions will be anonymous/open by default.

---

## 📦 PHASE 1: NPM DEPENDENCIES TO REMOVE

### Package.json Removals:

**IMPORTANT: Use pnpm remove (NOT manual editing)**

```bash
# Analytics packages (Phase 1)
pnpm remove @sentry/remix posthog-js launchdarkly-react-client-sdk @sentry/vite-plugin

# Auth packages (Phase 4 - do later)
pnpm remove @convex-dev/workos @workos-inc/authkit-react
```

**Packages to remove:**

- `@sentry/remix` - Sentry error tracking
- `posthog-js` - PostHog analytics
- `launchdarkly-react-client-sdk` - Feature flags
- `@sentry/vite-plugin` - Sentry build plugin (devDependency)
- `@convex-dev/workos` - Convex WorkOS integration (Phase 4)
- `@workos-inc/authkit-react` - WorkOS auth (Phase 4)

---

## 🔐 PHASE 2: AUTH & SESSION SYSTEM REMOVAL

### Files to Delete Entirely:

- `convex/auth.config.ts` - WorkOS JWT configuration
- `convex/admin.ts` - Convex team admin verification
- `app/lib/hooks/useLaunchDarkly.ts` - Feature flags

### Files to Modify - Remove Auth Logic:

**convex/sessions.ts** - MAJOR REFACTOR NEEDED

- Remove: `isValidSession()`, `isValidSessionForConvexOAuth()`
- Remove: `registerConvexOAuthConnection()`
- Remove: `startSession()` mutation (requires auth)
- Remove: `getOrCreateCurrentMember()`
- Remove: `getCurrentMember()`
- Remove: `updateCachedProfile()` action
- Remove: `saveCachedProfile()`
- Remove: `convexMemberId` query
- **KEEP**: Session verification by sessionId only (no member check)
- **NEW**: Create anonymous sessions without requiring authentication

**convex/schema.ts** - Table Modifications:

- **sessions** table: Remove `memberId` field (or make fully optional)
- **convexMembers** table: DELETE ENTIRE TABLE
- **convexAdmins** table: DELETE ENTIRE TABLE
- **convexProjectCredentials** table: DELETE ENTIRE TABLE
- **chats** table: Remove `convexProject` field
- Remove indexes: `byConvexMemberId`, `byMemberId`

**app/root.tsx** - Root Component Cleanup:

- Remove: `import { AuthKitProvider, useAuth } from '@workos-inc/authkit-react'`
- Remove: `import { ConvexProviderWithAuthKit } from '@convex-dev/workos'`
- Remove: `import posthog from 'posthog-js'`
- Remove: PostHog initialization `useEffect`
- Replace `ConvexProviderWithAuthKit` with regular `ConvexProvider`
- Remove `AuthKitProvider` wrapper
- Remove WORKOS\_\* environment variables

**app/components/** - Auth Hook Removals:
Files using `useAuth()`:

- `app/components/settings/ProfileCard.tsx`
- `app/components/chat/MessageInput.tsx`
- `app/components/chat/ChefAuthWrapper.tsx`
- `app/components/UserProvider.tsx`
- `app/components/header/Header.tsx`
- `app/lib/stores/startup/useInitializeChat.ts`
- `app/routes/create.$shareCode.tsx`

**Action**: Remove auth checks, remove `workosAccessToken` parameters

---

## 🚀 PHASE 3: BIG BRAIN / DEPLOYMENT SYSTEM REMOVAL

### Files to Delete:

- `convex/convexProjects.ts` - Entire provisioning system
- `convex/deploy.ts` - Deploy tracking
- `app/components/convex/ConvexConnectButton.tsx` - OAuth connection UI

### Files to Modify:

**convex/messages.ts**:

- Remove `projectInitParams` from `initializeChat` mutation
- Remove all `workosAccessToken` parameters
- Remove calls to `startProvisionConvexProjectHelper`

**convex/share.ts**:

- Remove `projectInitParams` from share creation
- Remove `workosAccessToken` parameters

**chef-agent/** system prompts:

- Update to remove references to automatic Convex project provisioning
- Users will need to manually set up Convex projects

### Environment Variables to Remove:

```bash
BIG_BRAIN_HOST
CONVEX_OAUTH_CLIENT_ID
CONVEX_OAUTH_CLIENT_SECRET
WORKOS_CLIENT_ID
VITE_WORKOS_CLIENT_ID
VITE_WORKOS_REDIRECT_URI
VITE_WORKOS_API_HOSTNAME
```

---

## 📊 PHASE 4: ANALYTICS & TELEMETRY REMOVAL

### Files to Modify:

**app/entry.client.tsx**:

- Remove all Sentry imports and initialization
- Remove Sentry DSN and configuration

**app/entry.server.tsx**:

- Remove Sentry imports
- Remove `handleError()` function with Sentry
- Remove Sentry initialization

**app/root.tsx**:

- Remove PostHog initialization (already covered in Phase 2)
- Remove `captureRemixErrorBoundaryError` import from Sentry

**app/components/** - Remove analytics tracking:
All files importing posthog/launchdarkly:

- `app/components/chat/AssistantMessage.tsx`
- `app/components/chat/BaseChat.client.tsx`
- `app/components/chat/Chat.tsx`
- `app/components/chat/MessageInput.tsx`
- `app/components/chat/MissingApiKey.tsx`
- `app/components/chat/ModelSelector.tsx`
- `app/components/chat/StreamingIndicator.tsx`
- `app/components/UserProvider.tsx`

**Action**: Remove posthog.capture() calls, remove useLaunchDarkly() usage

### Environment Variables to Remove:

```bash
VITE_POSTHOG_KEY
VITE_POSTHOG_HOST
```

---

## 🛠️ PHASE 5: ADMIN UTILITIES REMOVAL

### Files to Delete:

- `app/routes/admin.usage-breakdown.tsx`
- `app/routes/admin.prompt-debug.tsx`
- `convex/debugPrompt.ts` (if admin-only)

### Convex Schema Updates:

- Delete `convexAdmins` table
- Remove admin-related queries/mutations

---

## 🔄 PHASE 6: REPLACEMENT IMPLEMENTATIONS

### New Anonymous Session System:

**convex/sessions.ts** - Simplified Version:

```typescript
// Generate sessions without authentication
export const startAnonymousSession = mutation({
  args: {},
  returns: v.id('sessions'),
  handler: async (ctx) => {
    return ctx.db.insert('sessions', {
      createdAt: Date.now(),
      // No memberId needed
    });
  },
});

// Verify session by ID only (sessions are unguessable)
export async function isValidSession(ctx: QueryCtx, args: { sessionId: Id<'sessions'> }) {
  const session = await ctx.db.get(args.sessionId);
  return session !== null;
}
```

### Simplified Chat Initialization:

**convex/messages.ts**:

```typescript
export const initializeChat = mutation({
  args: {
    sessionId: v.id('sessions'),
    id: v.string(),
  },
  // Remove projectInitParams entirely
  // Chats are just created, no provisioning
});
```

---

## 📝 PHASE 7: CONFIGURATION & ENVIRONMENT

### .env.local Template (NEW):

```bash
# Convex
VITE_CONVEX_URL=your_convex_url_here

# AI Providers (optional - can add via UI)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
XAI_API_KEY=
```

### Update Documentation:

- README.md: Remove OAuth setup steps
- README.md: Simplify local development (no WorkOS needed)
- CONTRIBUTING.md: Update for anonymous usage
- Create DEPLOYMENT.md with manual Convex project setup

---

## ✅ TESTING CHECKLIST

After removals, verify:

1. ✅ Can start a new anonymous chat without login
2. ✅ Sessions persist in localStorage
3. ✅ No auth errors in console
4. ✅ AI responses work without WorkOS
5. ✅ File editing works
6. ✅ WebContainer boots correctly
7. ✅ No Sentry/PostHog network requests
8. ✅ No broken admin route links
9. ✅ Builds successfully (`pnpm run build`)
10. ✅ Type checks pass (`pnpm typecheck`)
11. ✅ Tests pass (`pnpm test`)

---

## 🎯 IMPLEMENTATION ORDER

**Recommended sequence to minimize breakage:**

1. **Analytics First** (Lowest risk)

   - Remove Sentry, PostHog, LaunchDarkly
   - These are mostly observability, won't break functionality

2. **Admin Tools** (Low risk)

   - Delete admin routes and utilities
   - Most users never accessed these

3. **Big Brain Provisioning** (Medium risk)

   - Remove auto-provisioning
   - Keep manual Convex project setup in docs

4. **Auth System** (Highest risk)
   - Last step, most invasive
   - Refactor to anonymous sessions
   - Test thoroughly at each sub-step

---

## 📊 IMPACT ASSESSMENT

**Lines of Code to Remove/Modify**: ~2,000-3,000 lines
**Files Affected**: ~50+ files
**Time Estimate**: 2-3 days of focused work
**Risk Level**: Medium-High (auth changes are delicate)

**Benefits**:

- ✅ Fully independent, no Convex corporate dependencies
- ✅ Easier to deploy anywhere
- ✅ Simpler codebase
- ✅ No auth/port restrictions
- ✅ Better for open source

**Trade-offs**:

- ❌ No automatic Convex project provisioning
- ❌ No user profiles/authentication (initially)
- ❌ No usage analytics
- ❌ Chats are fully public (anyone with sessionId can access)

---

## 🚨 CRITICAL NOTES

1. **Session Security**: Without auth, sessions rely on unguessable IDs. This is OK for local dev but you'll want to add auth later for production.

2. **Data Migration**: Existing chats with `memberId` will need migration or ignore old member references.

3. **Convex Projects**: Users will manually create Convex projects and add deploy keys. Document this clearly.

4. **API Keys**: Without auth, API keys in settings are per-session only (stored in Convex against session, not user).

---

## 🔧 DETAILED FILE-BY-FILE BREAKDOWN

### Phase 1: Analytics Removal

#### Files to Modify:

1. `package.json` - Remove dependencies
2. `app/entry.client.tsx` - Remove Sentry init
3. `app/entry.server.tsx` - Remove Sentry init + handleError
4. `app/root.tsx` - Remove PostHog init
5. `app/components/chat/AssistantMessage.tsx` - Remove posthog tracking
6. `app/components/chat/BaseChat.client.tsx` - Remove launchdarkly
7. `app/components/chat/Chat.tsx` - Remove posthog tracking
8. `app/components/chat/MessageInput.tsx` - Remove posthog tracking
9. `app/components/chat/MissingApiKey.tsx` - Remove launchdarkly
10. `app/components/chat/ModelSelector.tsx` - Remove posthog tracking
11. `app/components/chat/StreamingIndicator.tsx` - Remove launchdarkly
12. `app/components/UserProvider.tsx` - Remove posthog tracking

#### Files to Delete:

1. `app/lib/hooks/useLaunchDarkly.ts`

---

### Phase 2: Admin Tools Removal

#### Files to Delete:

1. `app/routes/admin.usage-breakdown.tsx`
2. `app/routes/admin.prompt-debug.tsx`
3. `convex/admin.ts`

#### Schema Changes:

1. `convex/schema.ts` - Remove `convexAdmins` table

---

### Phase 3: Big Brain Provisioning Removal

#### Files to Delete:

1. `convex/convexProjects.ts`
2. `convex/deploy.ts`
3. `app/components/convex/ConvexConnectButton.tsx` (if exists)

#### Files to Modify:

1. `convex/messages.ts` - Remove projectInitParams, workosAccessToken
2. `convex/share.ts` - Remove projectInitParams
3. `convex/schema.ts` - Remove convexProjectCredentials table, remove convexProject field from chats

---

### Phase 4: Auth System Removal

#### Files to Delete:

1. `convex/auth.config.ts`

#### Files to Heavily Modify:

1. `convex/sessions.ts` - Complete refactor to anonymous
2. `convex/schema.ts` - Remove convexMembers table, remove memberId from sessions
3. `app/root.tsx` - Remove AuthKit, WorkOS
4. `app/components/settings/ProfileCard.tsx` - Remove useAuth
5. `app/components/chat/MessageInput.tsx` - Remove useAuth
6. `app/components/chat/ChefAuthWrapper.tsx` - Remove useAuth or delete file
7. `app/components/UserProvider.tsx` - Remove useAuth
8. `app/components/header/Header.tsx` - Remove useAuth
9. `app/lib/stores/startup/useInitializeChat.ts` - Remove workosAccessToken
10. `app/routes/create.$shareCode.tsx` - Remove workosAccessToken

#### Package.json:

1. Remove `@convex-dev/workos`
2. Remove `@workos-inc/authkit-react`

---

## 📋 AGENT DELEGATION STRATEGY

### Agent 1: Analytics Cleanup

**Task**: Remove all Sentry, PostHog, LaunchDarkly code
**Files**: ~12 files in `app/`
**Risk**: Low
**Estimate**: 30 minutes

### Agent 2: Admin Tools Cleanup

**Task**: Delete admin routes and convex functions
**Files**: 3 routes + 1 convex file + schema
**Risk**: Low
**Estimate**: 15 minutes

### Agent 3: Big Brain Provisioning Cleanup

**Task**: Remove auto-provisioning system
**Files**: 3 main files + modifications to messages/share
**Risk**: Medium
**Estimate**: 1 hour

### Agent 4: Auth System Refactor (Part 1 - Convex)

**Task**: Refactor convex/sessions.ts and schema
**Files**: sessions.ts, schema.ts
**Risk**: High
**Estimate**: 2 hours

### Agent 5: Auth System Refactor (Part 2 - Frontend)

**Task**: Remove WorkOS from app components
**Files**: root.tsx + 8 component files
**Risk**: High
**Estimate**: 2 hours

### Agent 6: Final Cleanup & Testing

**Task**: Remove env vars, update docs, run tests
**Files**: .env files, README.md, run test suite
**Risk**: Low
**Estimate**: 1 hour

---

## 🚀 EXECUTION PLAN

### Step 1: Create Feature Branch

```bash
git checkout -b feature/remove-convex-integrations
```

### Step 2: Run Agents in Sequence

Execute each agent task in order (1-6), committing after each phase

### Step 3: Validation After Each Agent

- Run `pnpm typecheck` after each agent
- Fix any TypeScript errors before moving to next agent
- Commit with descriptive message

### Step 4: Final Integration Test

- Run full test suite
- Manual smoke test of core flows
- Fix any integration issues

### Step 5: Documentation Update

- Update README.md
- Create DEPLOYMENT.md
- Update CONTRIBUTING.md

---

## 🎬 READY TO START

When ready to execute, we can:

1. Create the feature branch
2. Launch Agent 1 (Analytics) for lowest-risk first win
3. Progressively work through each phase
4. Test and validate after each agent completes

**Total Estimated Time**: 6-8 hours of agent work + testing
**Recommended Approach**: Do 1-2 phases per day to allow for testing between changes
