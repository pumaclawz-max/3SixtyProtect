# 3Sixty Protect: developer handover

Written 11 November 2026 for the developer taking over this codebase. It covers what the
[README](README.md) does not: where everything is hosted, how the live site is deployed, what
has been done to the live database, and what is unfinished. Read the README first for local
setup and the project structure.

No secrets are in this document or in the repository. Get them from the services listed below.

## What you are taking over

| Part | Where it lives | Notes |
|---|---|---|
| Code | GitHub, `3SixtyProtect` | Single branch, `main`. Full history. |
| Hosting | Vercel project `3sixty-protect` (`prj_uUCDur3wTf0YRPBarMbet3byLRTd`) | Serves `www.3sixtyprotect.com`. Holds all production environment variables. |
| Database, auth, file storage | Supabase project `dfgevxndlxdyjzdqjajk` | Postgres, admin logins, and two storage buckets. |
| Payments | Stripe account "3sixtyprotect" | Live since 15 October 2026. Takes the full course fee at booking. |
| Staff email alerts | Resend | Sends new booking and enquiry notifications. |
| Domain | `3sixtyprotect.com` | DNS points at Vercel. |

Confirm you have an owner login for each of these. The Supabase organisation, the Resend
account and the domain registrar were not checked as part of this handover, so verify who owns
them before the previous developer's access is removed.

## Deploying

**A push to `main` does not update the live site.** The live Vercel project has no Git
connection. Until now it has been deployed from a local checkout with the Vercel CLI:

```bash
vercel link        # once, choose the 3sixty-protect project
vercel --prod
```

Recommended first job: in the Vercel project, go to Settings, then Git, and connect this
repository. After that every push to `main` deploys to production and the README's description
becomes true.

A second Vercel project with a near-identical name, `3-sixty-protect` (extra hyphen), exists in
the previous developer's personal Vercel team and was connected to the GitHub repository. It is
not the live site and will be removed. If you see it referenced anywhere, ignore it.

Changes to environment variables in Vercel only take effect after a new deployment.

## Environment variables

[.env.example](.env.example) lists every variable the code reads. The production values are in
the Vercel project under Settings, then Environment Variables. For local development, copy them
into `.env.local`, which is gitignored. Use Stripe **test** keys locally, never the live ones.

`ACTIVITY_SALT` is optional. It salts the visitor hash in the activity log; without it the
Supabase server key is used as the salt.

## Database

The schema is plain SQL in [supabase/](supabase/), run by hand in the Supabase SQL editor.
There is no migration tool. All of these have already been run against the live project:

| File | Run live | Safe to re-run? |
|---|---|---|
| `schema.sql` | June 2026 | Yes |
| `screening.sql` | 23 Sep 2026 | Check before re-running |
| `course-types.sql` | 7 Oct 2026 | **No.** It overwrites course type names that staff have edited in the admin portal. |
| `course-locations.sql` | Oct 2026 | Check before re-running |
| `booking-details.sql` | 15 Oct 2026 | Yes |
| `site-activity.sql` | Oct 2026 | Check before re-running |
| `seed.sql` | Never needed live | Demo courses only. Do not run on production. |

To build a fresh database (for staging or local work), run them in the order above, skipping
`seed.sql` unless you want sample courses.

When a change needs new columns, run the SQL on the live database **before** deploying the code
that writes to them, otherwise live bookings fail.

Row-level security is on for every table. Admin access is controlled by the `admin_users` table
and its `permissions` column, not by Supabase roles.

## Payments

- Checkout is Stripe Checkout, created in [lib/stripe.ts](lib/stripe.ts) and
  [app/(site)/book/actions.ts](app/(site)/book/actions.ts).
- The live webhook is `https://www.3sixtyprotect.com/api/stripe/webhook`, subscribed to
  `checkout.session.completed`, `checkout.session.async_payment_succeeded` and
  `checkout.session.expired`.
- The deposit helpers in [lib/payments.ts](lib/payments.ts) are unused; the site charges the
  full fee.
- Quick production check without credentials: a `POST` to the webhook URL returns 400 when
  Stripe is configured and 503 when the keys are missing.
- The README section on Stripe predates go-live and still describes payments as switched off.

## Things worth knowing

- **Vetting and screening module** (`app/admin/(panel)/vetting`, `lib/screening`). The numbers
  in [lib/screening/config.ts](lib/screening/config.ts) marked `TODO(policy)` (5-year history,
  31-day gap tolerance, 7-day overlap tolerance, one verified identity document) are working
  assumptions. They have not been confirmed by 3Sixty Protect as company policy and are not a
  statement of what BS 7858 requires. Its tests run with `npm run test:screening`.
- **Activity log** (`/admin/activity`). Cookieless. It stores visitor IP addresses for 90 days,
  then deletes them. This is described in the privacy policy page, so keep the two in step.
- **Contact form spam checks** ([lib/spam.ts](lib/spam.ts)). A hidden honeypot field and a
  three-second delay marker. Added 11 November 2026 after a run of automated submissions. It
  will not stop sales pitches sent from a real browser; Cloudflare Turnstile is the suggested
  next step if those continue.
- **Copy style.** The client does not want em dashes in website copy.
- **Demo mode.** With no Supabase variables set the site runs on built-in sample data. Useful
  locally, but it also means a production deploy with missing variables looks healthy while
  showing fake courses.

## Open items at handover

1. Two commits on `main` were not yet on the live site when this was written: the contact form
   spam checks (`44c1cf7`) and the removal of the header Login button (`6d8f743`). Check the
   live site and deploy if they are still missing.
2. Connect the Vercel project to GitHub (see Deploying).
3. Two leftovers in the repository can be deleted: the file named `-w` in the root, and the
   `stitch_modern_minimalist_portfolio/` folder of early design mock-ups. Neither is used by
   the site.
4. Rotate the Supabase server key, the Stripe secret key and webhook secret, and the Resend key
   once the previous developer's access ends, then redeploy.
