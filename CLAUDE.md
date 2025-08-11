# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm install` - Install dependencies
- `npm run dev` - Start development server with HMR (http://localhost:5173)
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run typecheck` - Run TypeScript type checking and generate types

### Convex Backend
- `npx convex dev` - Start Convex development server (required for backend functionality)

## Architecture Overview

### Tech Stack
- **React Router v7** - Full-stack React framework with SSR, configured for Vercel deployment
- **Convex** - Real-time serverless database and backend functions
- **Clerk** - Authentication and user management
- **Polar.sh** - Subscription billing and payment processing
- **TailwindCSS v4** - Styling framework with shadcn/ui components
- **TypeScript** - Type safety throughout the application

### Project Structure
- `app/` - Frontend application code
  - `routes/` - React Router route components (file-based routing defined in routes.ts)
  - `components/` - Reusable UI components
    - `ui/` - shadcn/ui base components
    - `dashboard/` - Dashboard-specific components
    - `homepage/` - Homepage sections
  - `lib/` - Utility functions
  - `hooks/` - Custom React hooks
- `convex/` - Backend functions and database schema
  - `schema.ts` - Database schema definitions
  - `http.ts` - HTTP endpoints including AI chat and webhooks
  - `subscriptions.ts` - Polar.sh webhook handling
  - `users.ts` - User management functions
- `public/` - Static assets

### Key Integration Points

#### Authentication Flow
- Clerk handles authentication with React Router integration
- User data syncs to Convex database via `users.ts` functions
- Protected routes use loaders for server-side auth checks

#### Subscription Management
- Polar.sh products fetched dynamically for pricing pages
- Webhook endpoint at `/payments/webhook` processes subscription events
- Subscription status stored in Convex and checked in protected routes

#### AI Chat
- OpenAI integration via Convex HTTP endpoint at `/api/chat`
- Streaming responses using Vercel AI SDK
- Chat UI in `routes/dashboard/chat.tsx`

#### Real-time Updates
- Convex provides real-time data synchronization
- Components use Convex hooks for reactive data

### Environment Configuration
Required environment variables:
- `CONVEX_DEPLOYMENT` - Convex deployment identifier
- `VITE_CONVEX_URL` - Convex client URL
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `POLAR_ACCESS_TOKEN` - Polar.sh API token
- `POLAR_ORGANIZATION_ID` - Polar.sh org ID
- `POLAR_WEBHOOK_SECRET` - Webhook verification
- `OPENAI_API_KEY` - OpenAI API key
- `FRONTEND_URL` - Frontend URL for CORS

### Deployment Notes
- Configured for Vercel deployment via `@vercel/react-router` preset
- Docker support available for containerized deployments
- SSR enabled by default in `react-router.config.ts`