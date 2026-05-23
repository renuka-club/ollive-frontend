import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/context/AppContext";
import { Layout } from "@/components/Layout";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-semibold text-[#e2e8f0] tracking-tight">404</h1>
        <p className="mt-3 text-sm text-[#6b7280]">page not found</p>
        <Link
          to="/chat"
          className="mt-6 inline-flex items-center rounded border border-[#1f1f1f] bg-[#111111] px-4 py-2 text-sm text-[#e2e8f0] hover:bg-[#1f1f1f]"
        >
          ← back to chat
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="max-w-md text-center">
        <h1 className="text-lg font-semibold text-[#e2e8f0]">Something went wrong</h1>
        <p className="mt-2 text-xs text-[#6b7280]">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center rounded border border-[#1f1f1f] bg-[#111111] px-4 py-2 text-sm text-[#e2e8f0] hover:bg-[#1f1f1f]"
        >
          retry
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ollive — LLM Inference Logger" },
      { name: "description", content: "Inspect conversations, latency, and token usage across your LLM inferences." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" }
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Layout>
          <Outlet />
        </Layout>
        <Toaster position="bottom-right" theme="dark" duration={4000} />
      </AppProvider>
    </QueryClientProvider>
  );
}
