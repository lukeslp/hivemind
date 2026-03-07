# HiveMind

> Spatial brainstorming tool that expands ideas on a hexagonal grid — click any node and an LLM generates 6 contextual neighbors.

Visual brainstorming on a hexagonal grid. Start with one idea, click to expand it into 6 contextual neighbors using a language model, and keep going until you've mapped out the entire problem space. Then export your map as a structured document — a project proposal, SWOT analysis, user stories, whatever you need.

The core brainstorming loop works well and sees regular use. There are still rough edges and the interaction patterns for non-linear thinking tools like this are an ongoing exploration, but it's been the most immediately adopted app I've made in this space. Contributions welcome.

## **[Try it live](https://dr.eamer.dev/hivemind/)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Live](https://img.shields.io/badge/live-dr.eamer.dev%2Fhivemind-cyan.svg)](https://dr.eamer.dev/hivemind/)

## How it works

You start with a single hex node — your core idea. Click it, and an LLM generates 6 related concepts, positioned as neighbors on the hex grid. Each neighbor gets a type (concept, action, technical, question, or risk) and a short description. Click any of those to expand further. After a few rounds, you've got a visual map of an idea space that would've taken much longer to brainstorm on paper.

The hex grid isn't just decoration — it naturally limits expansion to 6 directions per node, which keeps things focused. Linear brainstorming tools give you unlimited branches and you end up with a mess. Six neighbors forces the model to pick the most relevant angles.

<img width="2292" height="1480" alt="CleanShot 2026-03-06 at 11 30 57@2x" src="https://github.com/user-attachments/assets/d2b394c1-45a9-4428-acf3-ae29ce495fcb" />

### Node types

Each node is categorized by type, with distinct colors and icons:

| Type | What it represents |
|------|--------------------|
| **Root** | Your starting idea |
| **Concept** | An idea, theme, or abstract notion |
| **Action** | Something concrete to do |
| **Technical** | Implementation details, specs, tools |
| **Question** | Something that needs answering |
| **Risk** | A potential problem or obstacle |

The LLM assigns types automatically based on context, but you can change them manually.

<img width="2296" height="1478" alt="CleanShot 2026-03-06 at 11 28 41@2x" src="https://github.com/user-attachments/assets/9407a3f9-49c9-4a7b-bd03-f5ccea79612b" />

### Deep dive

Right-click (or long-press on mobile) any node for a deep-dive analysis. The LLM generates a detailed breakdown of that specific idea — useful when you want to explore one branch without expanding the whole grid.

<img width="2260" height="1458" alt="CleanShot 2026-03-06 at 11 30 15@2x" src="https://github.com/user-attachments/assets/df6993e6-4019-44b1-811f-a12a2afda23d" />

### Building from your map

Once your brainstorm has some substance, the **Build** feature turns your hex map into a structured document. Pick a template:

- **Project Proposal** — executive summary, objectives, methodology, timeline
- **SWOT Analysis** — strengths, weaknesses, opportunities, threats from your nodes
- **User Stories** — agile-format stories with acceptance criteria
- **Code Architecture** — system design and file structure
- **Risk Assessment** — mitigation strategies pulled from your risk nodes
- **Email Update** — stakeholder summary of your brainstorm

The builder sends your entire node map to the LLM with the template instructions and returns a markdown document you can copy out. It's surprisingly useful for turning a messy brainstorm into something you can actually share with people.

### Session management

Your brainstorms persist to localStorage automatically. You can also:

- Save named sessions and switch between them
- Export sessions as JSON files for backup or sharing
- Import sessions from JSON
- Undo/redo up to 50 steps

## Starter templates

Don't want to start from scratch? There are 12 built-in templates that pre-populate the first ring of nodes:

Product Launch, Novel Writing, Problem Solving, Business Strategy, Research Project, Content Strategy, App Design, Event Planning, Software Architecture, Personal Goal Planning, Learning Path, Creative Project

Each gives you a center node and 6 typed neighbors as a jumping-off point.

## Quick start

```bash
git clone https://github.com/lukeslp/hivemind.git
cd hivemind
pnpm install
cp .env.example .env   # add your LLM API key
pnpm dev               # http://localhost:3000
```

You'll need an API key for the language model backend. Currently uses Google's Gemini API (specifically `gemini-3-flash-preview`), but the proxy architecture means swapping models only requires changing the server — the client doesn't care.

## Stack

**Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI (shadcn/ui), Wouter

**Backend**: Express, proxies LLM requests server-side so the API key never hits the client

**Grid math**: Axial coordinate system (q, r) with pointy-top hexagons. Each node is keyed as `"q,r"`. The 6 neighbor directions are hardcoded offset vectors.

## Architecture

```
client/src/
├── pages/
│   └── HiveMindApp.tsx      # Main canvas + orchestration (~4100 lines, yeah it's big)
├── components/
│   ├── HexCanvas.tsx         # SVG hex grid rendering
│   ├── BuildArtifactModal    # Document generation from brainstorm
│   ├── DeepDiveModal         # Detailed node analysis
│   ├── SessionManagerModal   # Save/load/export
│   └── KeyboardShortcutsModal
├── hooks/                    # 10 extracted hooks
│   ├── useAIGeneration       # LLM API calls
│   ├── useNodeManagement     # CRUD + persistence
│   ├── useHistory            # Undo/redo (50 levels)
│   ├── useCanvasInteraction  # Pan, zoom, drag (mouse + touch)
│   ├── useSearch             # Node search with result cycling
│   └── useAnnouncer          # ARIA live region announcements
├── types/hexmind.ts          # TypeScript definitions + runtime type guards
└── lib/
    ├── templates.ts          # 12 starter templates
    └── icons.ts              # Lucide icon barrel file (tree-shaking)

server/
└── index.ts                  # Express proxy (rate-limited, 100 req/15 min)
```

The Express server proxies all LLM requests. The client calls `/api/generate` and the server forwards to the model API with the key attached. Rate-limited per IP.

## Keyboard shortcuts

Full keyboard navigation is built in — arrow keys to move between nodes, Enter to expand, and a bunch more. Hit `?` in the app to see the full reference.

## Accessibility

Targets WCAG 2.1 AA:

- ARIA labels on all interactive elements
- Live region announcements for node expansion and navigation
- Full keyboard navigation (no mouse required)
- Screen reader support with semantic structure
- Touch support: single-finger pan, pinch-to-zoom on mobile

## Performance

- Viewport culling — only visible nodes render, so maps with hundreds of nodes stay smooth
- Lazy-loaded modals — code-split with React.lazy()
- Manual chunk splitting for Radix UI, react-markdown, and lucide-react

## Development

```bash
pnpm dev        # Vite dev server with HMR
pnpm build      # Frontend + server → dist/
pnpm start      # Production server
pnpm check      # TypeScript type checking
pnpm format     # Prettier
```

## Status

Active development. The core brainstorming loop works well and sees regular use. Known issues:

- `HiveMindApp.tsx` is ~4100 lines and needs further decomposition
- Some type definitions are duplicated between files
- Legacy `.jsx` modal files coexist with their `.tsx` replacements (dead code, needs cleanup)
- Could use tests (vitest is installed, no tests written yet)

If you run into bugs or have ideas, [open an issue](https://github.com/lukeslp/hivemind/issues).

## License

MIT

## Author

**Luke Steuber** · [lukesteuber.com](https://lukesteuber.com) · [@lukesteuber.com](https://bsky.app/profile/lukesteuber.com) · [github.com/lukeslp](https://github.com/lukeslp)
