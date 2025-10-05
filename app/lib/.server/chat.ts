import { type ActionFunctionArgs } from '@vercel/remix';
import { createScopedLogger } from 'chef-agent/utils/logger';
import { convexAgent } from '~/lib/.server/llm/convex-agent';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import type { LanguageModelUsage, Message, ProviderMetadata } from 'ai';
import type { ModelProvider } from '~/lib/.server/llm/provider';
import { getEnv } from '~/lib/.server/env';
import type { PromptCharacterCounts } from 'chef-agent/ChatContextManager';

type Messages = Message[];

const logger = createScopedLogger('api.chat');

export type Tracer = ReturnType<typeof WebTracerProvider.prototype.getTracer>;

export async function chatAction({ request }: ActionFunctionArgs) {
  const AXIOM_API_TOKEN = getEnv('AXIOM_API_TOKEN');
  const AXIOM_API_URL = getEnv('AXIOM_API_URL');
  const AXIOM_DATASET_NAME = getEnv('AXIOM_DATASET_NAME');

  let tracer: Tracer | null = null;
  if (AXIOM_API_TOKEN && AXIOM_API_URL && AXIOM_DATASET_NAME) {
    const exporter = new OTLPTraceExporter({
      url: AXIOM_API_URL,
      headers: {
        Authorization: `Bearer ${AXIOM_API_TOKEN}`,
        'X-Axiom-Dataset': AXIOM_DATASET_NAME,
      },
    });
    const provider = new WebTracerProvider({
      spanProcessors: [
        new BatchSpanProcessor(exporter, {
          maxQueueSize: 100,
          maxExportBatchSize: 10,
          scheduledDelayMillis: 500,
          exportTimeoutMillis: 30000,
        }),
      ],
    });
    provider.register();
    tracer = provider.getTracer('ai');
    logger.info('✅ Axiom instrumentation registered!');
  } else {
    logger.warn('⚠️ AXIOM_API_TOKEN, AXIOM_API_URL, and AXIOM_DATASET_NAME not set, skipping Axiom instrumentation.');
  }

  const body = (await request.json()) as {
    messages: Messages;
    firstUserMessage: boolean;
    chatInitialId: string;
    _deploymentName: string | undefined;
    modelProvider: ModelProvider;
    modelChoice: string | undefined;
    shouldDisableTools: boolean;
    recordRawPromptsForDebugging?: boolean;
    collapsedMessages: boolean;
    promptCharacterCounts?: PromptCharacterCounts;
    featureFlags: {
      enableResend?: boolean;
    };
  };
  const { messages, firstUserMessage, chatInitialId, _deploymentName, recordRawPromptsForDebugging } = body;

  if (getEnv('DISABLE_BEDROCK') === '1' && body.modelProvider === 'Bedrock') {
    body.modelProvider = 'Anthropic';
  }

  // Anonymous mode: Always use server-side API keys from environment variables
  const userApiKey = undefined;

  logger.info(`Using model provider: ${body.modelProvider} with server-side API keys`);

  // No usage recording in anonymous mode
  const recordUsageCb = async (
    lastMessage: Message | undefined,
    finalGeneration: { usage: LanguageModelUsage; providerMetadata?: ProviderMetadata },
  ) => {
    logger.debug('Usage recording disabled in anonymous mode', {
      usage: finalGeneration.usage,
      provider: body.modelProvider,
    });
  };

  try {
    const totalMessageContent = messages.reduce((acc, message) => acc + message.content, '');
    logger.debug(`Total message length: ${totalMessageContent.split(' ').length}, words`);
    const dataStream = await convexAgent({
      chatInitialId,
      firstUserMessage,
      messages,
      tracer,
      modelProvider: body.modelProvider,
      modelChoice: body.modelChoice,
      userApiKey,
      shouldDisableTools: body.shouldDisableTools,
      recordUsageCb,
      recordRawPromptsForDebugging: !!recordRawPromptsForDebugging,
      collapsedMessages: body.collapsedMessages,
      promptCharacterCounts: body.promptCharacterCounts,
      featureFlags: {
        enableResend: body.featureFlags.enableResend ?? false,
      },
    });

    return new Response(dataStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        'Text-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    logger.error(error);

    if (error.message?.includes('API key')) {
      throw new Response('Invalid or missing API key', {
        status: 401,
        statusText: 'Unauthorized',
      });
    }

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
