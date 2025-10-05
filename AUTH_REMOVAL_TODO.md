# Auth Removal - Remaining TypeScript Errors

## Files that need fixing:

### 1. API Key Management

- `convex/apiKeys.ts` - Needs refactor for session-based API keys instead of member-based
- `app/lib/common/apiKey.ts` - References removed convexMembers table
- `app/components/chat/MissingApiKey.tsx` - References convexMembers
- `app/components/chat/ModelSelector.tsx` - References convexMembers

**Solution**: Store API keys in sessions table or create a new sessionApiKeys table

### 2. Proxy Token Management

- `convex/openaiProxy.ts` - References removed memberOpenAITokens table
- `convex/resendProxy.ts` - References removed resendTokens table

**Solution**: Either remove these proxy features or create session-based token tables

### 3. Social Sharing

- `convex/socialShare.ts` - References removed member fields (memberId, cachedProfile, convexProject)

**Solution**: Simplify to not show user info, or make it anonymous

### 4. Dev/Migration utilities

- `convex/dev.ts` - References removed convexMembers table
- `convex/migrations.ts` - References convexMembers

**Solution**: Remove or update for new schema

### 5. Test files

- `convex/test.setup.ts` - Uses old startSession instead of startAnonymousSession
- `convex/share.test.ts` - References projectInitParams

**Solution**: Update tests for anonymous sessions

### 6. Minor fixes

- `app/routes/create.$shareCode.tsx` - Missing useConvex import

## Recommended Approach:

1. **Quick Fix**: Comment out or stub the broken files to get typecheck passing
2. **Proper Fix**: Refactor each system to work with anonymous sessions
3. **Priority**: API keys > Social sharing > Proxy tokens > Dev utils
