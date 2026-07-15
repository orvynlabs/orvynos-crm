You are building **Orvyn CRM**, an internal agency management platform for
**Orvyn Labs**, a small software/digital-marketing agency based in Kerala,
India run by 4 co-founders. This is NOT a SaaS product for external
customers — it's an internal tool replacing Excel sheets, WhatsApp chats,
scattered Google Docs, and manual PDF creation with one clean platform.

Read this whole message before writing any code. Then confirm you
understand the project by summarizing it back to me in 5 bullet points
before we start Phase 0.

### 1. Who uses this

Exactly 4 fixed user accounts (the co-founders). No public signup, no
customer-facing accounts, no multi-tenancy. Everyone currently has equal
access — but add a `role` column (default `"owner"`) to the user model now
so we can add Admin/Manager/Developer/Designer/Sales/HR roles later
without a schema migration nightmare.

### 2. What it replaces

- Excel sheets for tracking clients, projects, payments, expenses
- WhatsApp for leads and client communication follow-ups
- Google Docs for proposals and agreements
- Manual PDF creation for invoices, quotations, receipts

### 3. Core modules (in the order we will build them — see Section 6)

1. Clients — company profile, contact info, GST (optional), timeline of
   all activity (projects, payments, proposals, agreements, invoices,
   documents)
2. Projects — linked to a client, budget, deadline, status (New / Ongoing
   / Review / Completed / On Hold / Cancelled), progress, tech stack used
3. Payments — linked to a project, tracks amount received vs pending,
   payment method, history, generates PDF receipts
4. Expenses — categorized (Software, Hosting, Domains, Marketing, Office,
   Travel, Team Payments, Other), feeds into profit calculation
5. Team — the 4 founders' profiles, skills, assigned projects, amount
   paid/pending
6. Dashboard — revenue, expenses, profit, client/project counts, charts
   (built LAST, once real data exists — never build this first)
7. Leads — kanban pipeline (New → Contacted → Qualified → Proposal Sent →
   Negotiation → Won → Lost), converts to a Client on Won
8. Generators — Proposal, Invoice, Quotation, Agreement, all exported as
   branded PDFs
9. Documents hub — every generated document plus uploaded client files,
   organized by client and project
10. Reports — Revenue, Expenses, Profit, Payments, Projects, Clients,
    exportable as PDF/CSV/JSON

### 4. Tech stack (locked — do not substitute without asking)

- Next.js 15, App Router, TypeScript (strict mode)
- Tailwind CSS + shadcn/ui
- Framer Motion (used sparingly — page transitions, drag-and-drop feedback
  only)
- React Hook Form + Zod for every form
- PostgreSQL on Neon (single database, no multi-tenant schema)
- Prisma ORM, migrations tracked in git
- Auth.js (NextAuth v5) — email/password, 4 seeded accounts, no
  self-signup
- Cloudflare R2 for file/document storage (S3-compatible SDK)
- Recharts for all charts
- Playwright for HTML-to-PDF generation (proposals, invoices, quotations,
  agreements, receipts) — NOT react-pdf
- Deployed on Vercel (free/hobby tier — be mindful of the 10s serverless
  function timeout on PDF generation routes)

### 5. Brand and design system — orange and white theme

The brand mark is a bold, geometric orange icon on a white background
(see attached reference). Build the entire UI around this palette. Use
these exact values as CSS variables / Tailwind theme extension — do not
invent new hex values:

| Token | Hex | Use for |
|---|---|---|
| `--brand-orange` | `#EA3B0C` | Primary actions, active nav item, links, focus rings, brand accents |
| `--brand-orange-hover` | `#C22E06` | Hover/active states on orange buttons |
| `--brand-orange-tint` | `#FFEDE5` | Light backgrounds behind orange badges/highlights, selected-row tint |
| `--surface-white` | `#FFFFFF` | Cards, modals, primary content surfaces |
| `--surface-page` | `#F7F5F2` | Page background (warm off-white, not stark gray) |
| `--text-primary` | `#292524` | Body text, headings (warm dark neutral, not pure black) |
| `--text-secondary` | `#78716C` | Muted/supporting text |
| `--border` | `#E7E4DF` | Default hairline borders |

Design rules:
- Orange is the ONE accent color. Use it for primary buttons, active
  states, links, and key data highlights — not for every icon or badge.
- Status colors (project status, payment status, lead stage) must use
  SEPARATE semantic colors, not variations of orange, so they don't get
  confused with brand actions: green for success/paid/won, amber for
  pending/in-review, red for overdue/lost/cancelled, blue-gray for
  neutral/new states.
  - Because two of these (green, red) are common web defaults, only use
    them for their semantic meaning — never repurpose them decoratively.
- Cards: white surface, 1px `--border`, 12px radius, no drop shadows —
  flat design, generous whitespace.
- Buttons: solid orange for primary actions (max one per view/section),
  outline/ghost style for secondary actions.
- Dark mode: invert surfaces (dark warm gray backgrounds, e.g. `#1C1917`
  page / `#292524` card), keep the orange accent roughly the same
  saturation so the brand stays recognizable, lighten text tokens
  accordingly. Ask me to confirm exact dark-mode values before hardcoding
  them into Tailwind config — don't guess silently.
- Typography: system sans stack (Tailwind default), no serif anywhere in
  the product UI.

### 6. Build order (do not skip ahead)

Phase 0 Setup & Foundations → Phase 1 Schema, Auth & App Shell → Phase 2
Clients → Phase 3 Projects → Phase 4 Payments & Expenses → Phase 5 Team →
Phase 6 Dashboard → Phase 7 Leads → Phase 8 Generators → Phase 9
Documents & Reports → Phase 10 Polish & Launch.

Each later module depends on the ones before it existing with real data —
building Dashboard or Reports early means fake data and a rebuild later.

### 7. Standing rules for how you work on this project

- Read `prisma/schema.prisma` before changing any data model — never
  guess field names.
- Never duplicate money-calculation logic (pending amount, revenue,
  profit). Put every formula in `src/lib/finance.ts` and import it
  everywhere — dashboard, project pages, reports must always agree.
- Every new Prisma relation needs an explicit `onDelete` behavior.
- Prefer Server Actions over API routes for internal forms.
- Check `src/components/ui` for an existing shadcn component before
  creating a new one.
- PDF templates live in `src/components/pdf-templates` as plain React
  components rendered via Playwright — not react-pdf.
- Give me short diffs/edits for existing files, not full-file rewrites,
  unless the file is brand new.
- If something in this brief is ambiguous, ask me one short question
  rather than assuming and building the wrong thing.
