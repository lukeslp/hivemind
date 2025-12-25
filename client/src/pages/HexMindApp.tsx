/*
 * HexMind - Spatial Brainstorming Tool
 * Design: Cyber-Hive Dark Mode
 * - Deep, immersive dark backgrounds
 * - Hexagonal geometry as foundational visual language
 * - Glassmorphic UI panels with blur and transparency
 * - Electric accent colors for node types
 * - Flow-state ideation with minimal interruptions
 * - Direct manipulation paradigm
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  Loader2,
  MousePointer2,
  Maximize2,
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
  Thermometer,
  Search,
  Undo2,
  Redo2,
  ChevronDown,
  Target,
  Sparkles,
  BookOpen,
  Trash2,
  Map,
  Merge,
  Download,
  Upload,
  FolderOpen,
  Eye,
  EyeOff,
  Clock,
  Keyboard,
  Filter,
  Share2,
  Link,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { TEMPLATES, TEMPLATE_CATEGORIES, Template } from "@/lib/templates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- Constants & Config ---
const HEX_SIZE = 80;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;
const API_KEY = "AIzaSyDK7CD5KMlhrjjJ75_Z8fdRde0ER2FnSpA";
const STORAGE_KEY = "hexmind_sessions";
const AUTOSAVE_KEY = "hexmind_autosave";

// Hex Directions (pointy-top hexagon neighbors)
const DIRECTIONS = [
  { q: 1, r: 0 },   // East
  { q: 1, r: -1 },  // Northeast
  { q: 0, r: -1 },  // Northwest
  { q: -1, r: 0 },  // West
  { q: -1, r: 1 },  // Southwest
  { q: 0, r: 1 },   // Southeast
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
    bgSolid: string;
    icon: React.ElementType;
  }
> = {
  root: {
    id: "root",
    label: "Core",
    color: "text-yellow-400",
    border: "stroke-yellow-500",
    bg: "fill-yellow-500/20",
    bgSolid: "#facc15",
    icon: Zap,
  },
  concept: {
    id: "concept",
    label: "Concept",
    color: "text-amber-400",
    border: "stroke-amber-500",
    bg: "fill-amber-500/20",
    bgSolid: "#f59e0b",
    icon: Lightbulb,
  },
  action: {
    id: "action",
    label: "Action",
    color: "text-rose-400",
    border: "stroke-rose-500",
    bg: "fill-rose-500/20",
    bgSolid: "#f43f5e",
    icon: Activity,
  },
  technical: {
    id: "technical",
    label: "Technical",
    color: "text-cyan-400",
    border: "stroke-cyan-500",
    bg: "fill-cyan-500/20",
    bgSolid: "#22d3ee",
    icon: Terminal,
  },
  question: {
    id: "question",
    label: "Question",
    color: "text-purple-400",
    border: "stroke-purple-500",
    bg: "fill-purple-500/20",
    bgSolid: "#a78bfa",
    icon: HelpCircle,
  },
  risk: {
    id: "risk",
    label: "Risk",
    color: "text-red-500",
    border: "stroke-red-600",
    bg: "fill-red-500/20",
    bgSolid: "#ef4444",
    icon: Target,
  },
  default: {
    id: "default",
    label: "Node",
    color: "text-slate-400",
    border: "stroke-slate-500",
    bg: "fill-slate-500/20",
    bgSolid: "#64748b",
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
  message: string;
  onConfirm: () => void;
}

// --- Helper Components ---
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-white/10 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-neutral-400 text-sm">{message}</p>
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

// Minimap Component - shows overview of entire graph
const Minimap = ({
  nodes,
  viewState,
  containerSize,
  onNavigate,
  selectedNodeId,
}: {
  nodes: Record<string, HexNode>;
  viewState: ViewState;
  containerSize: { width: number; height: number };
  onNavigate: (x: number, y: number) => void;
  selectedNodeId: string | null;
}) => {
  const minimapRef = useRef<HTMLDivElement>(null);
  const MINIMAP_SIZE = 160;
  const MINIMAP_PADDING = 10;

  // Calculate bounds of all nodes
  const nodeKeys = Object.keys(nodes);
  if (nodeKeys.length === 0) return null;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  nodeKeys.forEach(key => {
    const node = nodes[key];
    const x = HEX_SIZE * (Math.sqrt(3) * node.q + (Math.sqrt(3) / 2) * node.r);
    const y = HEX_SIZE * ((3 / 2) * node.r);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  const graphWidth = maxX - minX + HEX_WIDTH * 2;
  const graphHeight = maxY - minY + HEX_HEIGHT * 2;
  const scale = Math.min(
    (MINIMAP_SIZE - MINIMAP_PADDING * 2) / graphWidth,
    (MINIMAP_SIZE - MINIMAP_PADDING * 2) / graphHeight,
    0.15
  );

  // Viewport rectangle
  const vpWidth = (containerSize.width / viewState.zoom) * scale;
  const vpHeight = (containerSize.height / viewState.zoom) * scale;
  const vpX = MINIMAP_SIZE / 2 - (viewState.x / viewState.zoom) * scale - vpWidth / 2;
  const vpY = MINIMAP_SIZE / 2 - (viewState.y / viewState.zoom) * scale - vpHeight / 2;

  const handleMinimapClick = (e: React.MouseEvent) => {
    const rect = minimapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left - MINIMAP_SIZE / 2;
    const clickY = e.clientY - rect.top - MINIMAP_SIZE / 2;
    const worldX = -clickX / scale * viewState.zoom;
    const worldY = -clickY / scale * viewState.zoom;
    onNavigate(worldX, worldY);
  };

  return (
    <div
      ref={minimapRef}
      className="bg-neutral-900/90 backdrop-blur border border-white/10 rounded-xl overflow-hidden cursor-crosshair shadow-xl"
      style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
      onClick={handleMinimapClick}
    >
      <svg width={MINIMAP_SIZE} height={MINIMAP_SIZE}>
        {/* Nodes */}
        {nodeKeys.map(key => {
          const node = nodes[key];
          const x = HEX_SIZE * (Math.sqrt(3) * node.q + (Math.sqrt(3) / 2) * node.r);
          const y = HEX_SIZE * ((3 / 2) * node.r);
          const screenX = MINIMAP_SIZE / 2 + x * scale;
          const screenY = MINIMAP_SIZE / 2 + y * scale;
          const style = NODE_TYPES[node.type] || NODE_TYPES.default;
          const isSelected = key === selectedNodeId;
          
          return (
            <circle
              key={key}
              cx={screenX}
              cy={screenY}
              r={isSelected ? 4 : 2.5}
              className={`${isSelected ? 'fill-white' : style.color.replace('text-', 'fill-')}`}
              style={{ opacity: isSelected ? 1 : 0.7 }}
            />
          );
        })}
        
        {/* Viewport rectangle */}
        <rect
          x={vpX}
          y={vpY}
          width={vpWidth}
          height={vpHeight}
          fill="none"
          stroke="white"
          strokeWidth="1"
          strokeOpacity="0.5"
          rx="2"
        />
      </svg>
    </div>
  );
};

// Floating Action Bar - appears near selected/hovered node
const FloatingActionBar = ({
  node,
  nodeKey,
  position,
  onExpand,
  onRefresh,
  onPin,
  onEdit,
  onPrune,
  onDeepDive,
  onAdd,
  isLoading,
}: {
  node: HexNode;
  nodeKey: string;
  position: { x: number; y: number };
  onExpand: () => void;
  onRefresh: () => void;
  onPin: () => void;
  onEdit: () => void;
  onPrune: () => void;
  onDeepDive: () => void;
  onAdd: () => void;
  isLoading: boolean;
}) => {
  const style = NODE_TYPES[node.type] || NODE_TYPES.default;

  return (
    <div
      className="absolute z-50 pointer-events-auto interactive-ui animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.x,
        top: position.y - 60,
        transform: "translateX(-50%)",
      }}
    >
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl px-2 py-1.5 flex items-center gap-1">
        {/* Expand/Generate */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onExpand}
              disabled={isLoading}
              className={`p-2 rounded-full transition-all ${isLoading ? "opacity-50" : "hover:bg-white/10"} ${style.color}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Generate Ideas</TooltipContent>
        </Tooltip>

        {/* Refresh */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-400 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Regenerate</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-white/10" />

        {/* Pin */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onPin}
              className={`p-2 rounded-full transition-all ${node.pinned ? "bg-amber-500/20 text-amber-400" : "hover:bg-white/10 text-neutral-400"}`}
            >
              <Pin className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{node.pinned ? "Unpin" : "Pin"}</TooltipContent>
        </Tooltip>

        {/* Edit */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onEdit}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-400 transition-all"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>

        {/* Add Manual */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onAdd}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-400 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Add Node</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-white/10" />

        {/* Deep Dive */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onDeepDive}
              className="p-2 rounded-full hover:bg-indigo-500/20 text-indigo-400 transition-all"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Deep Dive</TooltipContent>
        </Tooltip>

        {/* Prune/Delete */}
        {node.type !== "root" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onPrune}
                className="p-2 rounded-full hover:bg-red-500/20 text-red-400 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
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
    message: "",
    onConfirm: () => {},
  });

  // Minimap
  const [showMinimap, setShowMinimap] = useState(true);

  // Drag-merge state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Saved sessions
  const [savedSessions, setSavedSessions] = useState<{ id: string; name: string; date: string; nodeCount: number }[]>([]);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessionName, setSessionName] = useState("");

  // Keyboard shortcuts modal
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<string | null>(null);

  // Template selection
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Viewport culling effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateVisibleNodes = () => {
      const newVisibleNodes: Record<string, HexNode> = {};
      const { width, height } = container.getBoundingClientRect();
      const padding = HEX_WIDTH * 2;

      for (const key in nodes) {
        const node = nodes[key];
        const { x, y } = hexToPixel(node.q, node.r);
        const screenX = width / 2 + viewState.x + x * viewState.zoom;
        const screenY = height / 2 + viewState.y + y * viewState.zoom;

        if (
          screenX > -padding &&
          screenX < width + padding &&
          screenY > -padding &&
          screenY < height + padding
        ) {
          newVisibleNodes[key] = node;
        }
      }
      setVisibleNodes(newVisibleNodes);
    };

    updateVisibleNodes();
  }, [nodes, viewState]);

  // Update ref when nodes change
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Load saved sessions list on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load sessions:", e);
    }
    // Load shared brainstorm from URL if present
    loadFromUrl();
  }, []);

  // Auto-save current session
  useEffect(() => {
    if (Object.keys(nodes).length > 0) {
      try {
        const autosave = {
          nodes,
          viewState,
          creativity,
          timestamp: Date.now(),
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosave));
      } catch (e) {
        console.error("Autosave failed:", e);
      }
    }
  }, [nodes, viewState, creativity]);

  // Auto-load is disabled - users must manually load sessions via the folder icon

  // --- Session Management ---
  const saveSession = (name: string) => {
    const sessionId = `session_${Date.now()}`;
    const session = {
      id: sessionId,
      name: name || `Session ${savedSessions.length + 1}`,
      date: new Date().toISOString(),
      nodeCount: Object.keys(nodes).length,
    };
    const sessionData = {
      nodes,
      viewState,
      creativity,
    };
    try {
      localStorage.setItem(sessionId, JSON.stringify(sessionData));
      const newSessions = [...savedSessions, session];
      setSavedSessions(newSessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    } catch (e) {
      console.error("Failed to save session:", e);
    }
  };

  const loadSession = (sessionId: string) => {
    try {
      const data = localStorage.getItem(sessionId);
      if (data) {
        const parsed = JSON.parse(data);
        setNodes(parsed.nodes);
        setViewState(parsed.viewState || { x: 0, y: 0, zoom: 0.8 });
        setCreativity(parsed.creativity || 0.5);
        setShowWelcome(false);
        setHistory([parsed.nodes]);
        setHistoryIndex(0);
        setShowSessionsModal(false);
      }
    } catch (e) {
      console.error("Failed to load session:", e);
    }
  };

  const loadAutosave = () => {
    try {
      const autosave = localStorage.getItem(AUTOSAVE_KEY);
      if (autosave) {
        const data = JSON.parse(autosave);
        if (data.nodes && Object.keys(data.nodes).length > 0) {
          setNodes(data.nodes);
          setViewState(data.viewState || { x: 0, y: 0, zoom: 0.8 });
          setCreativity(data.creativity || 0.5);
          setShowWelcome(false);
          setHistory([data.nodes]);
          setHistoryIndex(0);
          setShowSessionsModal(false);
        }
      }
    } catch (e) {
      console.error("Failed to load autosave:", e);
    }
  };

  const deleteSession = (sessionId: string) => {
    try {
      localStorage.removeItem(sessionId);
      const newSessions = savedSessions.filter(s => s.id !== sessionId);
      setSavedSessions(newSessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    } catch (e) {
      console.error("Failed to delete session:", e);
    }
  };

  const exportSession = () => {
    const data = {
      nodes,
      viewState,
      creativity,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hexmind_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSession = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.nodes) {
          setNodes(data.nodes);
          setViewState(data.viewState || { x: 0, y: 0, zoom: 0.8 });
          setCreativity(data.creativity || 0.5);
          setShowWelcome(false);
          setHistory([data.nodes]);
          setHistoryIndex(0);
        }
      } catch (err) {
        console.error("Failed to import session:", err);
      }
    };
    reader.readAsText(file);
  };

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
      // Escape to deselect
      if (e.key === "Escape") {
        setSelectedNodeId(null);
        setEditingNodeId(null);
        setShowKeyboardHelp(false);
      }
      // ? to show keyboard help
      if (e.key === "?" && !editingNodeId) {
        e.preventDefault();
        setShowKeyboardHelp(true);
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
      x: -x * prev.zoom,
      y: -y * prev.zoom,
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
    
    // Improved prompt to ensure exactly 6 branches
    const systemPrompt = `You are a brainstorming engine for a hexagonal mind map. Style: ${tempDesc}.
Given a central idea, you MUST generate EXACTLY 6 distinct related nodes to fill all hexagonal neighbors.
Each node should explore a different angle or aspect of the central idea.
Types available: concept, action, technical, question, risk.
Vary the types to create a diverse exploration.

IMPORTANT: You MUST return exactly 6 branches, no more, no less.

Return JSON: { "branches": [{ "title": "Short Title (2-4 words)", "description": "Brief explanation (1-2 sentences)", "type": "concept|action|technical|question|risk" }, ... ] }`;

    const userQuery = `Central idea: "${centerNode.text}"
Context: ${centerNode.description || "No additional context"}
Generate 6 diverse related ideas exploring different aspects.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { 
              responseMimeType: "application/json",
              temperature: 0.7 + (creativity * 0.6), // 0.7-1.3 based on creativity
            },
          }),
        }
      );

      const result = await response.json();
      console.log("=== API Response ===", result);
      
      if (!response.ok) {
        console.error("HTTP Error:", response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check for API errors
      if (result.error) {
        console.error("API Error:", result.error);
        throw new Error(result.error.message || "API request failed");
      }
      
      let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("=== Raw API text ===", text);
      
      if (!text) {
        console.error("No text in API response. Full result:", JSON.stringify(result, null, 2));
        throw new Error("API returned no content");
      }
      
      // Strip markdown code fences if present
      if (text) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      }
      
      console.log("Cleaned text:", text);
      let branches = [];
      
      try {
        const parsed = text ? JSON.parse(text) : {};
        branches = parsed.branches || [];
        console.log("Parsed branches:", branches);
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Cleaned text:", text);
        branches = [];
      }

      // Ensure we have exactly 6 branches by padding if needed
      const defaultTypes = ["concept", "action", "technical", "question", "risk", "concept"];
      while (branches.length < 6) {
        branches.push({
          title: `Idea ${branches.length + 1}`,
          description: `Related aspect of "${centerNode.text}"`,
          type: defaultTypes[branches.length % defaultTypes.length],
        });
      }

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
          const nodeType = branches[i].type?.toLowerCase() || "concept";
          const validType = NODE_TYPES[nodeType] ? nodeType : "concept";
          
          newNodes[neighborKey] = {
            q: nQ,
            r: nR,
            text: branches[i].title || `Idea ${i + 1}`,
            description: branches[i].description || "",
            type: validType,
            depth: (centerNode.depth || 0) + 1,
            parentId: key,
            pinned: false,
          };
        }
      });
      commitNodes(newNodes);
    } catch (error) {
      console.error("AI Error:", error);
      // On error, still populate with placeholder nodes
      const currentNodes = nodesRef.current;
      const newNodes = { ...currentNodes };
      const defaultTypes = ["concept", "action", "technical", "question", "risk", "concept"];
      
      DIRECTIONS.forEach((dir, i) => {
        const nQ = centerNode.q + dir.q;
        const nR = centerNode.r + dir.r;
        const neighborKey = getNodeKey(nQ, nR);
        const existing = newNodes[neighborKey];
        
        if (!existing) {
          newNodes[neighborKey] = {
            q: nQ,
            r: nR,
            text: `Explore ${i + 1}`,
            description: `Click to expand from "${centerNode.text}"`,
            type: defaultTypes[i],
            depth: (centerNode.depth || 0) + 1,
            parentId: key,
            pinned: false,
          };
        }
      });
      commitNodes(newNodes);
    } finally {
      setLoadingNode(null);
    }
  };

  const handleDeepDive = async (node: HexNode) => {
    setDeepDiveTitle(node.text);
    setDeepDiveContent(null);
    setIsDeepDiveLoading(true);

    const prompt = `Deep Dive Analysis: "${node.text}"

Context: ${node.description || "No additional context"}
Node Type: ${node.type}

Provide a comprehensive analysis in Markdown format including:
- Overview and significance
- Key considerations
- Potential approaches or solutions
- Related concepts to explore
- Questions to consider

Be thorough but concise.`;

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
        result.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated."
      );
    } catch {
      setDeepDiveContent("Error generating content. Please try again.");
    } finally {
      setIsDeepDiveLoading(false);
    }
  };

  const handleAgentBuild = async () => {
    if (!buildPrompt.trim()) return;
    setIsBuilding(true);
    setBuildResult("");

    const context = Object.values(nodes)
      .map((n) => `- [${n.type.toUpperCase()}] ${n.text}: ${n.description || "No description"}`)
      .join("\n");
    
    const prompt = `You are helping synthesize a brainstorming session into a useful artifact.

## Brainstorm Map Contents:
${context}

## User Request:
${buildPrompt}

## Instructions:
Generate a well-structured, professional document in Markdown format.
Use proper headings, lists, and formatting.
Be comprehensive but focused on the user's specific request.`;

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
        result.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate artifact."
      );
    } catch {
      setBuildResult("Error building artifact. Please try again.");
    } finally {
      setIsBuilding(false);
    }
  };

  // --- Graph Management ---
  const pruneNode = (key: string) => {
    const node = nodes[key];
    if (!node || node.type === "root") return;
    
    setConfirmModal({
      isOpen: true,
      title: "Delete Node?",
      message: `Delete "${node.text}" and all its children? This cannot be undone.`,
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

  // --- Node Merging ---
  const mergeNodes = (sourceKey: string, targetKey: string) => {
    const sourceNode = nodes[sourceKey];
    const targetNode = nodes[targetKey];
    if (!sourceNode || !targetNode || sourceKey === targetKey) return;

    // Merge: combine text and descriptions, keep target position
    const mergedNode: HexNode = {
      ...targetNode,
      text: `${targetNode.text} + ${sourceNode.text}`,
      description: [
        targetNode.description,
        sourceNode.description,
        `Merged from: ${sourceNode.text}`,
      ].filter(Boolean).join('\n\n'),
      pinned: targetNode.pinned || sourceNode.pinned,
    };

    // Update children of source to point to target
    const newNodes = { ...nodes };
    Object.entries(newNodes).forEach(([key, node]) => {
      if (node.parentId === sourceKey) {
        newNodes[key] = { ...node, parentId: targetKey };
      }
    });

    // Remove source, update target
    delete newNodes[sourceKey];
    newNodes[targetKey] = mergedNode;

    commitNodes(newNodes);
    setSelectedNodeId(targetKey);
    setDraggedNodeId(null);
    setDropTargetId(null);
  };

  // --- Interaction Handlers ---
  const startBrainstorm = (initialIdea = rootInput) => {
    if (!initialIdea.trim()) return;
    const firstNode: HexNode = {
      q: 0,
      r: 0,
      text: initialIdea,
      description: "The central idea of this brainstorm",
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

  const loadTemplate = (template: Template) => {
    // Convert template nodes to HexNode format
    const newNodes: Record<string, HexNode> = {};
    template.nodes.forEach((tNode) => {
      const key = getNodeKey(tNode.q, tNode.r);
      newNodes[key] = {
        q: tNode.q,
        r: tNode.r,
        text: tNode.text,
        description: tNode.description,
        type: tNode.type === "concept" && tNode.depth === 0 ? "root" : tNode.type,
        depth: tNode.depth,
        pinned: tNode.isPinned || false,
      };
    });
    
    commitNodes(newNodes);
    setViewState({ x: 0, y: 0, zoom: 1 });
    setSelectedNodeId("0,0");
    setShowTemplates(false);
  };

  // Share functions
  const generateShareUrl = () => {
    const data = {
      nodes,
      viewState,
      creativity,
    };
    const compressed = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(compressed)}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(shareData)));
        if (decoded.nodes && Object.keys(decoded.nodes).length > 0) {
          commitNodes(decoded.nodes);
          if (decoded.viewState) setViewState(decoded.viewState);
          if (decoded.creativity !== undefined) setCreativity(decoded.creativity);
          setShowWelcome(false);
        }
      } catch (e) {
        console.error('Failed to load shared brainstorm:', e);
      }
    }
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
          description: "Click to edit",
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
    // All neighbors occupied - show message
  };

  const handleNodeClick = (key: string, node: HexNode) => {
    // Check if this node has already generated neighbors
    const hasNeighbors = DIRECTIONS.some(dir => {
      const neighborKey = getNodeKey(node.q + dir.q, node.r + dir.r);
      return nodes[neighborKey] !== undefined;
    });

    if (hasNeighbors || loadingNode === key) {
      // Node already expanded or is generating - just select it to show action bar
      setSelectedNodeId(key);
    } else {
      // First click on unexpanded node - auto-generate neighbors
      setSelectedNodeId(key);
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

  const exportAsPNG = () => {
    const svgContent = document.getElementById("hex-canvas-layer")?.innerHTML;
    if (!svgContent) return;
    
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000" viewBox="-1000 -1000 2000 2000"><style>text { font-family: sans-serif; fill: white; } path { stroke: gray; fill: #222; }</style><g transform="translate(0,0)">${svgContent}</g></svg>`;
    
    const canvas = document.createElement('canvas');
    canvas.width = 2000;
    canvas.height = 2000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Fill background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 2000, 2000);
    
    const img = new Image();
    const svgBlob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `hexmind-export-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
      });
    };
    
    img.src = url;
  };

  // Get active node and its screen position for floating action bar
  const activeNodeKey = selectedNodeId || hoveredNodeId;
  const activeNode = activeNodeKey ? nodes[activeNodeKey] : null;
  
  const getNodeScreenPosition = (node: HexNode) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const { width, height } = container.getBoundingClientRect();
    const { x, y } = hexToPixel(node.q, node.r);
    return {
      x: width / 2 + viewState.x + x * viewState.zoom,
      y: height / 2 + viewState.y + y * viewState.zoom,
    };
  };

  // Calculate connection lines between parent-child nodes
  const connectionLines = Object.entries(visibleNodes)
    .filter(([, node]) => node.parentId && nodes[node.parentId])
    .map(([key, node]) => {
      const parent = nodes[node.parentId!];
      const childPos = hexToPixel(node.q, node.r);
      const parentPos = hexToPixel(parent.q, parent.r);
      const style = NODE_TYPES[node.type] || NODE_TYPES.default;
      return {
        key,
        x1: parentPos.x,
        y1: parentPos.y,
        x2: childPos.x,
        y2: childPos.y,
        color: style.bgSolid,
      };
    });

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

              <div className="flex items-center gap-1">
                <button
                  onClick={exportAsPNG}
                  className="p-2 hover:bg-white/10 text-neutral-300 rounded-lg"
                  title="Export PNG"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  onClick={exportAsImage}
                  className="p-2 hover:bg-white/10 text-neutral-300 rounded-lg text-xs"
                  title="Export SVG"
                >
                  SVG
                </button>
              </div>

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

              {/* Session Management */}
              <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowSessionsModal(true)}
                      className="p-2 hover:bg-white/10 text-neutral-300 rounded-lg"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Sessions</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={exportSession}
                      className="p-2 hover:bg-white/10 text-neutral-300 rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Export JSON</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="p-2 hover:bg-white/10 text-neutral-300 rounded-lg cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && importSession(e.target.files[0])}
                      />
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>Import JSON</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={generateShareUrl}
                      disabled={Object.keys(nodes).length === 0}
                      className="p-2 hover:bg-white/10 text-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Share Link</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </div>

        {/* Filter Panel (Floating) */}
        {filterType && (
          <div className="interactive-ui pointer-events-auto absolute top-20 right-4 z-30 bg-neutral-900/90 backdrop-blur border border-white/10 p-3 rounded-xl animate-in slide-in-from-top-2 shadow-xl">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Filter by Type</p>
            <div className="space-y-1">
              <button
                onClick={() => setFilterType(null)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm transition-colors text-white"
              >
                All Types
              </button>
              {Object.entries(NODE_TYPES).map(([key, type]) => {
                if (key === 'default') return null;
                const Icon = type.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setFilterType(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm transition-colors flex items-center gap-2 ${filterType === key ? 'bg-white/10' : ''}`}
                  >
                    <Icon className={`w-4 h-4 ${type.color}`} />
                    <span className="text-white">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFilterType(filterType ? null : 'all')}
                className={`p-3 bg-neutral-900/90 border border-white/10 rounded-xl transition-colors ${filterType ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Filter by Type</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-3 bg-neutral-900/90 border border-white/10 rounded-xl hover:bg-white/5"
              >
                <Keyboard className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Keyboard Shortcuts (?)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowMinimap(!showMinimap)}
                className={`p-3 bg-neutral-900/90 border border-white/10 rounded-xl transition-colors ${showMinimap ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <Map className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{showMinimap ? 'Hide Minimap' : 'Show Minimap'}</TooltipContent>
          </Tooltip>

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
            {/* Connection Lines Layer */}
            <svg
              className="absolute pointer-events-none"
              style={{
                left: 0,
                top: 0,
                overflow: "visible",
                width: 1,
                height: 1,
              }}
            >
              {connectionLines.map((line) => (
                <line
                  key={`line-${line.key}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.color}
                  strokeWidth={2}
                  strokeOpacity={0.3}
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {/* Nodes Layer */}
            {Object.entries(visibleNodes).map(([key, node]) => {
              const { x, y } = hexToPixel(node.q, node.r);
              const style = NODE_TYPES[node.type] || NODE_TYPES.default;
              const Icon = style.icon;
              const isSelected = selectedNodeId === key;
              const isHovered = hoveredNodeId === key;
              const isLoading = loadingNode === key;

              // Search and Filter Dimming
              const isDimmed =
                (searchQuery &&
                !node.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (filterType && filterType !== 'all' && node.type !== filterType);

              return (
                <div
                  key={key}
                  style={{
                    left: x,
                    top: y,
                    width: HEX_WIDTH,
                    height: HEX_HEIGHT,
                    transform: "translate(-50%, -50%)",
                    zIndex: isSelected ? 20 : isHovered ? 15 : 10,
                  }}
                  className={`absolute group transition-all duration-200 ${isDimmed ? "opacity-20 grayscale" : "opacity-100"}`}
                  onMouseEnter={() => setHoveredNodeId(key)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                      <div
                        draggable={!node.pinned && node.type !== 'root'}
                        onDragStart={(e) => {
                          if (node.pinned || node.type === 'root') {
                            e.preventDefault();
                            return;
                          }
                          setDraggedNodeId(key);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggedNodeId(null);
                          setDropTargetId(null);
                        }}
                        onDragOver={(e) => {
                          if (draggedNodeId && draggedNodeId !== key) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            setDropTargetId(key);
                          }
                        }}
                        onDragLeave={() => {
                          if (dropTargetId === key) setDropTargetId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedNodeId && draggedNodeId !== key) {
                            mergeNodes(draggedNodeId, key);
                          }
                        }}
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
                          transition-transform duration-200
                          ${isSelected ? "scale-110" : isHovered ? "scale-105" : ""}
                          ${isLoading ? "animate-pulse" : ""}
                          ${draggedNodeId === key ? "opacity-50 scale-95" : ""}
                          ${dropTargetId === key ? "ring-4 ring-indigo-500 ring-opacity-75 scale-110" : ""}
                        `}
                      >
                        <svg
                          className="absolute inset-0 w-full h-full drop-shadow-lg"
                          viewBox="0 0 173.2 200"
                        >
                          <path
                            d="M86.6 0L173.2 50V150L86.6 200L0 150V50L86.6 0Z"
                            className={`
                              transition-all duration-200
                              ${
                                node.pinned
                                  ? "fill-neutral-800 stroke-amber-400 stroke-[4]"
                                  : isSelected
                                    ? `fill-neutral-800 ${style.border} stroke-[3]`
                                    : isHovered
                                      ? `fill-neutral-850 ${style.border} stroke-[2]`
                                      : `fill-neutral-900 stroke-neutral-700 stroke-[1]`
                              }
                            `}
                          />
                          {/* Inner glow for selected/hovered */}
                          {(isSelected || isHovered) && (
                            <path
                              d="M86.6 10L163.2 55V145L86.6 190L10 145V55L86.6 10Z"
                              className={`${style.bg} stroke-none`}
                            />
                          )}
                        </svg>

                        <div className="relative z-10 flex flex-col items-center gap-1 pointer-events-none px-3 max-w-[140px]">
                          {isLoading ? (
                            <Loader2 className={`w-6 h-6 animate-spin ${style.color}`} />
                          ) : (
                            <>
                              <Icon className={`w-4 h-4 ${style.color} opacity-90 shrink-0`} />
                              <span
                                className={`text-[11px] font-bold leading-tight line-clamp-3 uppercase tracking-wide text-center ${node.pinned ? "text-white" : "text-neutral-200"}`}
                                style={{ wordBreak: 'break-word' }}
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

        {/* Floating Action Bar */}
        {activeNode && selectedNodeId && !editingNodeId && (
          <FloatingActionBar
            node={activeNode}
            nodeKey={activeNodeKey!}
            position={getNodeScreenPosition(activeNode)}
            onExpand={() => generateNeighbors(activeNode)}
            onRefresh={() => generateNeighbors(activeNode, true)}
            onPin={() => {
              commitNodes({
                ...nodes,
                [activeNodeKey!]: { ...activeNode, pinned: !activeNode.pinned },
              });
            }}
            onEdit={() => {
              setEditingNodeId(activeNodeKey);
              setEditTitle(activeNode.text);
              setEditDesc(activeNode.description || "");
            }}
            onPrune={() => pruneNode(activeNodeKey!)}
            onDeepDive={() => handleDeepDive(activeNode)}
            onAdd={() => handleManualAdd(activeNode)}
            isLoading={loadingNode === activeNodeKey}
          />
        )}
      </main>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingNodeId}
        onClose={() => setEditingNodeId(null)}
        title="Edit Node"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
              Title
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-neutral-800 border-white/10 text-white"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full bg-neutral-800 border border-white/10 rounded-md p-3 text-sm text-neutral-300 h-24 resize-none outline-none focus:border-indigo-500"
            />
          </div>
          
          {/* Type Selector */}
          {editingNodeId && nodes[editingNodeId] && (
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">
                Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(NODE_TYPES).filter(t => t.id !== 'default').map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      if (editingNodeId) {
                        commitNodes({
                          ...nodes,
                          [editingNodeId]: { ...nodes[editingNodeId], type: type.id },
                        });
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      nodes[editingNodeId]?.type === type.id
                        ? "bg-white/10 border-white/30 text-white"
                        : "bg-white/5 border-transparent text-neutral-400 hover:bg-white/10"
                    }`}
                  >
                    <type.icon className={`w-4 h-4 ${type.color}`} />
                    <span className="text-xs">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setEditingNodeId(null)}>
              Cancel
            </Button>
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
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

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
                <MousePointer2 className="w-4 h-4 text-indigo-400" /> Hover to see details, click to auto-expand
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Double-click for a
                Deep Dive analysis
              </li>
              <li className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-green-400" /> Pin nodes to protect them
                from regeneration
              </li>
              <li className="flex items-center gap-2">
                <Merge className="w-4 h-4 text-cyan-400" /> Drag a node onto another
                to merge ideas
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
            <div className="flex gap-2">
              <Button
                onClick={() => startBrainstorm()}
                disabled={!rootInput.trim()}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 text-lg"
              >
                Launch Hive
              </Button>
              <Button
                onClick={() => {
                  setShowWelcome(false);
                  setShowTemplates(true);
                }}
                variant="outline"
                className="px-6 py-3 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              >
                <Layout className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-neutral-500 text-center">
              Or choose from pre-built templates →
            </p>
          </div>
        </div>
      </Modal>

      {/* Rich Hover Panel - Shows full node details on hover */}
      {hoveredNodeId && nodes[hoveredNodeId] && hoveredNodeId !== selectedNodeId && (
        <div 
          className="fixed bottom-4 right-4 z-50 w-[400px] max-h-[calc(100vh-120px)] overflow-y-auto pointer-events-none animate-in slide-in-from-bottom-2 duration-200"
          onMouseEnter={() => setHoveredNodeId(hoveredNodeId)}
        >
          <div className="bg-neutral-900/98 backdrop-blur-xl border-2 border-white/20 rounded-2xl shadow-2xl p-6 pointer-events-auto">
            {/* Header with close button */}
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold text-white pr-8">{nodes[hoveredNodeId].text}</h2>
              <button
                onClick={() => setHoveredNodeId(null)}
                className="text-neutral-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Node Type Badge */}
              <div className="flex items-center gap-3">
                {(() => {
                  const node = nodes[hoveredNodeId];
                  const style = NODE_TYPES[node.type] || NODE_TYPES.default;
                  const Icon = style.icon;
                  return (
                    <>
                      <div className={`p-3 rounded-xl ${style.bg} ${style.border} border-2`}>
                        <Icon className={`w-6 h-6 ${style.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{node.type.toUpperCase()}</p>
                        <p className="text-xs text-neutral-500">Depth: {node.depth}</p>
                      </div>
                    </>
                  );
                })()}
                {nodes[hoveredNodeId].pinned && (
                  <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50">
                    <Pin className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-400 font-bold">PINNED</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Description</h4>
                <p className="text-base text-neutral-200 leading-relaxed">
                  {nodes[hoveredNodeId].description || "No description available."}
                </p>
              </div>

              {/* Node Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 mb-2 font-semibold">Coordinates</p>
                  <p className="text-lg font-mono text-white font-bold">
                    q: {nodes[hoveredNodeId].q}, r: {nodes[hoveredNodeId].r}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-neutral-500 mb-2 font-semibold">Neighbors</p>
                  <p className="text-lg font-mono text-white font-bold">
                    {DIRECTIONS.filter(dir => {
                      const nKey = getNodeKey(nodes[hoveredNodeId].q + dir.q, nodes[hoveredNodeId].r + dir.r);
                      return nodes[nKey] !== undefined;
                    }).length} / 6
                  </p>
                </div>
              </div>

              {/* Action Hints */}
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 rounded-xl p-5">
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3">Quick Actions</p>
                <ul className="text-sm text-neutral-200 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                    <strong>Click</strong> to expand and generate neighbors
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                    <strong>Double-click</strong> for deep dive analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div>
                    <strong>Drag</strong> onto another node to merge ideas
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={!!deepDiveContent || isDeepDiveLoading}
        onClose={() => setDeepDiveContent(null)}
        title={`Deep Dive: ${deepDiveTitle}`}
        maxWidth="max-w-3xl"
      >
        {isDeepDiveLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-4" />
            <p className="text-neutral-400">Analyzing...</p>
          </div>
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
        message={confirmModal.message}
      />

      {/* Sessions Modal */}
      <Modal
        isOpen={showSessionsModal}
        onClose={() => setShowSessionsModal(false)}
        title="Saved Sessions"
      >
        <div className="flex flex-col gap-4">
          {/* Load Autosave */}
          {(() => {
            try {
              const autosave = localStorage.getItem(AUTOSAVE_KEY);
              if (autosave) {
                const data = JSON.parse(autosave);
                if (data.nodes && Object.keys(data.nodes).length > 0) {
                  return (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-amber-400">Auto-saved Session</p>
                          <p className="text-xs text-neutral-400">
                            {Object.keys(data.nodes).length} nodes • Last saved: {new Date(data.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={loadAutosave}
                          className="bg-amber-600 hover:bg-amber-500 text-white"
                          size="sm"
                        >
                          <Clock className="w-4 h-4 mr-2" /> Recover
                        </Button>
                      </div>
                    </div>
                  );
                }
              }
            } catch (e) {
              return null;
            }
            return null;
          })()}

          {/* Save Current */}
          <div className="flex gap-2">
            <Input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Session name..."
              className="flex-1 bg-neutral-800 border-white/10"
            />
            <Button
              onClick={() => {
                saveSession(sessionName);
                setSessionName("");
              }}
              disabled={Object.keys(nodes).length === 0}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
          </div>

          {/* Sessions List */}
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {savedSessions.length === 0 ? (
              <p className="text-neutral-500 text-center py-4">No saved sessions yet</p>
            ) : (
              savedSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{session.name}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(session.date).toLocaleDateString()} • {session.nodeCount} nodes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadSession(session.id)}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      Load
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSession(session.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Templates Modal */}
      <Modal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        title="Choose a Template"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                className={selectedCategory === cat.id ? "bg-yellow-500 text-black" : "border-white/10 text-neutral-300"}
                size="sm"
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {TEMPLATES
              .filter((t) => selectedCategory === "all" || t.category === selectedCategory)
              .map((template) => (
                <div
                  key={template.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-yellow-500/50 hover:bg-white/10 transition-all cursor-pointer group"
                  onClick={() => loadTemplate(template)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{template.icon}</div>
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-neutral-400">{template.description}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{template.nodes.length} nodes</span>
                        <span>•</span>
                        <span className="capitalize">{template.category.replace("-", " ")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <p className="text-sm text-neutral-500">
              Templates provide a structured starting point. You can expand and customize them freely.
            </p>
            <Button
              onClick={() => setShowTemplates(false)}
              variant="ghost"
              className="text-neutral-400"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Keyboard Shortcuts Modal */}
      <Modal
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
        title="Keyboard Shortcuts"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Navigation</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Move between nodes</span>
                <kbd className="px-2 py-1 bg-neutral-800 border border-white/20 rounded text-xs font-mono">Arrow Keys</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Deselect node</span>
                <kbd className="px-2 py-1 bg-neutral-800 border border-white/20 rounded text-xs font-mono">Esc</kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Actions</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Undo</span>
                <kbd className="px-2 py-1 bg-neutral-800 border border-white/20 rounded text-xs font-mono">Ctrl+Z</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Redo</span>
                <kbd className="px-2 py-1 bg-neutral-800 border border-white/20 rounded text-xs font-mono">Ctrl+Shift+Z</kbd>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Search</span>
                <kbd className="px-2 py-1 bg-neutral-800 border border-white/20 rounded text-xs font-mono">Ctrl+F</kbd>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Interactions</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Hover to see details</span>
                <span className="text-xs text-neutral-500">Mouse hover</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Click to auto-expand</span>
                <span className="text-xs text-neutral-500">Click node</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Double-click for Deep Dive</span>
                <span className="text-xs text-neutral-500">Double-click</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Drag to merge nodes</span>
                <span className="text-xs text-neutral-500">Drag & drop</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">View</h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Pan canvas</span>
                <span className="text-xs text-neutral-500">Click & drag</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Zoom in/out</span>
                <span className="text-xs text-neutral-500">Mouse wheel</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span className="text-sm">Pinch to zoom (mobile)</span>
                <span className="text-xs text-neutral-500">Two fingers</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Brainstorm">
        <div className="space-y-4">
          <p className="text-sm text-neutral-400">
            Share this link with others to let them view and continue your brainstorm:
          </p>
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1 bg-neutral-800 border-white/10 text-white font-mono text-sm"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button
              onClick={copyShareUrl}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="text-xs text-neutral-500 space-y-1">
            <p>💡 The link contains your entire brainstorm encoded in the URL</p>
            <p>🔒 No server storage - everything is client-side</p>
            <p>⚡ Recipients can view and expand your ideas</p>
          </div>
        </div>
      </Modal>

      {/* Minimap */}
      {showMinimap && Object.keys(nodes).length > 0 && containerRef.current && (
        <div className="absolute bottom-4 right-4 z-30 pointer-events-auto interactive-ui">
          <Minimap
            nodes={nodes}
            viewState={viewState}
            containerSize={{
              width: containerRef.current.clientWidth,
              height: containerRef.current.clientHeight,
            }}
            onNavigate={(x, y) => setViewState({ ...viewState, x, y })}
            selectedNodeId={selectedNodeId}
          />
        </div>
      )}
    </div>
  );
}
