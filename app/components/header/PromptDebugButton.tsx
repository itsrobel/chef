import { TextAlignLeftIcon } from '@radix-ui/react-icons';
import { Button } from '@ui/Button';
import { initialIdStore } from '~/lib/stores/chatId';
import { lazy, Suspense, useState } from 'react';
import { useStore } from '@nanostores/react';

// Import eagerly in dev to avoid a reload, lazily in prod for bundle size.
const DebugAllPromptsForChat = import.meta.env.DEV
  ? (await import('../../components/DebugPromptView')).default
  : lazy(() => import('../../components/DebugPromptView'));

export function PromptDebugButton() {
  const [showDebugView, setShowDebugView] = useState(false);
  const chatInitialId = useStore(initialIdStore);

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setShowDebugView(true)} variant="neutral" size="xs">
        <TextAlignLeftIcon />
      </Button>
      {showDebugView && chatInitialId && (
        <Suspense fallback={<div>Loading debug view...</div>}>
          <DebugAllPromptsForChat chatInitialId={chatInitialId} onClose={() => setShowDebugView(false)} />
        </Suspense>
      )}
    </>
  );
}
