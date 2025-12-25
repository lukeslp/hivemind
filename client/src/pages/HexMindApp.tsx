/*
 * HexMind - Spatial Brainstorming Tool
 * Design: Cyber-Hive Dark Mode
 * - Deep, immersive dark backgrounds
 * - Hexagonal geometry as foundational visual language
 * - Glassmorphic UI panels with blur and transparency
 * - Electric accent colors for node types
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Loader2,
  MousePointer2,
  Maximize2,
  Trash2,
  Zap,
  Layout,
  Info,
  RefreshCw,
  Pin,
  X,
  Edit3,
  FileText,
  Box,
  HelpCircle,
  Lightbulb,
  Activity,
  Terminal,
  Save,
  Camera,
  Scissors,
  Crosshair,
  FolderOpen,
  Thermometer,
  Search,
  Undo2,
  Redo2,
  ChevronDown,
  Target,
  Sparkles,
  BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- Constants & Config ---
const HEX_SIZE = 80;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;
const API_KEY = "AIzaSyDK7CD5KMlhrjjJ75_Z8fdRde0ER2FnSpA";

// Hex Directions
const DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

// Node Types with styling
const NODE_TYPES: Record<
  string,
  {
    id: string;
    label: string;
    color: string;
    border: string;
    bg: string;
    icon: React.ElementType;
  }
> = {
  root: {
    id: "root",
    label: "Core",
    color: "text-yellow-400",
    border: "stroke-yellow-500",
    bg: "fill-yellow-500/10",
    icon: Zap,
  },
  concept: {
    id: "concept",
    label: "Concept",
    color: "text-amber-400",
    border: "stroke-amber-500",
    bg: "fill-amber-500/10",
    icon: Lightbulb,
  },
  action: {
    id: "action",
    label: "Action",
    color: "text-rose-400",
    border: "stroke-rose-500",
    bg: "fill-rose-500/10",
    icon: Activity,
  },
  technical: {
    id: "technical",
    label: "Technical",
    color: "text-cyan-400",
    border: "stroke-cyan-500",
    bg: "fill-cyan-500/10",
    icon: Terminal,
  },
  question: {
    id: "question",
    label: "Question",
    color: "text-purple-400",
    border: "stroke-purple-500",
    bg: "fill-purple-500/10",
    icon: HelpCircle,
  },
  risk: {
    id: "risk",
    label: "Risk",
    color: "text-red-500",
    border: "stroke-red-600",
    bg: "fill-red-500/10",
    icon: Target,
  },
  default: {
    id: "default",
    label: "Node",
    color: "text-slate-400",
    border: "stroke-slate-500",
    bg: "fill-slate-500/10",
    icon: Box,
  },
};

const BUILD_TEMPLATES = [
  {
    label: "Project Proposal",
    prompt:
      "Write a comprehensive project proposal based on these ideas. Include Executive Summary, Objectives, Methodology, and Timeline.",
  },
  {
    label: "SWOT Analysis",
    prompt:
      "Perform a SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats) based on the mapped concepts.",
  },
  {
    label: "User Stories",
    prompt:
      "Generate a list of Agile User Stories with Acceptance Criteria based on the features and actions in this map.",
  },
  {
    label: "Code Architecture",
    prompt:
      "Design a high-level software architecture and file structure for a system implementing these technical nodes.",
  },
  {
    label: "Risk Assessment",
    prompt:
      "Identify potential risks, bottlenecks, and unknowns from the map and suggest mitigation strategies.",
  },
  {
    label: "Email Update",
    prompt:
      "Draft a professional email to stakeholders summarizing the key outcomes of this brainstorming session.",
  },
];

// Types
interface HexNode {
  q: number;
  r: number;
  text: string;
  description?: string;
  type: string;
  depth: number;
  parentId?: string | null;
  pinned: boolean;
}

interface ViewState {
  x: number;
  y: number;
  zoom: number;
}

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
}

// --- Helper Components ---
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-neutral-400 text-sm">
            Are you sure you want to proceed? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`bg-neutral-900 border-white/10 ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto custom-scrollbar flex-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default function HexMindApp() {
  // --- State ---
  const [nodes, setNodes] = useState<Record<string, HexNode>>({});
  const [loadingNode, setLoadingNode] = useState<string | null>(null);
  const [rootInput, setRootInput] = useState("");
  const [viewState, setViewState] = useState<ViewState>({ x: 0, y: 0, zoom: 0.8 });
  const [creativity, setCreativity] = useState(0.5);
  const [visibleNodes, setVisibleNodes] = useState<Record<string, HexNode>>({});

  // Undo/Redo
  const [history, setHistory] = useState<Record<string, HexNode>[]>([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HexNode[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [touchDistance, setTouchDistance] = useState(0);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs for state tracking during async ops
  const nodesRef = useRef(nodes);

  // Modals
  const [deepDiveContent, setDeepDiveContent] = useState<string | null>(null);
  const [isDeepDiveLoading, setIsDeepDiveLoading] = useState(false);
  const [deepDiveTitle, setDeepDiveTitle] = useState("");

  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [buildPrompt, setBuildPrompt] = useState("");
  const [buildResult, setBuildResult] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: "",
    onConfirm: () => {},
  });

  // Viewport culling effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibleNodes = () => {
      const newVisibleNodes: Record<string, HexNode> = {};
      const { width, height } = container.getBoundingClientRect();

      for (const key in nodes) {
        const node = nodes[key];
        const { x, y } = hexToPixel(node.q, node.r);
        const screenX = viewState.x + x * viewState.zoom;
        const screenY = viewState.y + y * viewState.zoom;

        if (
          screenX > -HEX_WIDTH * viewState.zoom &&
          screenX < width + HEX_WIDTH * viewState.zoom &&
          screenY > -HEX_HEIGHT * viewState.zoom &&
          screenY < height + HEX_HEIGHT * viewState.zoom
        ) {
          newVisibleNodes[key] = node;
        }
      }
      setVisibleNodes(newVisibleNodes);
    };

    updateVisibleNodes();

    const debouncedUpdate = setTimeout(updateVisibleNodes, 100);
    return () => clearTimeout(debouncedUpdate);
  }, [nodes, viewState]);

  // Update ref when nodes change
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // --- Undo/Redo Logic ---
  const commitNodes = (newNodes: Record<string, HexNode>) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newNodes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setNodes(newNodes);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow key navigation
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        if (!selectedNodeId) {
          setSelectedNodeId("0,0");
          return;
        }
        const currentNode = nodes[selectedNodeId];
        if (!currentNode) return;

        const ARROW_DIRECTIONS: Record<string, { q: number; r: number }> = {
          ArrowUp: { q: 0, r: -1 },
          ArrowDown: { q: 0, r: 1 },
          ArrowLeft: { q: -1, r: 0 },
          ArrowRight: { q: 1, r: 0 },
        };

        const dir = ARROW_DIRECTIONS[e.key];
        if (!dir) return;

        const nQ = currentNode.q + dir.q;
        const nR = currentNode.r + dir.r;
        const neighborKey = getNodeKey(nQ, nR);

        if (nodes[neighborKey]) {
          setSelectedNodeId(neighborKey);
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, selectedNodeId, nodes]);

  // --- Geometry ---
  const hexToPixel = (q: number, r: number) => {
    const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = HEX_SIZE * ((3 / 2) * r);
    return { x, y };
  };

  const getNodeKey = (q: number, r: number) => `${q},${r}`;

  // --- Search Logic ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }
    const results = Object.values(nodes).filter(
      (n) =>
        n.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
  }, [searchQuery, nodes]);

  const cycleSearch = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    const target = searchResults[nextIndex];

    // Jump to target
    const { x, y } = hexToPixel(target.q, target.r);
    setViewState((prev) => ({
      ...prev,
      x: -x + window.innerWidth / 2,
      y: -y + window.innerHeight / 2,
    }));
    setSelectedNodeId(getNodeKey(target.q, target.r));
  };

  // --- AI Functions ---
  const generateNeighbors = async (centerNode: HexNode, forceRefresh = false) => {
    const key = getNodeKey(centerNode.q, centerNode.r);
    if (loadingNode) return;
    setLoadingNode(key);

    const tempDesc =
      creativity < 0.3
        ? "Logical, concrete, and safe"
        : creativity > 0.7
          ? "Wild, abstract, and out-of-the-box"
          : "Balanced and creative";
    const systemPrompt = `You are a brainstorming engine. Style: ${tempDesc}.
    Given a central idea, generate 6 distinct related nodes.
    Types: concept, action, technical, question, risk.
    Return JSON: { "branches": [{ "title": "...", "description": "...", "type": "..." }] }`;

    const userQuery = `Center: "${centerNode.text}" (${centerNode.description || ""})`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const branches = text ? JSON.parse(text).branches : [];

      const currentNodes = nodesRef.current;
      const newNodes = { ...currentNodes };

      DIRECTIONS.forEach((dir, i) => {
        const nQ = centerNode.q + dir.q;
        const nR = centerNode.r + dir.r;
        const neighborKey = getNodeKey(nQ, nR);
        const existing = newNodes[neighborKey];
        const shouldUpdate =
          !existing || (forceRefresh && !existing.pinned && existing.parentId === key);

        if (shouldUpdate && branches[i]) {
          newNodes[neighborKey] = {
            q: nQ,
            r: nR,
            text: branches[i].title,
            description: branches[i].description,
            type: branches[i].type.toLowerCase(),
            depth: (centerNode.depth || 0) + 1,
            parentId: key,
            pinned: false,
          };
        }
      });
      commitNodes(newNodes);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setLoadingNode(null);
    }
  };

  const handleDeepDive = async (node: HexNode) => {
    setDeepDiveTitle(node.text);
    setDeepDiveContent(null);
    setIsDeepDiveLoading(true);

    const prompt = `Deep Dive into: "${node.text}". Context: ${node.description}. Type: ${node.type}.
    Provide a detailed Markdown response appropriate for this type.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const result = await response.json();
      setDeepDiveContent(
        result.candidates?.[0]?.content?.parts?.[0]?.text || "No content."
      );
    } catch {
      setDeepDiveContent("Error generating content.");
    } finally {
      setIsDeepDiveLoading(false);
    }
  };

  const handleAgentBuild = async () => {
    if (!buildPrompt.trim()) return;
    setIsBuilding(true);
    setBuildResult("");

    const context = Object.values(nodes)
      .map((n) => `- [${n.type}] ${n.text}: ${n.description}`)
      .join("\n");
    const prompt = `Context:\n${context}\n\nUser Request: ${buildPrompt}\n\nDetermine the best format and generate it in Markdown.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const result = await response.json();
      setBuildResult(
        result.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to build."
      );
    } catch {
      setBuildResult("Error building artifact.");
    } finally {
      setIsBuilding(false);
    }
  };

  // --- Graph Management ---
  const pruneNode = (key: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Node?",
      onConfirm: () => {
        const nodesToDelete = new Set([key]);
        let sizeBefore = 0;

        do {
          sizeBefore = nodesToDelete.size;
          Object.entries(nodes).forEach(([k, n]) => {
            if (n.parentId && nodesToDelete.has(n.parentId)) nodesToDelete.add(k);
          });
        } while (nodesToDelete.size > sizeBefore);

        const newNodes = { ...nodes };
        nodesToDelete.forEach((k) => delete newNodes[k]);
        commitNodes(newNodes);
        setSelectedNodeId(null);
      },
    });
  };

  const refocusNode = (targetNode: HexNode) => {
    const dq = targetNode.q;
    const dr = targetNode.r;

    const newNodes: Record<string, HexNode> = {};
    Object.entries(nodes).forEach(([, node]) => {
      const newQ = node.q - dq;
      const newR = node.r - dr;
      let newParentId: string | null = null;
      if (node.parentId) {
        const pNode = nodes[node.parentId];
        if (pNode) newParentId = `${pNode.q - dq},${pNode.r - dr}`;
      }
      newNodes[`${newQ},${newR}`] = {
        ...node,
        q: newQ,
        r: newR,
        parentId: newParentId,
      };
    });

    commitNodes(newNodes);
    setViewState({ x: 0, y: 0, zoom: 1 });
    setSelectedNodeId("0,0");
  };

  // --- Interaction Handlers ---
  const startBrainstorm = (initialIdea = rootInput) => {
    if (!initialIdea.trim()) return;
    const firstNode: HexNode = {
      q: 0,
      r: 0,
      text: initialIdea,
      description: "Root Idea",
      depth: 0,
      pinned: true,
      type: "root",
    };
    commitNodes({ "0,0": firstNode });
    setRootInput("");
    setViewState({ x: 0, y: 0, zoom: 1 });
    generateNeighbors(firstNode);
    setSelectedNodeId("0,0");
    setShowWelcome(false);
  };

  const handleManualAdd = (parentNode: HexNode) => {
    for (const dir of DIRECTIONS) {
      const nQ = parentNode.q + dir.q;
      const nR = parentNode.r + dir.r;
      const key = getNodeKey(nQ, nR);
      if (!nodes[key]) {
        const newNode: HexNode = {
          q: nQ,
          r: nR,
          text: "New Idea",
          description: "Manual node",
          type: "concept",
          depth: parentNode.depth + 1,
          parentId: getNodeKey(parentNode.q, parentNode.r),
          pinned: false,
        };
        commitNodes({ ...nodes, [key]: newNode });
        setEditingNodeId(key);
        setEditTitle(newNode.text);
        setEditDesc(newNode.description || "");
        setSelectedNodeId(key);
        return;
      }
    }
    alert("No space around this node!");
  };

  const updateNodeType = (key: string, newType: string) => {
    const node = nodes[key];
    if (!node) return;
    commitNodes({ ...nodes, [key]: { ...node, type: newType } });
    setShowTypeSelector(false);
  };

  const handleNodeClick = (key: string, node: HexNode) => {
    setSelectedNodeId(key);
    setShowTypeSelector(false);

    const hasChildren = DIRECTIONS.some((dir) => {
      const nQ = node.q + dir.q;
      const nR = node.r + dir.r;
      const nKey = getNodeKey(nQ, nR);
      const neighbor = nodes[nKey];
      return neighbor && neighbor.parentId === key;
    });

    if (hasChildren) {
      setConfirmModal({
        isOpen: true,
        title: "Refresh Idea?",
        onConfirm: () => generateNeighbors(node, true),
      });
    } else {
      generateNeighbors(node);
    }
  };

  // Canvas Interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest(".interactive-ui"))
      return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - viewState.x, y: e.clientY - viewState.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewState((prev) => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".interactive-ui")) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX - viewState.x,
        y: e.touches[0].clientY - viewState.y,
      };
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setTouchDistance(Math.sqrt(dx * dx + dy * dy));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setViewState((prev) => ({
        ...prev,
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y,
      }));
    }
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newTouchDistance = Math.sqrt(dx * dx + dy * dy);
      const scale = newTouchDistance / touchDistance;
      setViewState((prev) => ({
        ...prev,
        zoom: Math.min(Math.max(prev.zoom * scale, 0.1), 3),
      }));
      setTouchDistance(newTouchDistance);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchDistance(0);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setViewState((prev) => ({
      ...prev,
      zoom: Math.min(Math.max(prev.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.1), 3),
    }));
  };

  const exportAsImage = () => {
    const svgContent = document.getElementById("hex-canvas-layer")?.innerHTML;
    if (!svgContent) return;
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000" viewBox="-1000 -1000 2000 2000"><style>text { font-family: sans-serif; fill: white; } path { stroke: gray; fill: #222; }</style><g transform="translate(0,0)">${svgContent}</g></svg>`;
    const blob = new Blob([fullSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hexmind-export-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Prioritize Hovered Node for Info Panel
  const activeNode = nodes[hoveredNodeId || ""] || nodes[selectedNodeId || ""];

  return (
    <div className="flex flex-col w-full h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none relative">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between pointer-events-none">
        {/* Left Actions */}
        <div
          aria-label="Main Controls"
          className="interactive-ui bg-neutral-900/90 backdrop-blur border border-white/10 p-2 px-4 rounded-xl flex items-center gap-2 sm:gap-4 pointer-events-auto shadow-2xl"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="font-bold hidden sm:inline">HexMind</span>
          </div>
          <div className="h-6 w-px bg-white/10" />

          {Object.keys(nodes).length === 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 uppercase tracking-widest">
                New Board
              </span>
              <button
                onClick={() => setShowWelcome(true)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBuildModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <FileText className="w-3 h-3" /> Build
              </button>

              <button
                onClick={exportAsImage}
                className="p-2 hover:bg-white/10 text-neutral-300 rounded-lg"
                title="Export SVG"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Undo/Redo */}
              <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  className="p-2 hover:bg-white/10 text-neutral-300 rounded-lg disabled:opacity-30"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex === history.length - 1}
                  className="p-2 hover:bg-white/10 text-neutral-300 rounded-lg disabled:opacity-30"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>

              {/* Search Toggle */}
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className={`p-2 rounded-lg transition-colors ${isSearchOpen ? "bg-white/20 text-white" : "hover:bg-white/10 text-neutral-300"}`}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search Bar (Floating) */}
        {isSearchOpen && (
          <div className="interactive-ui pointer-events-auto absolute top-20 left-4 z-30 bg-neutral-900/90 backdrop-blur border border-white/10 p-2 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 w-64 shadow-xl">
            <Search className="w-4 h-4 text-neutral-500 ml-2" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && cycleSearch()}
              placeholder="Find idea..."
              className="bg-transparent border-none text-sm text-white placeholder:text-neutral-500"
            />
            {searchResults.length > 0 && (
              <span className="text-[10px] text-neutral-500 whitespace-nowrap px-2">
                {currentSearchIndex + 1}/{searchResults.length}
              </span>
            )}
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-1 hover:text-white text-neutral-500"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Right Controls */}
        <div
          aria-label="View Controls"
          className="flex items-center gap-2 pointer-events-auto interactive-ui"
        >
          {/* Creativity */}
          <div className="bg-neutral-900/90 backdrop-blur border border-white/10 p-2 rounded-xl flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-400" />
            <Slider
              value={[creativity]}
              onValueChange={(v) => setCreativity(v[0])}
              min={0}
              max={1}
              step={0.1}
              className="w-16 sm:w-20"
            />
          </div>

          <button
            onClick={() => setViewState({ x: 0, y: 0, zoom: 0.8 })}
            className="p-3 bg-neutral-900/90 border border-white/10 rounded-xl hover:bg-white/5"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredNodeId(null);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.zoom})`,
            transformOrigin: "center",
          }}
        >
          {/* Center wrapper for positioning */}
          <div className="absolute top-1/2 left-1/2" id="hex-canvas-layer">
            {/* Nodes Layer */}
            {Object.entries(visibleNodes).map(([key, node]) => {
              const { x, y } = hexToPixel(node.q, node.r);
              const style = NODE_TYPES[node.type] || NODE_TYPES.default;
              const Icon = style.icon;
              const isSelected = selectedNodeId === key;
              const isHovered = hoveredNodeId === key;
              const isLoading = loadingNode === key;

              // Search Dimming
              const isDimmed =
                searchQuery &&
                !node.text.toLowerCase().includes(searchQuery.toLowerCase());

              return (
                <div
                  key={key}
                  style={{
                    left: x,
                    top: y,
                    width: HEX_WIDTH,
                    height: HEX_HEIGHT,
                    transform: "translate(-50%, -50%)",
                    zIndex: isSelected ? 20 : 10,
                  }}
                  className={`absolute group transition-all duration-300 ${isDimmed ? "opacity-20 grayscale" : "opacity-100"}`}
                  onMouseEnter={() => setHoveredNodeId(key)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeClick(key, node);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleDeepDive(node);
                    }}
                    className={`
                      relative w-full h-full cursor-pointer flex items-center justify-center p-4 text-center
                      transition-transform duration-300
                      ${isHovered ? "scale-110" : "hover:scale-105"}
                      ${isLoading ? "animate-pulse" : ""}
                    `}
                  >
                    <svg
                      className="absolute inset-0 w-full h-full drop-shadow-xl"
                      viewBox="0 0 173.2 200"
                    >
                      <path
                        d="M86.6 0L173.2 50V150L86.6 200L0 150V50L86.6 0Z"
                        className={`
                          transition-all duration-300
                          ${
                            node.pinned
                              ? "text-neutral-800 stroke-amber-400 stroke-[4]"
                              : isSelected
                                ? `text-neutral-800 ${style.border} stroke-[3]`
                                : `text-neutral-900/90 stroke-neutral-700 stroke-[1]`
                          }
                          ${style.bg}
                        `}
                        fill="currentColor"
                      />
                    </svg>

                    <div className="relative z-10 flex flex-col items-center gap-0.5 pointer-events-none">
                      {isLoading ? (
                        <Loader2 className={`w-5 h-5 animate-spin ${style.color}`} />
                      ) : (
                        <>
                          <Icon className={`w-3.5 h-3.5 mb-1 ${style.color} opacity-80`} />
                          <span
                            className={`text-[9px] font-bold leading-3 line-clamp-2 uppercase tracking-wide px-1 ${node.pinned ? "text-white" : "text-neutral-300"}`}
                          >
                            {node.text}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {Object.keys(nodes).length === 0 && (
              <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-neutral-600 pointer-events-none">
                <Layout className="w-16 h-16 mb-4 opacity-10" />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* WELCOME MODAL */}
      <Modal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        title="Welcome to HexMind"
      >
        <div className="flex flex-col gap-6 text-center">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full" />
              <Zap className="w-16 h-16 text-yellow-400 relative z-10" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Ignite Your Brainstorming
            </h2>
            <p className="text-neutral-400">
              HexMind uses AI to generate an infinite web of connected ideas. Enter
              a seed concept below, then click tiles to expand your hive.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-3">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
              Quick Tips
            </h3>
            <ul className="text-sm text-neutral-300 space-y-2">
              <li className="flex items-center gap-2">
                <MousePointer2 className="w-4 h-4 text-indigo-400" /> Click any hex
                to generate neighbors
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Double-click for a
                Deep Dive analysis
              </li>
              <li className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-green-400" /> Pin nodes to keep them
                safe from regeneration
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              value={rootInput}
              onChange={(e) => setRootInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startBrainstorm()}
              placeholder="e.g. Sustainable Coffee Shop, Cyberpunk RPG, Mars Colony..."
              className="w-full bg-neutral-800 border-white/10 text-center text-lg text-white placeholder:text-neutral-600"
              autoFocus
            />
            <Button
              onClick={() => startBrainstorm()}
              disabled={!rootInput.trim()}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 text-lg"
            >
              Launch Hive
            </Button>
          </div>
        </div>
      </Modal>

      {/* Floating Info Panel */}
      {activeNode && (
        <div
          aria-label="Node Information Panel"
          className="interactive-ui absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 w-[calc(100vw-2rem)] sm:w-80 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
          <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div
              className={`h-1.5 w-full ${(NODE_TYPES[activeNode.type] || NODE_TYPES.default).bg.replace("fill-", "bg-").replace("/10", "")}`}
            />

            {editingNodeId === (selectedNodeId || hoveredNodeId) ? (
              <div className="p-4 flex flex-col gap-3">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-neutral-800 border-white/10 text-sm font-bold text-white"
                  autoFocus
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="bg-neutral-800 border border-white/10 rounded-md p-2 text-xs text-neutral-300 h-20 resize-none outline-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (editingNodeId) {
                        commitNodes({
                          ...nodes,
                          [editingNodeId]: {
                            ...nodes[editingNodeId],
                            text: editTitle,
                            description: editDesc,
                          },
                        });
                      }
                      setEditingNodeId(null);
                    }}
                    className="flex-1 bg-green-600 text-white"
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setEditingNodeId(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-5 relative">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    {/* Type Selector Trigger */}
                    <button
                      onClick={() => setShowTypeSelector(!showTypeSelector)}
                      className="flex items-center gap-1 hover:bg-white/5 p-1 -ml-1 rounded transition-colors group"
                    >
                      {(() => {
                        const TIcon =
                          (NODE_TYPES[activeNode.type] || NODE_TYPES.default).icon;
                        return (
                          <TIcon
                            className={`w-4 h-4 ${(NODE_TYPES[activeNode.type] || NODE_TYPES.default).color}`}
                          />
                        );
                      })()}
                      <ChevronDown className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400" />
                    </button>

                    <h3 className="font-bold text-lg text-white leading-tight">
                      {activeNode.text}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-neutral-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Type Selector Dropdown */}
                {showTypeSelector && (
                  <div className="absolute top-12 left-5 z-40 bg-neutral-800 border border-white/10 rounded-xl shadow-xl p-2 grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95">
                    {Object.values(NODE_TYPES).map((type) => (
                      <button
                        key={type.id}
                        onClick={() =>
                          updateNodeType(selectedNodeId || hoveredNodeId || "", type.id)
                        }
                        className={`flex items-center gap-2 p-2 rounded hover:bg-white/10 text-xs ${activeNode.type === type.id ? "bg-white/10 text-white" : "text-neutral-400"}`}
                      >
                        <type.icon className={`w-3 h-3 ${type.color}`} />
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                  {activeNode.description || "No description."}
                </p>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() =>
                      commitNodes({
                        ...nodes,
                        [selectedNodeId || hoveredNodeId || ""]: {
                          ...activeNode,
                          pinned: !activeNode.pinned,
                        },
                      })
                    }
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${activeNode.pinned ? "bg-amber-500/20 border-amber-500 text-amber-200" : "bg-white/5 border-transparent text-neutral-400 hover:bg-white/10"}`}
                  >
                    <Pin className="w-4 h-4 mb-1" />{" "}
                    <span className="text-[9px] uppercase font-bold">Pin</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingNodeId(selectedNodeId || hoveredNodeId);
                      setEditTitle(activeNode.text);
                      setEditDesc(activeNode.description || "");
                    }}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 text-neutral-400 hover:bg-white/10 transition-all"
                  >
                    <Edit3 className="w-4 h-4 mb-1" />{" "}
                    <span className="text-[9px] uppercase font-bold">Edit</span>
                  </button>
                  <button
                    onClick={() => handleManualAdd(activeNode)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 text-neutral-400 hover:bg-white/10 transition-all"
                  >
                    <Plus className="w-4 h-4 mb-1" />{" "}
                    <span className="text-[9px] uppercase font-bold">Add</span>
                  </button>
                  <button
                    onClick={() => handleDeepDive(activeNode)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
                  >
                    <BookOpen className="w-4 h-4 mb-1" />{" "}
                    <span className="text-[9px] uppercase font-bold">Deep</span>
                  </button>
                </div>

                {/* Graph Management Tools */}
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => refocusNode(activeNode)}
                    className="flex items-center justify-center gap-1 p-2 rounded-xl bg-white/5 text-neutral-400 hover:bg-white/10 transition-all text-[9px] uppercase font-bold"
                    title="Re-root map here"
                  >
                    <Crosshair className="w-3 h-3" /> Focus
                  </button>
                  <button
                    onClick={() => pruneNode(selectedNodeId || hoveredNodeId || "")}
                    className="flex items-center justify-center gap-1 p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-[9px] uppercase font-bold"
                  >
                    <Scissors className="w-3 h-3" /> Prune
                  </button>
                  <button
                    onClick={() => generateNeighbors(activeNode, true)}
                    className="flex items-center justify-center gap-1 p-2 rounded-xl bg-white/5 text-neutral-400 hover:bg-white/10 transition-all text-[9px] uppercase font-bold"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={!!deepDiveContent || isDeepDiveLoading}
        onClose={() => setDeepDiveContent(null)}
        title={deepDiveTitle}
      >
        {isDeepDiveLoading ? (
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{deepDiveContent || ""}</ReactMarkdown>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={buildModalOpen}
        onClose={() => {
          setBuildModalOpen(false);
          setBuildResult("");
          setBuildPrompt("");
        }}
        title="Build Artifact"
        maxWidth="max-w-4xl"
      >
        <div className="flex flex-col h-[60vh]">
          {!buildResult && !isBuilding && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                  Quick Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUILD_TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setBuildPrompt(t.prompt)}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-white transition-all"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Custom Prompt
                </label>
                <textarea
                  value={buildPrompt}
                  onChange={(e) => setBuildPrompt(e.target.value)}
                  placeholder="Describe exactly what you need..."
                  className="w-full flex-1 bg-neutral-800 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleAgentBuild}
                  disabled={!buildPrompt}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  <Zap className="w-4 h-4 mr-2" /> Generate
                </Button>
              </div>
            </div>
          )}
          {isBuilding && (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
              <p className="text-neutral-400 animate-pulse">
                Constructing artifact...
              </p>
            </div>
          )}
          {buildResult && (
            <>
              <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 rounded-lg border border-white/10 custom-scrollbar mb-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{buildResult}</ReactMarkdown>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setBuildResult("");
                    setIsBuilding(false);
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(buildResult);
                  }}
                  className="bg-indigo-600"
                >
                  <Save className="w-4 h-4 mr-2" /> Copy
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
      />
    </div>
  );
}
