[README.md](https://github.com/user-attachments/files/30986656/README.md)
# Peculiar Youth & Children Ministry

A youth and children's church website for Peculiar Youth & Children Ministry in Kasoa, Ghana — where the next generation discovers Jesus, builds friendships, and lives out their purpose.

Live site: [peculiaryouthchurch.com](https://peculiaryouthchurch.com/)

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19) with [TanStack Router](https://tanstack.com/router)
- **Build tool:** Vite 7
- **Styling:** Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/)-style components on Radix UI primitives
- **Backend/Data:** [Supabase](https://supabase.com/)
- **Forms:** React Hook Form + Zod
- **Rich text:** Tiptap
- **Deployment:** Cloudflare (via `@cloudflare/vite-plugin` + `wrangler.jsonc`)
- **Package manager:** Bun
- **Tooling:** ESLint, Prettier, TypeScript

This project was built with [Lovable](https://lovable.dev) (see `.lovable/`).

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- A Supabase project (URL + anon key)

### Installation

```bash
bun install
```

### Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> A `.env` file is currently committed to this repo. If it contains real credentials, rotate them and add `.env` to `.gitignore` — committed secrets are a standing risk regardless of repo visibility.

### Development

```bash
bun run dev
```

### Build

```bash
bun run build
```

Use `bun run build:dev` for a development-mode build, and `bun run preview` to preview the production build locally.

### Linting & Formatting

```bash
bun run lint
bun run format
```

## Project Structure

```
.
├── .lovable/       # Lovable project config
├── public/         # Static assets
├── src/            # Application source (routes, components, etc.)
├── supabase/       # Supabase config/migrations
├── wrangler.jsonc  # Cloudflare deployment config
└── vite.config.ts  # Vite configuration
```

## Deployment

Deployed to Cloudflare via the Cloudflare Vite plugin and `wrangler.jsonc`. Confirm the deploy command against your Cloudflare setup (e.g. `wrangler deploy`) since no deploy script is currently defined in `package.json`.

## License

No license file is currently present in this repo — add one (e.g. MIT) if you intend this to be reused or contributed to; otherwise it defaults to "all rights reserved."
