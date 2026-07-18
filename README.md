# LOOP - AI Customer-Feedback Intelligence Platform

LOOP is a multi-tenant web application that ingests customer feedback from multiple channels, uses AI to classify and cluster it into themes, detects trends, answers plain-English questions grounded in real feedback data, and generates Voice-of-Customer reports for leadership.

Built as a Zidio Development internship project (Web Development Track).

## Live Demo

- App: https://loop-eight-mauve.vercel.app
- Repo: https://github.com/Bharathraj-2002/loop

### Demo credentials (same workspace, three roles)

| Role    | Email               | Password  |
|---------|---------------------|-----------|
| Admin   | admin@acme.test     | Demo@1234 |
| Analyst | analyst@acme.test   | Demo@1234 |
| Viewer  | viewer@acme.test    | Demo@1234 |

## Tech Stack

- Framework: Next.js 14 (App Router) + TypeScript
- Styling: Inline styles (Tailwind-ready, kept minimal for speed of build)
- Database: PostgreSQL (Neon)
- ORM: Prisma
- Auth: NextAuth (Auth.js), credentials-based
- AI: Google Gemini API with model fallback, used in place of Claude due to API credit constraints during development
- Charts: Recharts
- Validation: Manual + Zod where applicable
- Deployment: Vercel + Neon Postgres

## Architecture Summary

LOOP follows a three-tier architecture.

1. Client (Next.js App Router) - Dashboard, Feedback Inbox, Themes, Ask LOOP, Reports.
2. API layer (Route Handlers under /app/api) - authenticates every request, checks user role, scopes every query to the caller workspaceId.
3. Data layer (PostgreSQL via Prisma) - all tenant tables carry a workspaceId foreign key.

AI features call Google Gemini API server-side only, the API key never reaches the browser.

### Security rule

Every database query touching feedback, themes, reports, or users is filtered by the workspaceId. A user from one workspace can never read another workspace data.

## Core Features

- Multi-tenant workspaces with three roles: Admin, Analyst, Viewer, RBAC enforced server-side.
- Feedback ingestion: single-entry form, CSV bulk upload, simulated channel import.
- Feedback inbox with search, filters, pagination, and status workflow.
- Analytics dashboard with volume, sentiment, and channel charts.

## AI Features

- Auto-classification: every feedback item is tagged with sentiment, sentiment score, theme, and feature area via Gemini.
- Theme clustering and trends: feedback is grouped into named themes with spike detection.
- Ask LOOP: retrieval-grounded Q&A, answers only from real feedback data.
- Voice-of-Customer report: stats pre-computed in code, Gemini writes the narrative only. Reports are saved, viewable, and exportable as PDF.

## Local Setup

### Prerequisites

- Node.js 18 LTS or newer
- A PostgreSQL database, Neon free tier recommended
- A Google Gemini API key

### 1. Clone and install

```bash
git clone https://github.com/Bharathraj-2002/loop.git
cd loop
npm install
```

### 2. Environment variables

Create a .env file in the project root:

```
DATABASE_URL="your-postgres-connection-string"
NEXTAUTH_SECRET="a-random-secret-string"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Database setup

```bash
npx prisma migrate dev
npm run seed
```

This creates the demo workspace, three role-based users, and 130+ seeded feedback items.

### 4. Run locally

```bash
npm run dev
```

Visit http://localhost:3000 and log in with any of the demo credentials above.

### 5. Deploy

Push to GitHub, connect the repo to Vercel, and add the same environment variables in Vercel Project Settings, then redeploy.

## Known Limitations

- Gemini free-tier API key has a daily request quota. Heavy testing of AI features in a short window may hit that limit. The app includes retry logic and a model fallback to handle transient errors.
- AI provider is Google Gemini, not Claude, due to Anthropic API credit constraints during the internship period. The RAG and structured-output patterns match what the brief specifies.

## Project Status

Built over a 4-week sprint per the Zidio Development brief. Core app, AI features, and Voice-of-Customer reporting with export are complete and deployed.

