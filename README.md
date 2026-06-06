# Job Application Email Tracker

Production-ready MVP for a job seeker who wants to connect multiple email IDs and automatically track job applications, interview calls, offers, and rejections.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Node.js API routes
- PostgreSQL
- Prisma ORM
- OAuth-only Gmail and Outlook account connection structure
- Rule-based classifier with an AI/LLM-ready fallback hook
- Hourly worker script and manual Scan Now button

## Core behavior

- Connect multiple email accounts without storing passwords.
- Store OAuth refresh tokens encrypted with AES-256-GCM.
- Scan inbox, sent, and provider-specific job folders through provider adapters.
- Deduplicate by account message ID and update existing applications by normalized company + position + thread ID.
- Keep an `ApplicationUpdate` history row for every relevant email.
- Extract company, position, source email account, sender/recruiter email, dates, status, rejection reason, interview date/type/contact/link, notes, original subject, and original URL when provider exposes one.
- Supports Ireland-focused QA, Automation, Performance Testing, Data Analyst, Software Testing, SDET, and Test Analyst emails.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Generate a token encryption key and put it in `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

4. Start PostgreSQL and set `DATABASE_URL`.

5. Create tables and seed mock data:

```bash
npm run prisma:migrate
npm run prisma:seed
```

6. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## OAuth setup

### Gmail

Create a Google Cloud OAuth app and set:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/gmail/callback`

The app requests Gmail readonly access and user email only.

### Outlook / Hotmail

Create a Microsoft Entra OAuth app and set:

- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_TENANT_ID=common`
- `MICROSOFT_REDIRECT_URI=http://localhost:3000/api/oauth/outlook/callback`

The app requests `offline_access`, `User.Read`, and `Mail.Read`.

## Email provider mode

Use mock scanning locally:

```env
EMAIL_PROVIDER_MODE="mock"
```

Set it to a production value after implementing the provider message fetchers in `email/providers.ts`.

## Scheduled scanning

Run a one-off scan:

```bash
npm run scan
```

Run the built-in hourly worker:

```bash
npm run scan:hourly
```

In production, prefer a managed scheduler such as GitHub Actions cron, Render cron jobs, Railway cron, Fly Machines, AWS EventBridge, or a Kubernetes CronJob calling `POST /api/scan`.

## Tests

```bash
npm test
```

Classifier tests cover:

- Application confirmation email
- Rejection email
- Interview invite email
- Recruiter call email
- Job offer email
- Generic non-job email

## Important security notes

- Never ask for or store raw email passwords.
- Use OAuth and encrypt refresh tokens.
- Keep `TOKEN_ENCRYPTION_KEY` outside source control.
- Store message bodies only when needed.
- Encrypt sensitive production databases at rest.
- Add real user authentication before deploying for multiple users.
- Review provider terms and user consent screens before production release.

## Where to extend next

- Implement real Gmail message normalization in `email/providers.ts`.
- Implement Microsoft Graph delta sync in `email/providers.ts`.
- Replace demo user auth in `lib/auth.ts` with NextAuth, Clerk, Auth.js, or your preferred auth provider.
- Connect `classifyJobEmailWithAiFallback` to OpenAI for ambiguous emails.
- Add notification channels for selected, rejected, or interview statuses.
