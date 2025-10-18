import { useStore } from '@nanostores/react';
import type { LinksFunction } from '@vercel/remix';
import { json } from '@vercel/remix';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useRouteLoaderData, useRouteError } from '@remix-run/react';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from 'chef-agent/utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClientOnly } from 'remix-utils/client-only';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import globalStyles from './styles/index.css?url';
import '@convex-dev/design-system/styles/shared.css';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'allotment/dist/style.css';

import { ErrorDisplay } from './components/ErrorComponent';
import { ConvexLoginModal } from './components/ConvexLoginModal';
import { useStore as useNanostore } from '@nanostores/react';
import { convexLoginModalOpenStore, closeConvexLoginModal, openConvexLoginModal } from './lib/stores/convexAuth';
import { getAccessToken } from './lib/convex-storage';

export async function loader() {
  // These environment variables are available in the client (they aren't secret).
  // eslint-disable-next-line local/no-direct-process-env
  const CONVEX_URL = process.env.VITE_CONVEX_URL || globalThis.process.env.CONVEX_URL!;
  return json({
    ENV: { CONVEX_URL },
  });
}

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('bolt_theme');

    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.querySelector('html')?.setAttribute('class', theme);
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta />
    <Links />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);
  const convexLoginModalOpen = useNanostore(convexLoginModalOpenStore);
  const loaderData = useRouteLoaderData<typeof loader>('root');
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || (loaderData as any)?.ENV.CONVEX_URL;
  if (!CONVEX_URL) {
    throw new Error(`Missing CONVEX_URL: ${CONVEX_URL}`);
  }

  const [convex] = useState(
    () =>
      new ConvexReactClient(
        CONVEX_URL,
        // TODO: There's a potential issue in the convex client where the warning triggers
        // even though in flight requests have completed
        {
          unsavedChangesWarning: false,
        },
      ),
  );

  // TODO does it still make sense?
  useEffect(() => {
    document.querySelector('html')?.setAttribute('class', theme);
  }, [theme]);

  // Check for Convex OAuth token on page load
  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log('No access token found, showing login modal');
      openConvexLoginModal();
    }
  }, []);

  return (
    <>
      <ClientOnly>
        {() => {
          return (
            <DndProvider backend={HTML5Backend}>
              <ConvexProvider client={convex}>
                {children}
                <ConvexLoginModal open={convexLoginModalOpen} onClose={closeConvexLoginModal} />
              </ConvexProvider>
            </DndProvider>
          );
        }}
      </ClientOnly>

      <ScrollRestoration />
      <Scripts />
    </>
  );
}

export const ErrorBoundary = () => {
  const error = useRouteError();
  return <ErrorDisplay error={error} />;
};

export default function App() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
