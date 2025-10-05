import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chatId';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/components/header/ChatDescription.client';
import { ShareButton } from './ShareButton';
import { useConvexSessionIdOrNullOrLoading } from '~/lib/stores/sessionId';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import { DownloadButton } from './DownloadButton';
import { LoggedOutHeaderButtons } from './LoggedOutHeaderButtons';
import { PromptDebugButton } from './PromptDebugButton';
import { ReferButton } from './ReferButton';
import { useSelectedTeamSlug } from '~/lib/stores/convexTeams';
import { useUsage } from '~/lib/stores/usage';
import { useReferralStats } from '~/lib/hooks/useReferralCode';
import { Menu } from '~/components/sidebar/Menu.client';

export function Header({ hideSidebarIcon = false }: { hideSidebarIcon?: boolean }) {
  const chat = useStore(chatStore);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const sessionId = useConvexSessionIdOrNullOrLoading();
  const isLoggedIn = sessionId !== null;
  const showSidebarIcon = !hideSidebarIcon && isLoggedIn;

  const teamSlug = useSelectedTeamSlug();
  const { isPaidPlan } = useUsage({ teamSlug });
  const referralStats = useReferralStats();

  return (
    <header className={'flex h-[var(--header-height)] items-center overflow-x-auto overflow-y-hidden border-b p-5'}>
      <div className="z-40 flex cursor-pointer items-center gap-4 text-content-primary">
        {showSidebarIcon && (
          <HamburgerMenuIcon
            className="shrink-0"
            data-hamburger-menu
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
          />
        )}
        <a href="/">
          {/* The logo is shifted up slightly, to visually align it with the hamburger icon. */}
          <img src="/chef.svg" alt="Chef logo" width={72} height={42} className="relative -top-1" />
        </a>
      </div>
      <>
        {chat.started && (
          <span className="flex-1 truncate px-4 text-center text-content-primary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
        )}
        <ClientOnly>
          {() => (
            <div className="ml-auto flex items-center gap-2">
              {!isLoggedIn && <LoggedOutHeaderButtons />}

              {chat.started && (
                <>
                  <PromptDebugButton />
                  {isPaidPlan === false && referralStats && referralStats.left > 0 && <ReferButton />}
                  <DownloadButton />
                  <ShareButton />
                  <div className="mr-1">
                    <HeaderActionButtons />
                  </div>
                </>
              )}
            </div>
          )}
        </ClientOnly>
      </>
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
}
