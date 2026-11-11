# 3Sixty Protect

A marketing, services and booking website for **3Sixty Protect**, a UK private security company.
Alongside flagship **SIA training** (Door Supervision & Close Protection), it offers executive
protection, security risk-management consultancy, technical surveillance, manpower supply and
private investigations. Built with Next.js, TypeScript, Tailwind CSS and Supabase, and deployed
on Vercel.

**Live:** <https://www.3sixtyprotect.com>

> **Works out of the box.** The site ships with built-in demo data, so you can run it and click
> through every page (including the admin portal in read-only "demo mode") before connecting a
> database. Add your Supabase keys to switch on real data, auth and bookings.

---

## ✨ Features

**Public website**
- Full-spectrum hero and an **"Our Services"** overview
- **Services** overview (`/services`) with a detail page for each discipline — Executive
  Protection, Security Risk Management Consultancy, Technical Surveillance, Manpower Supply &
  Management, and Private Investigations
- **SIA training:** dedicated **Door Supervision** and **Close Protection** course pages, a
  filterable **Training Calendar**, and an online **booking flow** with a live summary
- **Contact** page with an enquiry form plus registered / centre addresses
- SEO-friendly metadata, Open Graph tags, JSON-LD, `sitemap.xml` and `robots.txt`

**Owner / admin portal** (`/admin`)
- Secure email + password login (Supabase Auth), restricted to authorised admins
- Dashboard with live stats, recent bookings and upcoming courses
- Full course management — create, edit, publish/unpublish, delete
- Booking management — view enquiries and update booking status

---

## 🧱 Tech stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) + React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS — "Monolith" monochrome design system |
| Database & Auth | Supabase (Postgres + Auth + Storage) |
| Payments (optional) | Stripe (wired, switched off until configured) |
| Icons | lucide-react |
| Validation | Zod |
| Hosting | Vercel |

---

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template (optional for demo mode)
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Open <http://localhost:3000>. With no env vars set, the site runs in **demo mode** using the
built-in sample courses and bookings.

---

## 🗄️ Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql) to create the
   tables, row-level-security policies and helper functions.
3. *(Optional)* Run [`supabase/seed.sql`](supabase/seed.sql) to insert a few published
   courses so the site has content.
4. In **Project Settings → API Keys**, copy your keys into `.env.local`. The app accepts either
   Supabase's **new** API keys (publishable / secret) **or** the **legacy** keys (anon /
   service_role) — the new keys are preferred when both are present:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co

   # Public client key — new "publishable" key (preferred) OR legacy anon key
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...

   # Server-only key (bypasses RLS) — new "secret" key (preferred) OR legacy service_role key
   SUPABASE_SERVICE_ROLE_KEY=ey...
   # SUPABASE_SECRET_KEY=sb_secret_...

   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

5. **Create an admin user:**
   - In **Authentication → Users**, add a user (email + password; tick *Auto Confirm*).
   - In the **SQL Editor**, promote them to admin:

     ```sql
     insert into admin_users (id, email, role)
     select id, email, 'owner' from auth.users
     where email = 'owner@3sixtyprotect.com'
     on conflict (id) do nothing;
     ```

6. Restart the dev server. You can now sign in at `/admin/login`, and published courses will
   appear on the public site automatically.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | for live data | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | for live data | New publishable key (or use the anon key below) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | alt. to publishable | Legacy anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | recommended | Legacy service-role key — server only, bypasses RLS |
| `SUPABASE_SECRET_KEY` | alt. to service_role | New secret key — server only |
| `NEXT_PUBLIC_SITE_URL` | recommended | Production URL, used for SEO/canonical links |
| `CONTACT_NOTIFICATION_EMAIL` | optional | Inbox for new enquiry/booking notifications |
| `STRIPE_SECRET_KEY` · `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` · `STRIPE_WEBHOOK_SECRET` | optional | Online payments (see below) |

Key resolution lives in [`lib/supabase/config.ts`](lib/supabase/config.ts): the client key is
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the server key is
`SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY`.

---

## ☁️ Deploying to Vercel

Deployed on **Vercel**. The live project is not yet connected to GitHub, so a push to `main`
does not deploy on its own: see [HANDOVER.md](HANDOVER.md) for how production is deployed.

1. Push the repo to GitHub.
2. In Vercel: **Add New → Project** → import the repo. Next.js is auto-detected — accept the
   default build settings.
3. Add the **environment variables** (Project → Settings → Environment Variables) — the same
   ones as your local `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)
   - `NEXT_PUBLIC_SITE_URL` — set to your production URL
   - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and
     `STRIPE_WEBHOOK_SECRET`: required to take booking payments
   - `RESEND_API_KEY` and `EMAIL_FROM`: staff email alerts for new bookings and enquiries.
     Without them the alerts are simply skipped; bookings and enquiries still go through
   - `CONTACT_NOTIFICATION_EMAIL`: inbox that receives those alerts, comma-separated for several
4. **Deploy.** Build command (`next build`) and output are auto-detected.
5. Set `NEXT_PUBLIC_SITE_URL` to the live URL (or your custom domain) and **redeploy** so
   canonical / SEO links point at production.

**Custom domain:** Project → **Settings → Domains** → add your domain, follow the DNS records,
then update `NEXT_PUBLIC_SITE_URL`.

> Without the Supabase vars the deploy still works in read-only **demo mode**. The build logs a
> few *"dynamic server usage / serving demo data"* notices for pages that read cookies — these
> are expected (those pages render dynamically) and don't fail the build.

---

## 💳 Stripe (payments) — ready when you are

The booking flow is structured so card payment can be switched on without restructuring:

- [`lib/stripe.ts`](lib/stripe.ts) holds a guarded Stripe client and a `createCheckoutSession()`
  helper. It returns `null` until `STRIPE_SECRET_KEY` is set.
- In [`app/(site)/book/actions.ts`](app/(site)/book/actions.ts) there's a marked hook where you
  create a checkout session after the booking row is inserted, then redirect to Stripe.

Until then, bookings are stored with `booking_status = 'new'` and confirmed manually from the
admin portal.

---

## 📁 Project structure

```
app/
  (site)/            Public website (header + footer layout)
    page.tsx           Homepage (hero, Our Services, training)
    services/          Services overview + [slug] detail pages
    door-supervision/  Door Supervision course page
    close-protection/  Close Protection course page
    calendar/          Training calendar (filterable)
    book/              Booking flow + server action
    contact/           Contact form + server action
  admin/
    login/             Admin login
    (panel)/           Authenticated portal (dashboard, courses, bookings)
    _actions/          Server actions (auth, course CRUD, bookings)
  sitemap.ts, robots.ts
components/
  ui/                UI primitives (Button, Field, Section, …)
  service/           ServicePageTemplate; ServiceCard + ServiceIcon (top level)
  course/, booking/, contact/, calendar/, admin/, layout/
lib/
  services.ts        Services content model
  supabase/          Clients + key/config resolution
  courses.ts, course-content.ts, mock-data.ts, constants.ts, types.ts, …
supabase/            schema.sql + seed.sql
public/images/       Site imagery
```

---

## 🎨 Design system — "Monolith"

Monochrome **brutalist-minimalism / Swiss typographic** style: warm off-white (`#fcf9f8`) and
black, sharp **0px corners**, hard **1px borders** instead of shadows, oversized display
headlines, monospace metadata labels, and **hover = colour inversion**. Type is **Hanken
Grotesk** (display), **Inter** (body) and **JetBrains Mono** (labels), loaded via `next/font`.

Design tokens live in [`tailwind.config.ts`](tailwind.config.ts) — the `ink` scale is a warm
monochrome ramp and `error` (`#ba1a1a`) is the single retained accent — and
[`app/globals.css`](app/globals.css). Change those to re-skin the whole site.

---

## 🛣️ Built to extend

The structure is ready for the natural next features: online payments (Stripe is wired),
per-service enquiry routing, learner accounts, certificate uploads, and automated email
confirmations and reminders.
