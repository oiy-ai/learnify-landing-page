import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { ClerkProvider, useAuth } from "@clerk/react-router";
// import { rootAuthLoader } from "@clerk/react-router/ssr.server"; // Not needed for SPA mode
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { Route } from "./+types/root";
import "./app.css";
import { Analytics } from "@vercel/analytics/react";
import { UserSyncProvider } from "./components/UserSyncProvider";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "sonner";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// export async function loader(args: Route.LoaderArgs) {
//   return rootAuthLoader(args);
// } // Not needed for SPA mode
export const links: Route.LinksFunction = () => [
  // DNS prefetch for external services
  { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
  { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
  { rel: "dns-prefetch", href: "https://api.convex.dev" },
  { rel: "dns-prefetch", href: "https://clerk.dev" },
  
  // Preconnect to font services
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  
  // Font with display=swap for performance
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  
  // Preload critical assets
  {
    rel: "preload",
    href: "/img/rsk.png",
    as: "image",
    type: "image/png",
  },
  {
    rel: "preload",
    href: "/img/favicon.png", 
    as: "image",
    type: "image/png",
  },
  
  // Icon
  {
    rel: "icon",
    type: "image/png",
    href: "/img/favicon.png",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Analytics />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      signUpFallbackRedirectUrl="/"
      signInFallbackRedirectUrl="/"
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <UserSyncProvider>
          <ThemeProvider>
            <div className="max-w-7xl mx-auto border-x relative">
              <Outlet />
            </div>
            <Toaster />
          </ThemeProvider>
        </UserSyncProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let showTechnicalDetails = false;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message = "Page Not Found";
      details = "The requested page could not be found.";
    } else if (error.status === 403) {
      message = "Access Denied";
      details = "You don't have permission to access this resource.";
    } else {
      message = "Something went wrong";
      details = "We're sorry, but something unexpected happened. Please try again.";
    }
  } else if (error && error instanceof Error) {
    // Check if it's a permission/access error
    const isPermissionError = error.message?.includes('Access denied') ||
                             error.message?.includes('Admin privileges required') ||
                             error.message?.includes('CONVEX') && error.message?.includes('Access denied');
    
    if (isPermissionError) {
      message = "Access Denied";
      details = "You don't have permission to access this resource. Please contact your administrator if you believe this is an error.";
    } else {
      message = "Something went wrong";
      details = "We're sorry, but something unexpected happened. Please try again.";
      // Only show technical details in development
      showTechnicalDetails = import.meta.env.DEV;
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-destructive/15 mb-6">
          <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4">{message}</h1>
        <p className="text-muted-foreground mb-6">{details}</p>
        
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            ← Go Back
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-2 text-sm font-medium text-secondary-foreground bg-secondary border border-transparent rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            Go to Homepage
          </button>
        </div>
        
        {showTechnicalDetails && error instanceof Error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details (Development)
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
              <code>{error.message}</code>
              {error.stack && (
                <code className="block mt-2 text-muted-foreground">{error.stack}</code>
              )}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
