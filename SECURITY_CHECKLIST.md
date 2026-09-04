# Security Fixes Applied

This package contains patched versions of the files from the code review.

## What changed

1. **`.gitignore`** — now ignores `.env*.local` and the runtime `/data` directory.
2. **`src/app/api/authenticate/route.ts`** — replaced the hardcoded `authToken=authenticated` cookie with a signed JWT (HMAC). Added rate limiting and `AUTH_SECRET` requirement.
3. **`src/app/api/check-auth/route.ts`** — now verifies the signed JWT instead of checking a constant string.
4. **`src/app/api/rss/route.ts`** — escapes XML entities in titles, names, descriptions, etc.
5. **`src/app/api/og/fetch/route.ts`** — validates the target URL: only `https://`, blocks private/reserved IP ranges and `localhost`.
6. **`src/app/api/chat/route.ts`** — validates message type/length, adds rate limiting, and ensures the configured webhook uses HTTPS.
7. **`src/app/api/newsletter/subscribe/route.ts`** — uses ESM import for Mailchimp and adds rate limiting.
8. **`src/app/api/newsletter/unsubscribe/route.ts`** — now unsubscribes the user via the Mailchimp API (using the email MD5 hash) instead of a separate local JSON file.
9. **`src/components/Header.tsx`** — removed the hardcoded `fetch` calls to `127.0.0.1:7354` that leaked debug session IDs.
10. **`src/lib/storage/newsletter.ts` & `src/lib/storage/notified.ts`** — writes are now atomic (temp file + rename) to reduce race-condition corruption.
11. **`src/utils/server-utils.ts`** — removed the `AUTO_NOTIFY` side effect from `getServerPosts`. Notifications should be triggered by a cron job or admin endpoint, not a data-fetching function.
12. **`src/app/api/comments/route.ts`** — removed PII logging, added length limits, and uses the shared email validator.
13. **`next.config.mjs`** — added basic security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).

## Steps to apply these fixes in your repository

1. **Replace the files** in your local repo with the versions in this folder, keeping the same directory structure.
2. **Add a new environment variable** to your `.env.local`:
   ```
   AUTH_SECRET=any_long_random_string_at_least_32_chars
   ```
   You can generate one with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **Remove `.env.local` from Git history** (it currently contains real config values):
   ```bash
   git rm --cached .env.local
   echo ".env.local" >> .gitignore
   git commit -m "Remove .env.local from tracking and add .gitignore"
   ```
4. **Rotate exposed secrets** even if they were placeholders:
   - Mailchimp API key
   - n8n credentials / webhook URL
   - Google Analytics ID (optional but recommended)
5. **Review Vercel / hosting environment variables** and make sure `AUTH_SECRET` and `PAGE_ACCESS_PASSWORD` are set there.
6. **Run lint/build** to catch any TypeScript issues:
   ```bash
   pnpm install
   pnpm lint
   pnpm build
   ```
7. **(Optional but recommended)** Replace the in-memory rate limiters with a production-grade solution such as Vercel KV, Upstash Redis, or a middleware-based rate limiter.
