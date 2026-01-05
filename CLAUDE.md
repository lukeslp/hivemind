# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HexMind is a spatial brainstorming tool using AI-powered hexagonal grid expansion. Users click nodes to generate 6 contextual neighbors via Google Gemini API. The app uses React 19 + Vite + Express with a "Cyber-Hive" dark mode aesthetic.

**Live URL**: `https://dr.eamer.dev/hexmind/`
**Port**: 5057 (production service)

## Commands

```bash
# Development
pnpm dev              # Start Vite dev server (port 3000)
pnpm build            # Build frontend + bundle server
pnpm start            # Run production server

# Code Quality
pnpm check            # TypeScript type check (tsc --noEmit)
pnpm format           # Prettier formatting

# Service Management (production)
sm restart hexmind    # Restart the production service
sm logs hexmind       # View service logs
```

## Architecture

### Directory Structure
```
client/src/
├── pages/HexMindApp.tsx    # Main app (2000+ lines, all core logic)
├── components/ui/          # shadcn/ui components
├── lib/templates.ts        # Build artifact templates
└── contexts/ThemeContext   # Dark mode provider

server/index.ts             # Express static server (subpath: /hexmind/)
```

### Core Patterns

**Single-File Architecture**: Almost all logic lives in `HexMindApp.tsx`:
- Hexagonal coordinate system (axial q,r coordinates)
- AI generation via `generateNeighbors()` → Gemini API
- State: 27+ useState hooks (nodes, viewState, history, modals, etc.)
- Canvas: SVG hexagons with pan/zoom via transform

**Key Functions** (in HexMindApp.tsx):
- `generateNeighbors(node, forceRefresh?)` - AI expand (lines ~930-1084)
- `handleDeepDive(node)` - Detailed AI analysis
- `handleNodeClick(key, node)` - Click behavior
- `hexToPixel(q, r)` - Coordinate conversion
- `commitNodes(newNodes)` - State + history push

**Node Types**: root, concept, action, technical, question, risk, default

### API Integration

Direct Gemini API calls in browser (API key in component):
```typescript
const API_KEY = "AIzaSyDK7CD5KMlhrjjJ75_Z8fdRde0ER2FnSpA";
// Uses gemini-2.5-flash-preview model
```

### Build Configuration

Vite configured for subpath deployment:
- `base: '/hexmind/'` in vite.config.ts
- Express mounts static at `/hexmind` path
- wouter Router uses `base={BASE_PATH}` for client routing

### Path Aliases
```typescript
"@" → client/src/
"@shared" → shared/
"@assets" → attached_assets/
```

## Known Considerations

- **Large Component**: HexMindApp.tsx is 2000+ lines - consider extracting hooks
- **State Management**: Many useState calls could benefit from useReducer or custom hooks
- **Viewport Culling**: `visibleNodes` filtering exists but renders all visible nodes
- **Touch Events**: Conditional handlers based on `isTouchDevice` detection
