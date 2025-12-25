HexMind: Product Plan & Status Report

1. Executive Summary

HexMind is a spatial, non-linear brainstorming tool that leverages generative AI to expand ideas into an infinite hexagonal grid. Unlike traditional list-based or rigid mind-mapping tools, HexMind encourages organic exploration by visually connecting concepts, actions, and technical requirements in a "hive" structure. It bridges the gap between ideation and execution by including features to compile scattered thoughts into structured artifacts like project proposals and code architectures.

2. Current Status (v2.1)

Status: Advanced Beta / MVP
The application is fully functional as a single-page React application. It supports the complete loop of ideation, expansion, management, and export.

Core Capabilities (Implemented)

Infinite Canvas: Pan, zoom, and drag interface based on axial hexagonal geometry.

AI-Driven Expansion: Uses Google Gemini 2.5 Flash to generate 6 context-aware neighbors for any selected node.

Contextual Intelligence:

Deep Dive: Generates detailed reports (Markdown) for specific nodes upon double-click.

Agent Builder: Synthesizes the entire map context into specific artifacts (SWOT, User Stories, Emails) using templates.

Graph Management:

Pruning: Recursively delete entire branches of thought.

Re-rooting (Focus): Shift the grid center to a new node to pivot the brainstorm.

Undo/Redo: Full history stack for state management.

Categorization: 6 distinct node types (Core, Concept, Action, Technical, Question, Risk) with visual coding.

Persistence: Cloud save/load functionality via Firebase Firestore.

Navigation: Integrated search bar with zoom-to-target functionality.

Export: SVG Snapshot export for presentations.

3. User Experience & Design

Aesthetic: "Cyber/Hive" Dark Mode with glassmorphic UI elements (translucent panels, blurs).

Interaction Model:

Hover: Immediate preview of node details (title/description) in the Info Panel.

Click: Selects node and generates neighbors (with confirmation for refreshes).

Drag: Pan canvas.

Scroll: Zoom in/out.

4. Target Audience

Product Managers: For feature mapping, user story generation, and SWOT analysis.

Developers: For architectural planning (Technical nodes) and dependency mapping.

Writers/World Builders: For plot branching and lore generation.

Entrepreneurs: For business model generation and risk assessment.

5. Strategic Roadmap

Phase 1: Polish & Optimization (Immediate)

Mobile Optimization: Improve touch event handling (currently optimized for mouse) and responsive UI sizing for phones/tablets.

Accessibility: Add keyboard navigation for grid traversal (arrow keys to move selection).

Performance: Implement virtualization for the grid to support 500+ nodes without DOM lag.

Phase 2: Collaboration (Next Major Release)

Real-time Multiplayer: Use Firebase listeners to allow multiple users to expand the grid simultaneously.

User Presence: Show cursors or "active hexes" of other users.

Commenting: Allow users to attach sticky notes or comments to specific hexes.

Phase 3: Integration & Customization

Visual Themes: Add a "Whiteboard" (Light Mode) theme for corporate settings.

Manual Connections: Allow users to draw lines between non-adjacent hexes to link distant concepts.

External Integrations:

Export to Jira/Trello: Convert "Action" nodes into tickets.

Export to Notion: Convert "Deep Dives" into pages.

6. Technical Architecture

Frontend: React (Vite/CRA), Tailwind CSS.

Icons: Lucide-React.

AI Provider: Google Gemini API (gemini-2.5-flash-preview).

Backend/Storage: Firebase Auth (Anonymous + Custom Token), Firebase Firestore.

State Management: Local React State (useState, useRef) with History Stack for Undo/Redo.

7. Known Issues / Limitations

AI Rate Limits: Heavy usage of the "Build" or "Deep Dive" feature may hit API rate limits depending on the key tier.

Canvas Bounds: While "infinite," the DOM size can grow large; SVG export captures the current DOM layer, which might clip extremely large maps if not handled carefully.