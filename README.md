# Cruise Ship Log

A web-based cruise travel journal — Phase 1 prototype.

## Quick Start

**Requirements:** Node.js 18 or higher

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

Then open **http://localhost:5173** in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | Build for production (output to `/dist`) |
| `npm run preview` | Preview the production build locally |

## Project Structure

```
cruise-ship-log/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx        ← All 12 journal sections (single file, Phase 1)
│   ├── main.jsx       ← React entry point + window.storage polyfill
│   └── index.css      ← Global reset
├── index.html
├── vite.config.js
├── package.json
└── CLAUDE.md          ← Full project context for AI-assisted development
```

## Data Storage

In development, all journal data is saved to **localStorage** in your browser.
The key prefix is `csj-` (e.g. `csj-voyage`, `csj-dailyLogs`).

To clear all data: open DevTools → Application → Local Storage → clear all `csj-` keys.

## Tech Stack (Phase 1)

- **React 18** — UI
- **Vite** — build tool and dev server
- **localStorage** — persistence (polyfills `window.storage` from the Claude prototype)

## Tech Stack (Phase 2 — planned)

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage)
- Vercel (hosting)

See `CLAUDE.md` for full architecture documentation.
