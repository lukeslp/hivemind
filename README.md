# HiveMind

A spatial brainstorming tool built on a hexagonal grid. Click any node and Gemini expands it into 6 contextual neighbors — keep exploring until you've mapped the whole idea space.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Live](https://img.shields.io/badge/live-dr.eamer.dev%2Fhivemind-cyan.svg)](https://dr.eamer.dev/hivemind/)

**[Try it live →](https://dr.eamer.dev/hivemind/)**

## Features

- Expands any node into 6 contextual Gemini-generated neighbors on the hex grid
- Seven node types (root, concept, action, technical, question, risk, default) with distinct colors and icons
- Deep-dive analysis of any node via Gemini
- Image generation per node
- Full keyboard navigation — arrow keys move through the grid, all shortcuts documented in-app
- Session save/load/export as JSON
- Undo/redo (50 levels)
- Viewport culling for snappy performance on large maps
- WCAG 2.1 AA compliant with screen reader support and ARIA live regions
- Touch support: single-finger pan, pinch-to-zoom

## Quick Start

```bash
pnpm install
cp .env.example .env   # add your GEMINI_API_KEY
pnpm dev               # http://localhost:3000
```

## Development

```bash
pnpm dev        # Vite dev server with HMR
pnpm build      # Frontend + server bundle → dist/
pnpm start      # Production (NODE_ENV=production node dist/index.js)
pnpm check      # TypeScript
pnpm format     # Prettier
```

The Gemini API key stays server-side. The Express server proxies all Gemini requests — the client never touches the key directly.

## Architecture

React 19 + Vite frontend, Express backend, all bundled into `dist/` for production. The server serves the static build and proxies two API routes:

- `POST /api/generate` — hex neighbor expansion and deep-dive text
- `POST /api/generate-image` — per-node image generation

The grid uses axial coordinates `(q, r)` — node keys are `"q,r"` strings. Six neighbor directions are hardcoded as offset vectors. The coordinate math (`hexToPixel`, `pixelToHex`) lives in `HiveMindApp.tsx`.

State lives in React hooks. Sessions persist to `localStorage`. The main `pages/HiveMindApp.tsx` orchestrates 10 extracted hooks — `useAIGeneration`, `useNodeManagement`, `useHistory`, `useCanvasInteraction`, `useSearch`, `useAnnouncer`, `useAccessibilityLabels`, `useComposition`, `useMobile`, `usePersistFn`.

Deployed at `/hivemind/` subpath via Caddy reverse proxy. Vite base, Express static root, and client routing are all configured for the subpath.

## Author

**Luke Steuber**
- [dr.eamer.dev](https://dr.eamer.dev)
- Bluesky: [@lukesteuber.com](https://bsky.app/profile/lukesteuber.com)
- GitHub: [hexmind](https://github.com/lukeslp/hexmind)

## License

MIT
