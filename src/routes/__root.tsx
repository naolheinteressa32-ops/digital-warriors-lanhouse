import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CyberLAN Manager" },
      { name: "description", content: "Gestão de lan house — CyberLAN Manager" },
      { property: "og:title", content: "CyberLAN Manager" },
      { name: "twitter:title", content: "CyberLAN Manager" },
      { property: "og:description", content: "Gestão de lan house — CyberLAN Manager" },
      { name: "twitter:description", content: "Gestão de lan house — CyberLAN Manager" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5f3f153e-6e23-4d2b-b1e5-cb23da2c36e9/id-preview-8701e11e--478dcaeb-13fe-4a94-a5e2-b90d2cf540a1.lovable.app-1781103220364.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5f3f153e-6e23-4d2b-b1e5-cb23da2c36e9/id-preview-8701e11e--478dcaeb-13fe-4a94-a5e2-b90d2cf540a1.lovable.app-1781103220364.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  errorComponent: ({ error, reset }: { error: Error; reset: () => void }) => (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center max-w-md space-y-3">
        <h1 className="text-3xl font-bold text-destructive">Erro inesperado</h1>
        <p className="text-sm text-muted-foreground break-words">{error?.message ?? "Algo deu errado."}</p>
        <button onClick={reset} className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90">
          Tentar novamente
        </button>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2">Página não encontrada</p>
        <a href="/login" className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">Voltar ao início</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
