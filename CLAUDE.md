# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HiveMind is a spatial brainstorming tool using hexagonal grid expansion. Users click nodes to generate 6 contextual neighbors via Google Gemini API. React 19 + Vite + Express with a "Cyber-Hive" dark mode aesthetic.

**Live URL**: `https://dr.eamer.dev/hivemind/`
**GitHub**: hexmind (canonical name differs from local directory)
**Port**: 5057 (production service)

## Commands

```bash
pnpm dev              # Vite dev server (port 3000, --host enabled)
pnpm build            # Frontend build + esbuild server bundle → dist/
pnpm start            # Production: NODE_ENV=production node dist/index.js
pnpm check            # TypeScript type check (tsc --noEmit)
pnpm format           # Prettier

sm restart hivemind   # Restart production service
sm logs hivemind      # View production logs
```

## Architecture

### Hook-Extraction Pattern

The app has been partially refactored from a monolithic `HiveMindApp.tsx` (4000+ lines) into extracted hooks, but the main component still contains significant inline logic. The hooks extracted so far:

| Hook | Purpose |
|------|---------|
| `useAIGeneration` | Gemini API calls for neighbor generation + deep dive analysis |
| `useNodeManagement` | CRUD, session persistence (localStorage), filtering, clusters |
| `useHistory` | Generic undo/redo stack (max 50 entries) |
| `useCanvasInteraction` | Pan/zoom/drag for mouse and touch events |
| `useSearch` | Node search with result cycling |
| `useAnnouncer` | ARIA live region announcements (WCAG 4.1.3) |
| `useAccessibilityLabels` | ARIA label generation for nodes and toolbar |

`HiveMindApp.tsx` still orchestrates all these hooks plus handles: keyboard shortcuts, node selection/editing, toolbar UI, settings panel, template loading, and all modal state.

### Hexagonal Coordinate System

Uses **axial coordinates** (q, r) with pointy-top hexagons. Node keys are `"q,r"` strings.

```
HEX_SIZE = 80px
HEX_WIDTH = sqrt(3) * 80  ≈ 138.6px
HEX_HEIGHT = 2 * 80       = 160px
```

6 neighbor directions: East(+1,0), NE(+1,-1), NW(0,-1), West(-1,0), SW(-1,1), SE(0,+1)

Coordinate conversion functions: `hexToPixel(q,r)` and `pixelToHex(x,y)` handle the axial-to-screen transform.

### API Proxy Architecture

The Gemini API key is **not** in the client. The Express server proxies requests:

- `POST /api/generate` — text generation (neighbor expansion, deep dive)
- `POST /api/generate-image` — image generation (same Gemini endpoint)

Both proxy to `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`. Rate limited to 100 req/15min per IP. The client uses `buildApiUrl()` from `@/lib/api` which handles the base path prefix.

Environment: `GEMINI_API_KEY` in `.env`, loaded by the server via `dotenv`.

Model: `gemini-3-flash-preview` (defined in both `useAIGeneration.ts` and `HiveMindApp.tsx`).

### Lazy-Loaded Modals

Four modals are code-split with `React.lazy()`:
- `BuildArtifactModal` — generates documents/artifacts from brainstorm
- `DeepDiveModal` — detailed AI analysis of a node
- `SessionManagerModal` — save/load/export sessions
- `ImageGenerationModal` — Gemini image generation per node

Both `.tsx` (TypeScript) and legacy `.jsx` versions exist for the first three modals. The `.tsx` versions are the active imports.

### Subpath Deployment

Everything is configured for `/hivemind/` subpath:
- Vite: `base: '/hivemind/'`
- Express: serves static at configurable `BASE_PATH` (defaults to `/hivemind`)
- Client routing: wouter `Router base={BASE_PATH}`
- API URLs: `buildApiUrl()` prepends the base path

### Type System

Types are in `client/src/types/hexmind.ts` — comprehensive definitions for `HexNode`, `ViewState`, `NodeType`, `SessionData`, etc. Includes type guards (`isHexNode`, `isNodeMap`, `isViewState`, `isSessionData`) for runtime validation.

**Node types**: root, concept, action, technical, question, risk, default — each with distinct colors and icons.

### State Persistence

- **Sessions**: saved to `localStorage` under `hivemind_sessions` key
- **Autosave**: automatic save to `hivemind_autosave` key
- **Export/Import**: JSON file download/upload via `SessionManagerModal`

### Path Aliases

```
"@"       → client/src/
"@shared" → shared/
"@assets" → attached_assets/
```

Defined in both `tsconfig.json` (for type checking) and `vite.config.ts` (for bundling).

### Bundle Splitting

Manual chunks configured in `vite.config.ts`:
- `ui-primitives` — all Radix UI components
- `vendor-heavy` — react-markdown
- `icons` — lucide-react

Bundle analysis: `dist/bundle-stats.html` generated on build via rollup-plugin-visualizer.

## Key Considerations

- **HiveMindApp.tsx is 4000+ lines** — use `@geepers_scalpel` for edits; further hook extraction is ongoing
- **Duplicate model constant** — `GEMINI_TEXT_MODEL` defined in both `HiveMindApp.tsx:117` and `useAIGeneration.ts:16`
- **Legacy .jsx modals** — `BuildArtifactModal.jsx`, `DeepDiveModal.jsx`, `SessionManagerModal.jsx` coexist with their `.tsx` replacements
- **wouter patch** — `patches/wouter@3.7.1.patch` exists for routing fixes
- **`shared/const.ts`** — re-exported by `client/src/const.ts`; contains cookie/auth constants from a Manus platform origin
- **Touch handling** — canvas interactions support both mouse and touch (pinch-zoom via touch distance tracking)
