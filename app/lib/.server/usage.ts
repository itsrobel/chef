import type { LanguageModelUsage, Message, ProviderMetadata } from 'ai';
import { createScopedLogger } from 'chef-agent/utils/logger';
import type { ProviderType, UsageAnnotation } from '~/lib/common/annotations';
import { modelForProvider, type ModelProvider } from './llm/provider';

const logger = createScopedLogger('usage');

// Stubbed for anonymous mode - no Big Brain API calls
export async function checkTokenUsage(
  _provisionHost: string,
  _token: string,
  _teamSlug: string,
  _deploymentName: string | undefined,
) {
  logger.info('Token usage checking disabled in anonymous mode');
  return {
    status: 'success' as const,
    centi_tokensUsed: 0,
    centi_tokensQuota: Infinity,
    isTeamDisabled: false,
    isPaidPlan: false,
  };
}

export function encodeUsageAnnotation(
  toolCallId: { kind: 'tool-call'; toolCallId: string | undefined } | { kind: 'final' },
  usage: LanguageModelUsage,
  providerMetadata: ProviderMetadata | undefined,
) {
  const payload: UsageAnnotation = {
    toolCallId: toolCallId.kind === 'tool-call' ? toolCallId.toolCallId : 'final',
    completionTokens: usage.completionTokens,
    promptTokens: usage.promptTokens,
    totalTokens: usage.totalTokens,
    providerMetadata,
  };
  const serialized = JSON.stringify(payload);
  return { payload: serialized };
}

export function encodeModelAnnotation(
  call: { kind: 'tool-call'; toolCallId: string | null } | { kind: 'final' },
  providerMetadata: ProviderMetadata | undefined,
  modelChoice: string | undefined,
) {
  let provider: ProviderType | null = null;
  let model: string | null = null;
  if (providerMetadata?.anthropic) {
    provider = 'Anthropic';
    model = modelForProvider('Anthropic', modelChoice);
  } else if (providerMetadata?.openai) {
    provider = 'OpenAI';
    model = modelForProvider('OpenAI', modelChoice);
  } else if (providerMetadata?.xai) {
    provider = 'XAI';
    model = modelForProvider('XAI', modelChoice);
  } else if (providerMetadata?.google) {
    provider = 'Google';
    model = modelForProvider('Google', modelChoice);
  } else if (providerMetadata?.bedrock) {
    provider = 'Bedrock';
    model = modelForProvider('Bedrock', modelChoice);
  }
  return { toolCallId: call.kind === 'tool-call' ? call.toolCallId : 'final', provider, model };
}

// Stubbed for anonymous mode - no Big Brain API calls
export async function recordUsage(
  _provisionHost: string,
  _token: string,
  modelProvider: ModelProvider,
  _teamSlug: string,
  _deploymentName: string | undefined,
  lastMessage: Message | undefined,
  finalGeneration: { usage: LanguageModelUsage; providerMetadata?: ProviderMetadata },
) {
  logger.info('Usage recording disabled in anonymous mode', {
    modelProvider,
    _deploymentName,
    usage: finalGeneration.usage,
  });
}
