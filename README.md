# ResumAI Hub

ResumAI Hub is a full-stack AI SaaS application for building modern resumes and tailored cover letters. It includes a live split-screen builder, multilingual AI generation, ATS scoring, QR code embedding, profile photo support, A4 print/PDF export, authentication, and checkout stubs for Pro subscriptions.

## Tech Stack

- **Framework:** Next.js App Router, React
- **Styling:** Tailwind CSS v4, custom dark/light design system
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Local email/password sessions + Google OAuth production hooks
- **AI:** OpenAI-compatible server-side integration with a local fallback generator
- **PDF/Print:** Browser-native A4 print flow plus vector PDF helper utilities
- **Payments:** Stripe, Payme, and Click checkout/webhook stubs
- **Security:** httpOnly sessions, server-side API keys, CORS helper, rate limiting helper, webhook verification stubs

## Features

- Landing page with demo mode and localized UI
- Uzbek / Russian / English language switcher
- Email/password auth and Google OAuth-ready auth
- Direct demo mode that opens the builder with sample data
- Live split-screen resume editor + A4 preview
- 3 templates: Minimalist, Tech/Modern, Executive
- 3:4 profile photo upload with show/hide toggle
- Skill badges with visual proficiency levels
- ATS score and keyword matcher with missing skill suggestions
- QR code embed for portfolio / LinkedIn / Telegram links
- AI resume summary, bullet, skills, and cover-letter generation
- Cover letter tones: Professional, Friendly, Bold, Confident, Modern
- A4 print/PDF export route designed to avoid cut-off margins
- Payment checkout stubs for Stripe / Payme / Click

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env.local
```

For the provided local sandbox database, use:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

If you want live OpenAI generation, add:

```env
OPENAI_API_KEY=sk-...
```

If `OPENAI_API_KEY` is missing, the app uses its built-in local AI fallback generator.

### 3. Apply the database schema

```bash
npx drizzle-kit push
```

### 4. Start development server

```bash
npm run dev
```

Open: [http://localhost:3000](http://localhost:3000)

## Required Environment Variables

See `.env.example` for the full list.

```env
NEXT_PUBLIC_APP_URL=
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
PAYME_MERCHANT_ID=
CLICK_SERVICE_ID=
```

Optional production/security variables:

```env
API_CORS_ORIGINS=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
PAYME_WEBHOOK_KEY=
CLICK_SECRET_KEY=
```

## Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create/select a project.
3. Configure **OAuth consent screen**.
4. Create OAuth credentials:
   - Application type: **Web application**
   - Authorized redirect URI:

```text
https://your-domain.com/api/auth/google/callback
```

For local development:

```text
http://localhost:3000/api/auth/google/callback
```

5. Add credentials to environment:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Auth behavior

- If Google credentials are configured, `/api/auth/google` starts a real Google OAuth flow.
- If credentials are missing, local development falls back to a safe demo Google identity so the app remains testable.
- Sessions are stored in PostgreSQL and issued as httpOnly cookies.

## AI API Configuration

Server-side AI calls are made through API routes, never from the browser with exposed secrets.

```env
OPENAI_API_KEY=sk-...
```

Relevant routes:

- `POST /api/ai/enhance` — summary, bullets, and skills
- `POST /api/ai/cover-letter` — tailored cover letters

Both routes use basic rate limiting and CORS/security headers via `src/lib/security.ts`.

## Payment Gateway Setup

The app includes production-ready checkout/webhook stubs. They are intentionally minimal so you can plug in your merchant-specific subscription logic.

### Checkout route

```http
POST /api/payments/checkout
Content-Type: application/json

{ "provider": "stripe" }
```

Supported providers:

- `stripe`
- `payme`
- `click`

The Pro Plan is defined in `src/lib/payments.ts`:

```ts
$9/mo — ResumAI Hub Pro
```

### Stripe

Environment:

```env
STRIPE_PUBLIC_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Webhook endpoint:

```text
/api/payments/webhooks/stripe
```

The checkout helper currently creates a subscription Checkout Session using inline price data. In production, create a Stripe Price and replace inline `price_data` with `STRIPE_PRO_PRICE_ID`.

### Payme

Environment:

```env
PAYME_MERCHANT_ID=...
PAYME_WEBHOOK_KEY=...
```

Webhook endpoint:

```text
/api/payments/webhooks/payme
```

Implement Payme merchant methods (`CheckPerformTransaction`, `CreateTransaction`, `PerformTransaction`, etc.) in the stub route.

### Click

Environment:

```env
CLICK_SERVICE_ID=...
CLICK_SECRET_KEY=...
```

Webhook endpoint:

```text
/api/payments/webhooks/click
```

Map Click prepare/complete callbacks to your subscription table in the stub route.

## Security Notes

- Secrets are read only server-side via `process.env`.
- Client-side code only uses `NEXT_PUBLIC_*` variables.
- Auth sessions are stored in PostgreSQL and issued as httpOnly cookies.
- AI, checkout, and webhook routes are server-side only.
- `src/lib/security.ts` provides:
  - CORS headers
  - preflight responses
  - security headers
  - in-memory rate limiting
  - environment validation helpers
- For production at scale, replace in-memory rate limiting with Redis / Upstash / Vercel KV.
- Webhook stubs include signature/auth verification structures but should be completed with provider-specific official SDK checks before accepting money.

## Deployment

### Vercel

1. Push the repo to GitHub/GitLab.
2. Import the project in Vercel.
3. Configure environment variables from `.env.example`.
4. Attach a PostgreSQL database (Neon, Supabase, Vercel Postgres, Railway, etc.).
5. Run schema push in a deployment hook or locally against production:

```bash
DATABASE_URL="postgresql://..." npx drizzle-kit push
```

6. Deploy.

Recommended Vercel settings:

- Framework: Next.js
- Build command: `npm run build`
- Install command: `npm install`

### Netlify

1. Import the repository.
2. Use the Next.js runtime/plugin.
3. Configure environment variables from `.env.example`.
4. Set build command:

```bash
npm run build
```

5. Ensure your database allows connections from Netlify functions.
6. Apply Drizzle schema against production database:

```bash
DATABASE_URL="postgresql://..." npx drizzle-kit push
```

## Useful Commands

```bash
npm run dev          # local development
npm run build        # production build
npm run start        # start production server
npm exec tsc -- --noEmit
npx next typegen
npx drizzle-kit push
```

## Project Structure

```text
src/app/                 Next.js App Router pages and API routes
src/app/api/auth/        Email auth, Google OAuth, sessions
src/app/api/ai/          Server-side AI routes
src/app/api/payments/    Checkout and webhook stubs
src/components/          UI, landing, dashboard, builder, templates
src/db/                  Drizzle client and schema
src/lib/                 Auth, AI, payments, security, ATS, i18n helpers
```

## Production Checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to the deployed URL
- [ ] Set production `DATABASE_URL`
- [ ] Run `npx drizzle-kit push` against production DB
- [ ] Configure Google OAuth redirect URI
- [ ] Add `OPENAI_API_KEY` if using live AI
- [ ] Add payment provider keys
- [ ] Configure webhook endpoints in Stripe / Payme / Click dashboards
- [ ] Replace webhook stubs with subscription persistence logic
- [ ] Replace in-memory rate limit with Redis/KV for multi-instance deployments

## License

Private / commercial SaaS starter implementation for ResumAI Hub.
