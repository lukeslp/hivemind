# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HiveMind is a spatial brainstorming tool using hexagonal grid expansion. Users click nodes to generate 6 contextual neighbors via Google Gemini API. React 19 + Vite + Express with a "Cyber-Hive" dark mode aesthetic.

**Live URL**: `https://dr.eamer.dev/hivemind/`
**GitHub**: hexmind (canonical name differs from local directory)
**Port**: 5057 (production, via `PORT=5057` in service manager)

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

**No tests**: vitest is in devDependencies but no test script or test files exist yet.

## Architecture

### File Structure

`client/src/` has a `pages/` subdirectory:
- `pages/HiveMindApp.tsx` — the main canvas component (~4100 lines); see below
- `pages/Home.tsx` — splash/landing page
- `pages/NotFound.tsx` — 404 page
- `App.tsx` — wouter router that wires pages together
- `contexts/ThemeContext.tsx` — theme provider (wraps next-themes)

`lib/` utilities beyond `api.ts` and `icons.ts`:
- `templates.ts` — built-in brainstorm starter templates
- `utils.ts` — cn() helper and misc utilities

### Two Large Files

`pages/HiveMindApp.tsx` (~4100 lines) and `components/HexCanvas.tsx` (~720 lines) are the two largest files. Use `@geepers_scalpel` for surgical edits to either. The main component orchestrates 10 extracted hooks plus handles keyboard shortcuts, node selection/editing, toolbar UI, settings panel, template loading, and all modal state.

### Hook-Extraction Pattern

Hooks in `client/src/hooks/`:

| Hook | Purpose |
|------|---------|
| `useAIGeneration` | Gemini API calls for neighbor expansion + deep dive node analysis |
| `useNodeManagement` | CRUD, session persistence (localStorage), filtering, clusters |
| `useHistory` | Generic undo/redo stack (max 50 entries) |
| `useCanvasInteraction` | Pan/zoom/drag for mouse and touch events (pinch-zoom via touch distance) |
| `useSearch` | Node search with result cycling |
| `useAnnouncer` | ARIA live region announcements (WCAG 4.1.3) |
| `useAccessibilityLabels` | ARIA label generation for nodes and toolbar |
| `useComposition` | IME composition state for controlled text inputs |
| `useMobile` | Breakpoint detection (768px threshold) |
| `usePersistFn` | Stable ref wrapper for callbacks (avoids stale closure issues) |

### Hexagonal Coordinate System

Uses **axial coordinates** (q, r) with pointy-top hexagons. Node keys are `"q,r"` strings.

```
HEX_SIZE = 80px
HEX_WIDTH = sqrt(3) * 80  ≈ 138.6px
HEX_HEIGHT = 2 * 80       = 160px
```

6 neighbor directions: East(+1,0), NE(+1,-1), NW(0,-1), West(-1,0), SW(-1,1), SE(0,+1)

Coordinate conversion functions `hexToPixel(q,r)` and `pixelToHex(x,y)` are defined in `HiveMindApp.tsx` (not yet extracted).

### API Proxy Architecture

The Gemini API key is **not** in the client. The Express server (`server/index.ts`) proxies requests:

- `POST /api/generate` — text generation (neighbor expansion, deep dive)
- `POST /api/generate-image` — image generation (same Gemini endpoint)

Both proxy to `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`. Rate limited to 100 req/15min per IP. The client uses `buildApiUrl()` from `@/lib/api` which reads `import.meta.env.BASE_URL` to construct the correct subpath-aware URL.

Environment: `GEMINI_API_KEY` in `.env`, loaded by the server via `dotenv`.

Model: `gemini-3-flash-preview` (duplicated — see Key Considerations).

The server mounts the API router at both `/api` and `${basePath}/api` so requests work whether accessed directly or through the Caddy reverse proxy.

### Lazy-Loaded Modals

Five modals, four code-split with `React.lazy()`:
- `BuildArtifactModal` — generates documents/artifacts from brainstorm
- `DeepDiveModal` — asks Gemini for a detailed analysis of a node
- `SessionManagerModal` — save/load/export sessions
- `ImageGenerationModal` — Gemini image generation per node
- `KeyboardShortcutsModal` — keyboard shortcut reference (not lazy-loaded)

Legacy `.jsx` versions of the first three modals coexist with active `.tsx` replacements.

### Subpath Deployment

Everything is configured for `/hivemind/` subpath:
- Vite: `base: '/hivemind/'`
- Express: serves static at configurable `BASE_PATH` env var (defaults to `/hivemind`)
- Client routing: wouter `Router base={BASE_PATH}` (derived from `import.meta.env.BASE_URL`)
- API URLs: `buildApiUrl()` in `client/src/lib/api.ts` prepends the base path

### Type System

Types are in `client/src/types/hexmind.ts` — `HexNode`, `ViewState`, `NodeType`, `SessionData`, etc. Includes type guards (`isHexNode`, `isNodeMap`, `isViewState`, `isSessionData`) for runtime validation.

**Node types**: root, concept, action, technical, question, risk, default — each with distinct colors and icons defined in `NODE_TYPES` (see duplication note below).

### Icon Barrel File

All lucide-react imports go through `client/src/lib/icons.ts`, a barrel file that re-exports only used icons for tree-shaking. Import from `@/lib/icons`, not directly from `lucide-react`.

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

Manual chunks in `vite.config.ts`:
- `ui-primitives` — all Radix UI components
- `vendor-heavy` — react-markdown
- `icons` — lucide-react

Bundle analysis: `dist/bundle-stats.html` generated on build via rollup-plugin-visualizer.

## Key Considerations

- **HiveMindApp.tsx is ~4100 lines** — use `@geepers_scalpel` for edits; further hook extraction is ongoing
- **HexCanvas.tsx is ~720 lines** — the SVG rendering component, also benefits from scalpel edits
- **Duplicate `NODE_TYPES`** — the full node type config (colors, icons, labels) is defined independently in both `HexCanvas.tsx` and `HiveMindApp.tsx`
- **Duplicate `GEMINI_TEXT_MODEL`** — defined in both `HiveMindApp.tsx` and `useAIGeneration.ts`
- **Legacy .jsx modals** — `BuildArtifactModal.jsx`, `DeepDiveModal.jsx`, `SessionManagerModal.jsx` coexist with their `.tsx` replacements; the `.jsx` files are dead code
- **`useCanvasInteraction.js`** — a legacy `.js` version coexists with the active `.ts` version; same situation as the modal duplicates, `.js` is dead code
- **wouter patch** — `patches/wouter@3.7.1.patch` exists for routing fixes (package.json specifies `wouter@^3.3.5`, so the patch applies to the resolved version)
- **`shared/const.ts`** — re-exported by `client/src/const.ts`; contains cookie/auth constants from a Manus platform origin (vestigial)
- **Manus platform artifacts** — `allowedHosts` in `vite.config.ts` includes Manus domains, `ManusDialog.tsx` exists, `vite-plugin-manus-runtime` is in devDependencies; all are vestigial from the original platform but harmless
- **`HexNode` defined in two places** — canonical types in `types/hexmind.ts`, but `useAIGeneration.ts` has its own inline `HexNode` interface rather than importing from types
- **`sensor_playground/`** — a standalone Python Flask experiment (unrelated to the main app); ignore it
- **`GEMINI.md`** — placeholder monorepo crosslink file, not Gemini-specific documentation
