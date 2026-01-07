/*
 * HiveMind - Spatial Brainstorming Tool
 * Design: Cyber-Hive Dark Mode
 * - Deep, immersive dark backgrounds
 * - Hexagonal geometry as foundational visual language
 * - Glassmorphic UI panels with blur and transparency
 * - Electric accent colors for node types
 * - Flow-state ideation with minimal interruptions
 * - Direct manipulation paradigm
 */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  ChevronRight,
  Image as ImageIcon,
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
  Settings,
  MapPin,
  Sun,
  Moon,
  Type,
  Volume2,
  VolumeX,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TEMPLATES, TEMPLATE_CATEGORIES, Template } from "@/lib/templates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useNodeLabel, useToolbarLabel, useModalLabel } from "@/hooks/useAccessibilityLabels";
import { useHiveMindAnnouncer } from "@/hooks/useAnnouncer";

// --- Constants & Config ---
const HEX_SIZE = 80;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;
// API key is now secured in backend - removed from client
const GEMINI_TEXT_MODEL = "gemini-3-flash-preview";  // Text generation & analysis
const GEMINI_IMAGE_MODEL = "gemini-2.0-flash-exp";   // Image generation (Nano Banana)
const STORAGE_KEY = "hivemind_sessions";
const AUTOSAVE_KEY = "hivemind_autosave";

// Cluster color palette for visual distinction
const CLUSTER_COLORS = [
  { stroke: "stroke-yellow-500", glow: "shadow-yellow-500/30", accent: "bg-yellow-500" },   // main cluster
  { stroke: "stroke-cyan-400", glow: "shadow-cyan-400/30", accent: "bg-cyan-400" },         // cluster 2
  { stroke: "stroke-pink-400", glow: "shadow-pink-400/30", accent: "bg-pink-400" },         // cluster 3
  { stroke: "stroke-emerald-400", glow: "shadow-emerald-400/30", accent: "bg-emerald-400" }, // cluster 4
  { stroke: "stroke-orange-400", glow: "shadow-orange-400/30", accent: "bg-orange-400" },   // cluster 5
  { stroke: "stroke-violet-400", glow: "shadow-violet-400/30", accent: "bg-violet-400" },   // cluster 6
];

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
  imageUrl?: string;
  videoUrl?: string;
  isKeyTheme?: boolean;
  clusterId?: string;       // Identifies which cluster this node belongs to
  isClusterRoot?: boolean;  // True for root nodes of each cluster
  contextPrompt?: string;   // Question to ask user before expanding (e.g., "What kind of cafe?")
  contextInfo?: string;     // Generic user notes for LLM context (replaces location)
  // Sprint 3: Enhanced artifacts
  codeSnippet?: {
    language: string;
    code: string;
  };
  visualization?: {
    type: 'chart' | 'map' | 'timeline' | 'diagram';
    data: any;
    config?: any;
  };
  linkedContext?: string[]; // Array of node keys for context transfer (Sprint 4)
  relatedNodeKeys?: string[];  // LLM-suggested distant connections
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

interface GenerationTracker {
  maxGenerationsPerSession: number;    // Maximum number of AI generations allowed per session
  generationCooldown: number;          // Cooldown in milliseconds between auto-expansions
  generationCount: number;             // Current count of generations in this session
  lastGenerationTime: number | null;   // Timestamp of last generation (for cooldown)
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
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">{message}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
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
  description,
  children,
  maxWidth = "max-w-lg",
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`bg-card border-border ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          {description && <DialogDescription className="text-muted-foreground">{description}</DialogDescription>}
          {!description && <DialogDescription className="sr-only">{title} dialog</DialogDescription>}
        </DialogHeader>
        <div className="overflow-y-auto custom-scrollbar flex-1">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

// Settings Modal Component
const SettingsModal = ({
  isOpen,
  onClose,
  theme,
  toggleTheme,
  creativity,
  setCreativity,
  fontSizeMultiplier,
  setFontSizeMultiplier,
  enableAnimations,
  setEnableAnimations,
  enableAutoSave,
  setEnableAutoSave,
  enableSoundEffects,
  setEnableSoundEffects,
  enableSmartExpansion,
  setEnableSmartExpansion,
}: {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  toggleTheme?: () => void;
  creativity: number;
  setCreativity: (value: number) => void;
  fontSizeMultiplier: number;
  setFontSizeMultiplier: (value: number) => void;
  enableAnimations: boolean;
  setEnableAnimations: (value: boolean) => void;
  enableAutoSave: boolean;
  setEnableAutoSave: (value: boolean) => void;
  enableSoundEffects: boolean;
  setEnableSoundEffects: (value: boolean) => void;
  enableSmartExpansion: boolean;
  setEnableSmartExpansion: (value: boolean) => void;
}) => {
  const fontSizeOptions = [
    { value: 0.85, label: "Small" },
    { value: 1.0, label: "Medium" },
    { value: 1.15, label: "Large" },
    { value: 1.3, label: "Extra Large" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Customize your HiveMind experience
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto custom-scrollbar flex-1 space-y-6 py-4">
          {/* Theme */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Theme
            </Label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="gap-2"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                Switch to {theme === "dark" ? "Light" : "Dark"}
              </Button>
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Type className="w-4 h-4" />
              Font Size
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {fontSizeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={fontSizeMultiplier === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFontSizeMultiplier(option.value)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Current: {(fontSizeMultiplier * 100).toFixed(0)}%
            </p>
          </div>

          {/* Creativity */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Creativity
            </Label>
            <div className="space-y-2">
              <Slider
                value={[creativity]}
                onValueChange={(val) => setCreativity(val[0])}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Focused</span>
                <span>{(creativity * 100).toFixed(0)}%</span>
                <span>Creative</span>
              </div>
            </div>
          </div>

          {/* Smart Expansion */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Smart Expansion
              </Label>
              <p className="text-xs text-muted-foreground">
                Auto-expand nodes with context
              </p>
            </div>
            <Switch
              checked={enableSmartExpansion}
              onCheckedChange={setEnableSmartExpansion}
            />
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Animations
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable smooth transitions
              </p>
            </div>
            <Switch
              checked={enableAnimations}
              onCheckedChange={setEnableAnimations}
            />
          </div>

          {/* Auto-Save */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Save className="w-4 h-4" />
                Auto-Save
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically save your work
              </p>
            </div>
            <Switch
              checked={enableAutoSave}
              onCheckedChange={setEnableAutoSave}
            />
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                {enableSoundEffects ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Sound Effects
              </Label>
              <p className="text-xs text-muted-foreground">
                Play audio feedback
              </p>
            </div>
            <Switch
              checked={enableSoundEffects}
              onCheckedChange={setEnableSoundEffects}
            />
          </div>
        </div>
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
      className="bg-card/90 backdrop-blur border border-border rounded-xl overflow-hidden cursor-crosshair shadow-xl"
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

// Floating Action Bar - 3 essential contextual actions
const FloatingActionBar = ({
  node,
  position,
  onRefresh,
  onGenerateImage,
  onDeepDive,
  isLoading,
  onMouseEnter,
  onMouseLeave,
}: {
  node: HexNode;
  position: { x: number; y: number };
  onRefresh: () => void;
  onGenerateImage: () => void;
  onDeepDive: () => void;
  isLoading: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
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
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-full shadow-2xl px-2 py-1.5 flex items-center gap-1">
        {/* Refresh - Regenerate this node */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh this tile - regenerate content with AI"
              className={`p-2.5 min-w-[40px] min-h-[40px] rounded-full transition-all ${isLoading ? "opacity-50" : "hover:bg-accent"} ${style.color}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>

        {/* Make Image - Generate visual for this concept */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onGenerateImage}
              aria-label="Make Image - Generate a visual representation"
              className="p-2.5 min-w-[40px] min-h-[40px] rounded-full hover:bg-purple-500/20 text-purple-400 transition-all"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Make Image</TooltipContent>
        </Tooltip>

        {/* Deep Dive - Detailed analysis */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onDeepDive}
              aria-label="Deep Dive - Get comprehensive AI analysis of this concept"
              className="p-2.5 min-w-[40px] min-h-[40px] rounded-full hover:bg-indigo-500/20 text-indigo-400 transition-all"
            >
              <Target className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Deep Dive</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default function HiveMindApp() {
  // --- State ---
  const [nodes, setNodes] = useState<Record<string, HexNode>>({});
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [imageLoading, setImageLoading] = useState<string | null>(null);
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
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null); // For action bar (clears on mouse leave)
  // Detect touch device to prevent double-firing of touch + mouse events
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showWelcome, setShowWelcome] = useState(true);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false); // Track if mouse moved during drag (to distinguish click from pan)
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

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
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<string | null>(null);

  // Template selection
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);
  const [templateContext, setTemplateContext] = useState("");
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  // Share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Quick tour modal

  // Multi-cluster support
  const [clusters, setClusters] = useState<string[]>(["main"]); // List of cluster IDs

  // Smart expansion settings
  const [enableSmartExpansion, setEnableSmartExpansion] = useState(true);
  const [autoExpandingNodes, setAutoExpandingNodes] = useState<Set<string>>(new Set());

  // Settings modal and preferences
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(() => {
    const saved = localStorage.getItem('hivemind_font_size');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [enableAnimations, setEnableAnimations] = useState(() => {
    const saved = localStorage.getItem('hivemind_animations');
    if (saved) return saved === 'true';
    // Check for prefers-reduced-motion
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const [enableAutoSave, setEnableAutoSave] = useState(() => {
    const saved = localStorage.getItem('hivemind_autosave');
    return saved !== 'false'; // Default to true
  });
  const [enableSoundEffects, setEnableSoundEffects] = useState(() => {
    const saved = localStorage.getItem('hivemind_sound');
    return saved === 'true'; // Default to false
  });

  // Theme from context
  const { theme, toggleTheme } = useTheme();

  // Accessibility announcer
  const announcer = useHiveMindAnnouncer();

  // Interactive context prompts
  const [showContextPrompt, setShowContextPrompt] = useState(false);
  const [contextPromptNode, setContextPromptNode] = useState<HexNode | null>(null);
  const [contextPromptQuestion, setContextPromptQuestion] = useState("");
  const [contextResponse, setContextResponse] = useState("");
  const [contextHistory, setContextHistory] = useState<Record<string, string>>({});  // Track user-provided context per node

  // LLM Over-generation control
  const [generationsThisSession, setGenerationsThisSession] = useState(0);
  const [maxGenerationsPerSession] = useState(100); // Configurable limit
  const [lastAutoExpandTime, setLastAutoExpandTime] = useState(0);
  const [isThrottled, setIsThrottled] = useState(false);

  // Add Info modal state
  const [showAddInfoModal, setShowAddInfoModal] = useState(false);
  const [addInfoNodeId, setAddInfoNodeId] = useState<string | null>(null);
  const [addInfoText, setAddInfoText] = useState("");

  // Hover delay for FloatingActionBar
  const hoverDelayTimer = useRef<NodeJS.Timeout | null>(null);

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
    if (Object.keys(nodes).length > 0 && enableAutoSave) {
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
  }, [nodes, viewState, creativity, enableAutoSave]);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('hivemind_font_size', fontSizeMultiplier.toString());
  }, [fontSizeMultiplier]);

  useEffect(() => {
    localStorage.setItem('hivemind_animations', enableAnimations.toString());
  }, [enableAnimations]);

  useEffect(() => {
    localStorage.setItem('hivemind_autosave', enableAutoSave.toString());
  }, [enableAutoSave]);

  useEffect(() => {
    localStorage.setItem('hivemind_sound', enableSoundEffects.toString());
  }, [enableSoundEffects]);

  // Apply font size multiplier to document root
  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-multiplier', fontSizeMultiplier.toString());
  }, [fontSizeMultiplier]);

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
    a.download = `hivemind_${Date.now()}.json`;
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

  // Inverse conversion: screen coordinates to hex grid coordinates
  const pixelToHex = (x: number, y: number) => {
    const q = Math.round((Math.sqrt(3) / 3 * x - 1 / 3 * y) / HEX_SIZE);
    const r = Math.round((2 / 3 * y) / HEX_SIZE);
    return { q, r };
  };

  const getNodeKey = (q: number, r: number) => `${q},${r}`;

  // Get cluster color palette for visual distinction
  const getClusterColor = (clusterId: string | undefined) => {
    if (!clusterId) return CLUSTER_COLORS[0]; // Default to main cluster color
    const index = clusters.indexOf(clusterId);
    return CLUSTER_COLORS[index % CLUSTER_COLORS.length];
  };

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
  // Helper to get nearest nodes for LLM context (for suggesting distant connections)
  const getNearestNodes = (centerNode: HexNode, maxNodes: number = 10): string => {
    const centerPos = { x: centerNode.q, y: centerNode.r };

    const allNodes = Object.entries(nodes)
      .map(([key, node]) => ({
        key,
        node,
        distance: Math.abs(node.q - centerPos.x) + Math.abs(node.r - centerPos.y),
      }))
      .filter(({ key }) => key !== getNodeKey(centerNode.q, centerNode.r))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxNodes);

    return allNodes
      .map(({ key, node }) => `- "${node.text}" [${node.type}] (${key})`)
      .join('\n');
  };

  const generateNeighbors = async (centerNode: HexNode, forceRefresh = false, additionalContext = "") => {
    const key = getNodeKey(centerNode.q, centerNode.r);

    // Check if THIS specific node is already loading (allow other nodes to load in parallel)
    if (loadingNodes.has(key)) return;

    // Check generation limit
    if (generationsThisSession >= maxGenerationsPerSession) {
      setIsThrottled(true);
      toast.error("Generation limit reached for this session. Start a new session to continue.");
      return;
    }

    // Increment generation counter
    setGenerationsThisSession(prev => prev + 1);

    // Add this node to the loading set
    setLoadingNodes(prev => new Set([...Array.from(prev), key]));

    const tempDesc =
      creativity < 0.3
        ? "Logical, concrete, and safe"
        : creativity > 0.7
          ? "Wild, abstract, and out-of-the-box"
          : "Balanced and creative";
    
    // Enhanced prompt with MANDATORY context prompting
    const systemPrompt = `You are a brainstorming engine for a hexagonal mind map. Style: ${tempDesc}.
Given a central idea, you MUST generate EXACTLY 6 distinct related nodes to fill all hexagonal neighbors.
Each node should explore a different angle or aspect of the central idea.
Types available: concept, action, technical, question, risk.
Vary the types to create a diverse exploration.

You will also receive a list of existing nearby nodes in the map. If any of your generated branches
have a strong conceptual relationship with existing nodes (NOT the parent), suggest those connections.

IMPORTANT:
- You MUST return exactly 6 branches, no more, no less.
- For each branch, assess its COMPLEXITY (1-5 scale):
  1-2: Simple, specific concept (no expansion needed)
  3: Moderate complexity (could benefit from expansion)
  4-5: Rich, multi-faceted concept that SHOULD be expanded further
- Mark branches with complexity 4-5 as "autoExpand": true (max 2 per generation)

CONTEXT PROMPTING (CRITICAL - MANDATORY FOR 2-3 BRANCHES):
When a concept is too broad/vague to explore meaningfully without specifics, you MUST add a contextPrompt question.
This is NOT optional - include contextPrompt for AT LEAST 2-3 branches per generation.

Examples of concepts that REQUIRE contextPrompt:
- "cafe business" → contextPrompt: "What type of cafe (coffee shop, internet cafe, bakery-cafe) and in which city?"
- "market research" → contextPrompt: "Which specific market or industry are you targeting?"
- "pricing strategy" → contextPrompt: "What product/service and who is your target customer?"
- "location analysis" → contextPrompt: "Which city, neighborhood, or region should I analyze?"
- "competition" → contextPrompt: "Who are your main competitors or what industry?"
- "target audience" → contextPrompt: "Describe your ideal customer (age, income, interests)?"

If you see concepts like "research", "planning", "analysis", "design", "strategy" without specifics, ADD contextPrompt.

CRITICAL: Return ONLY valid JSON. No explanations, no commentary, no extra text. Just pure JSON.

Return JSON: { "branches": [{ "title": "Short Title (2-4 words)", "description": "Brief explanation (1-2 sentences)", "type": "concept|action|technical|question|risk", "complexity": 3, "autoExpand": false, "contextPrompt": "Specific question here or null", "relatedTo": ["node-key-1", "node-key-2"] | null }, ... ] }

The "relatedTo" field should contain keys of existing nodes that have meaningful conceptual
connections to this new branch. Only suggest strong connections, not tangential ones.

Example valid response:
{
  "branches": [
    {
      "title": "Market Analysis",
      "description": "Research target market size and demographics.",
      "type": "action",
      "complexity": 3,
      "autoExpand": false,
      "contextPrompt": null,
      "relatedTo": null
    }
  ]
}`;

    const nearbyNodesContext = getNearestNodes(centerNode, 10);

    const userQuery = `Central idea: "${centerNode.text}"
Context: ${centerNode.description || "No additional context"}
${centerNode.contextInfo ? `Additional context: ${centerNode.contextInfo}` : ""}
${additionalContext ? `User input: ${additionalContext}` : ""}

Existing nearby nodes in the map:
${nearbyNodesContext}

Generate 6 diverse related ideas. If any connect to existing nodes, suggest those connections.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GEMINI_TEXT_MODEL,
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7 + (creativity * 0.6), // 0.7-1.3 based on creativity
          },
        }),
      });

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

      // Sanitize common LLM JSON hallucinations (random words inserted after values)
      const sanitizeJson = (jsonStr: string): string => {
        let sanitized = jsonStr;

        // Pattern 0: Fix missing closing brace before comma (LLM omits } at end of object)
        // Example: "contextPrompt": "value"\n,  → "contextPrompt": "value"\n},
        sanitized = sanitized.replace(/("(?:[^"\\]|\\.)*")\s*\n\s*,\s*\n/g, '$1\n},\n');
        sanitized = sanitized.replace(/(null|true|false)\s*\n\s*,\s*\n/g, '$1\n},\n');
        sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s*\n\s*,\s*\n/g, '$1\n},\n');

        // Remove stray words after ANY valid JSON value (string, null, true, false, number)
        // Pattern 1: After quoted strings
        sanitized = sanitized.replace(/("(?:[^"\\]|\\.)*")\s*\n\s*[a-zA-Z][a-zA-Z0-9-_]*\s*\n(\s*[,}\]])/g, '$1\n$2');

        // Pattern 2: After null, true, false
        sanitized = sanitized.replace(/(null|true|false)\s*\n\s*[a-zA-Z][a-zA-Z0-9-_]*\s*\n(\s*[,}\]])/g, '$1\n$2');

        // Pattern 3: After numbers
        sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s*\n\s*[a-zA-Z][a-zA-Z0-9-_]*\s*\n(\s*[,}\]])/g, '$1\n$2');

        // Pattern 4: Inline random words after values (same patterns)
        sanitized = sanitized.replace(/("(?:[^"\\]|\\.)*")\s+[a-zA-Z][a-zA-Z0-9-_]*\s*([,}\]])/g, '$1$2');
        sanitized = sanitized.replace(/(null|true|false)\s+[a-zA-Z][a-zA-Z0-9-_]*\s*([,}\]])/g, '$1$2');
        sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s+[a-zA-Z][a-zA-Z0-9-_]*\s*([,}\]])/g, '$1$2');

        return sanitized;
      };

      const sanitizedText = sanitizeJson(text);
      console.log("Sanitized text:", sanitizedText);
      let branches = [];

      try {
        const parsed = sanitizedText ? JSON.parse(sanitizedText) : {};
        branches = parsed.branches || [];
        console.log("Parsed branches:", branches);
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Sanitized text:", sanitizedText);
        // Try to extract branches using regex as fallback
        try {
          const branchMatches = sanitizedText.match(/"title"\s*:\s*"([^"]+)"/g) || [];
          const descMatches = sanitizedText.match(/"description"\s*:\s*"([^"]+)"/g) || [];
          const typeMatches = sanitizedText.match(/"type"\s*:\s*"([^"]+)"/g) || [];

          for (let i = 0; i < Math.min(6, branchMatches.length); i++) {
            branches.push({
              title: branchMatches[i]?.match(/"title"\s*:\s*"([^"]+)"/)?.[1] || `Idea ${i + 1}`,
              description: descMatches[i]?.match(/"description"\s*:\s*"([^"]+)"/)?.[1] || "",
              type: typeMatches[i]?.match(/"type"\s*:\s*"([^"]+)"/)?.[1] || "concept",
            });
          }
          console.log("Recovered branches via regex:", branches);
        } catch {
          branches = [];
        }
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
      const nodesToAutoExpand: HexNode[] = [];
      const MAX_AUTO_EXPAND_DEPTH = 2; // Limit auto-expansion depth

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
          const newDepth = (centerNode.depth || 0) + 1;

          // Extract and validate relatedTo connections
          const relatedNodeKeys = (branches[i].relatedTo || [])
            .filter((relKey: string) =>
              currentNodes[relKey] && relKey !== key && relKey !== neighborKey
            );

          const newNode: HexNode = {
            q: nQ,
            r: nR,
            text: branches[i].title || `Idea ${i + 1}`,
            description: branches[i].description || "",
            type: validType,
            depth: newDepth,
            parentId: key,
            pinned: false,
            clusterId: centerNode.clusterId, // Inherit cluster from parent
            contextPrompt: branches[i].contextPrompt || undefined, // Store if LLM requests more info
            relatedNodeKeys: relatedNodeKeys.length > 0 ? relatedNodeKeys : undefined,
          };

          newNodes[neighborKey] = newNode;

          // Track nodes marked for auto-expansion (only if smart expansion is enabled)
          if (
            enableSmartExpansion &&
            branches[i].autoExpand &&
            branches[i].complexity >= 4 &&
            newDepth < MAX_AUTO_EXPAND_DEPTH &&
            nodesToAutoExpand.length < 2 // Max 2 auto-expansions per generation
          ) {
            nodesToAutoExpand.push(newNode);
          }
        }
      });
      commitNodes(newNodes);
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]);

      // Auto-expand flagged nodes in PARALLEL (non-blocking) with cooldown
      if (nodesToAutoExpand.length > 0 && enableSmartExpansion) {
        const now = Date.now();
        const timeSinceLastExpand = now - lastAutoExpandTime;
        const minCooldown = 2000; // 2 seconds between auto-expansions

        if (timeSinceLastExpand < minCooldown) {
          toast.info(`Auto-expansion throttled. Wait ${Math.ceil((minCooldown - timeSinceLastExpand) / 1000)}s`, {
            duration: 2000,
          });
          return;
        }

        setLastAutoExpandTime(now);
        nodesToAutoExpand.forEach((expandNode, index) => {
          const expandKey = getNodeKey(expandNode.q, expandNode.r);
          setAutoExpandingNodes(prev => new Set([...Array.from(prev), expandKey]));

          // Stagger start times for visual effect + cooldown, but don't block with await
          setTimeout(() => {
            generateNeighbors(expandNode, false).finally(() => {
              setAutoExpandingNodes(prev => {
                const next = new Set(prev);
                next.delete(expandKey);
                return next;
              });
            });
          }, index * 300 + minCooldown);
        });
      }
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
      // Remove this node from the loading set
      setLoadingNodes(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Refresh a single node's title and description (not neighbors)
  const refreshSingleNode = async (node: HexNode) => {
    const key = getNodeKey(node.q, node.r);
    if (loadingNodes.has(key) || node.pinned) return;

    setLoadingNodes(prev => new Set([...Array.from(prev), key]));

    const tempDesc =
      creativity < 0.3
        ? "Logical, concrete, and safe"
        : creativity > 0.7
          ? "Wild, abstract, and out-of-the-box"
          : "Balanced and creative";

    // Get parent context if available
    const parent = node.parentId ? nodes[node.parentId] : null;
    const parentContext = parent ? `Related to: "${parent.text}"` : "Root concept";

    const systemPrompt = `You are a brainstorming engine. Style: ${tempDesc}.
Given context about a node in a mind map, regenerate a fresh title and description for it.
Keep the same general theme but offer a new perspective or angle.
Return JSON: { "title": "Short Title (2-4 words)", "description": "Brief explanation (1-2 sentences)", "type": "concept|action|technical|question|risk" }`;

    const userQuery = `Current title: "${node.text}"
Current description: ${node.description || "None"}
${parentContext}
Node type: ${node.type}
Regenerate with a fresh perspective.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GEMINI_TEXT_MODEL,
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8 + (creativity * 0.5),
          },
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error?.message || `HTTP ${response.status}`);
      }

      let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      }

      const parsed = text ? JSON.parse(text) : {};
      const newNodes = { ...nodesRef.current };
      newNodes[key] = {
        ...node,
        text: parsed.title || node.text,
        description: parsed.description || node.description,
        type: parsed.type && NODE_TYPES[parsed.type] ? parsed.type : node.type,
      };
      commitNodes(newNodes);
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    } catch (error) {
      console.error("Refresh node error:", error);
    } finally {
      setLoadingNodes(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Generate image for a node using Gemini (Nano Banana)
  const generateImage = async (node: HexNode) => {
    const key = getNodeKey(node.q, node.r);
    if (imageLoading) return;
    setImageLoading(key);

    const prompt = `Create a visually compelling illustration for: ${node.text}${node.description ? `. Context: ${node.description}` : ''}`;

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GEMINI_IMAGE_MODEL,
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["image", "text"],
          },
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error?.message || `HTTP ${response.status}`);
      }

      // Find the inline_data part with the image
      const parts = result.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('image/'));

      if (imagePart?.inlineData) {
        const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        const newNodes = { ...nodesRef.current };
        newNodes[key] = { ...node, imageUrl };
        commitNodes(newNodes);
        if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
      } else {
        console.warn("No image in response:", result);
      }
    } catch (error) {
      console.error("Image generation error:", error);
    } finally {
      setImageLoading(null);
    }
  };

  const handleDeepDive = async (node: HexNode) => {
    setDeepDiveTitle(node.text);
    setDeepDiveContent(null);
    setIsDeepDiveLoading(true);

    // Gather context from connected nodes
    const connectedNodes = Object.values(nodes).filter(n =>
      n.parentId === getNodeKey(node.q, node.r) ||
      getNodeKey(node.q, node.r) === n.parentId
    );
    const contextFromNetwork = connectedNodes.length > 0
      ? `\nRelated ideas in the brainstorm: ${connectedNodes.map(n => n.text).join(', ')}`
      : '';

    const prompt = `# Deep Dive Analysis: "${node.text}"

Context: ${node.description || "No additional context provided"}${contextFromNetwork}
Category: ${node.type}

Create a comprehensive, well-structured analysis document that could stand alone as a reference. Use clear Markdown formatting.

## Required Sections:

### 1. Executive Summary
A 2-3 sentence overview of what this concept is and why it matters.

### 2. Core Concepts
Explain the fundamental ideas, principles, or components. Define any important terms.

### 3. Key Considerations
What are the critical factors, trade-offs, or decisions involved? Include:
- Advantages and benefits
- Challenges and risks
- Dependencies and prerequisites

### 4. Implementation Approaches
Practical strategies, methods, or steps to explore or execute this concept. Be specific and actionable.

### 5. Related Concepts & Resources
What adjacent ideas should be explored? What fields or domains does this connect to?

### 6. Questions to Explore Further
5-7 thought-provoking questions that would deepen understanding or guide next steps.

### 7. Quick Reference
Bullet-point summary of the most important takeaways.

Write in a professional but accessible tone. Be thorough and substantive - this should be a useful reference document.`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GEMINI_TEXT_MODEL,
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
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
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GEMINI_TEXT_MODEL,
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
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

    // Sprint 4: Context Transfer - if source has contextInfo, transfer it instead of merging
    if (sourceNode.contextInfo && !targetNode.contextInfo) {
      const updatedTarget: HexNode = {
        ...targetNode,
        contextInfo: sourceNode.contextInfo,
        linkedContext: [...(targetNode.linkedContext || []), sourceKey],
      };
      commitNodes({
        ...nodes,
        [targetKey]: updatedTarget,
      });
      setSelectedNodeId(targetKey);
      setDraggedNodeId(null);
      setDropTargetId(null);
      toast.success(`Context info transferred from "${sourceNode.text}"!`);
      return;
    }

    // Traditional merge: combine text and descriptions, keep target position
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
      clusterId: "main", // Set initial cluster
      isClusterRoot: true,
    };
    commitNodes({ "0,0": firstNode });
    setRootInput("");
    setViewState({ x: 0, y: 0, zoom: 1 });
    generateNeighbors(firstNode);
    setSelectedNodeId("0,0");
    setShowWelcome(false);
  };

  // Open template context prompt instead of loading directly
  const selectTemplate = (template: Template) => {
    setPendingTemplate(template);
    setTemplateContext("");
    setShowTemplates(false);
  };

  // Generate contextual template nodes via AI
  const generateContextualTemplate = async () => {
    if (!pendingTemplate || !templateContext.trim()) return;

    setIsGeneratingTemplate(true);

    const prompt = `You are helping create a brainstorming map. The user selected the "${pendingTemplate.name}" template and wants to apply it to: "${templateContext}"

Based on this template structure, generate customized content:
- Center node: The main topic adapted to their context
- Surrounding nodes: Specific subtopics relevant to their context

Template structure:
${pendingTemplate.nodes.map(n => `- ${n.text}: ${n.description} (type: ${n.type})`).join('\n')}

Respond with a JSON array of nodes, each with: text, description, type (concept/action/technical/question/risk), q, r coordinates (matching template positions).
Keep descriptions concise (1-2 sentences). Make content specific to "${templateContext}", not generic.

Example format:
[{"q":0,"r":0,"text":"Dog Walker App","description":"Mobile platform connecting busy professionals with reliable dog walkers","type":"concept"},...]`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GEMINI_TEXT_MODEL,
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      });

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedText) {
        const generatedNodes = JSON.parse(generatedText);
        const newNodes: Record<string, HexNode> = {};

        generatedNodes.forEach((gNode: { q: number; r: number; text: string; description: string; type: string }, index: number) => {
          const key = getNodeKey(gNode.q, gNode.r);
          newNodes[key] = {
            q: gNode.q,
            r: gNode.r,
            text: gNode.text,
            description: gNode.description,
            type: index === 0 ? "root" : (gNode.type as HexNode["type"]) || "concept",
            depth: gNode.q === 0 && gNode.r === 0 ? 0 : 1,
            pinned: gNode.q === 0 && gNode.r === 0,
          };
        });

        commitNodes(newNodes);
        setViewState({ x: 0, y: 0, zoom: 1 });
        setSelectedNodeId("0,0");
        setInspectedNodeId("0,0");
      }
    } catch (error) {
      console.error("Template generation error:", error);
      toast.error("Failed to generate template. Please try again.");
    } finally {
      setIsGeneratingTemplate(false);
      setPendingTemplate(null);
      setTemplateContext("");
    }
  };

  const loadTemplate = (template: Template) => {
    // Convert template nodes to HexNode format (used for direct load without context)
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

  // Create a new cluster at the clicked location
  const createNewCluster = (coords: { q: number; r: number }) => {
    const input = prompt("What's your new idea?");
    if (!input || !input.trim()) return;

    const clusterId = `cluster_${Date.now()}`;
    const key = getNodeKey(coords.q, coords.r);

    const newNode: HexNode = {
      q: coords.q,
      r: coords.r,
      text: input.trim(),
      description: "",
      type: "root",
      depth: 0,
      pinned: true,
      clusterId,
      isClusterRoot: true,
    };

    commitNodes({ ...nodes, [key]: newNode });
    setClusters([...clusters, clusterId]);
    setSelectedNodeId(key);
    setInspectedNodeId(key);

    // Auto-generate neighbors for the new cluster
    setTimeout(() => generateNeighbors(newNode), 100);

    toast.success("New cluster created! Generating ideas...");
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
          description: "",
          type: "concept",
          depth: parentNode.depth + 1,
          parentId: getNodeKey(parentNode.q, parentNode.r),
          pinned: false,
        };
        commitNodes({ ...nodes, [key]: newNode });
        setEditingNodeId(key);
        setEditTitle(newNode.text);
        setEditDesc("");
        setSelectedNodeId(key);
        setInspectedNodeId(key);
        return;
      }
    }
    // All neighbors occupied
    toast.info("All adjacent slots are occupied. Try expanding from another tile or delete one first.");
  };

  const handleNodeClick = (key: string, node: HexNode) => {
    // Always select the node and open info panel
    setSelectedNodeId(key);
    setInspectedNodeId(key);

    // Check if ANY neighbors are empty (slots to fill)
    const hasEmptyNeighbors = DIRECTIONS.some(dir => {
      const neighborKey = getNodeKey(node.q + dir.q, node.r + dir.r);
      return nodes[neighborKey] === undefined;
    });

    // If node has contextPrompt, show modal instead of generating
    if (hasEmptyNeighbors && node.contextPrompt && !loadingNodes.has(key)) {
      setContextPromptNode(node);
      setContextPromptQuestion(node.contextPrompt);
      setContextResponse("");
      setShowContextPrompt(true);
      return;
    }

    // Generate if there are empty slots and not already loading (parallel generation allowed)
    if (hasEmptyNeighbors && !loadingNodes.has(key)) {
      // Show toast with node title
      toast.info(`Generating neighbors for "${node.text}"...`, {
        duration: 2000,
      });
      generateNeighbors(node);
    }
  };

  // Canvas Interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest(".interactive-ui"))
      return;
    setIsDragging(true);
    hasDragged.current = false; // Reset drag tracking
    dragStart.current = { x: e.clientX - viewState.x, y: e.clientY - viewState.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    hasDragged.current = true; // Mouse moved while dragging = it's a pan, not a click
    setViewState((prev) => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    }));
  };

  // Handle click on empty canvas space to create new cluster
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Skip if dragging occurred, or if clicking on a node/UI element
    if (hasDragged.current) return;
    if ((e.target as HTMLElement).closest(".hex-node, .interactive-ui, .floating-action-bar")) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Convert screen coordinates to canvas coordinates (accounting for pan and zoom)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const screenX = (e.clientX - rect.left - centerX - viewState.x) / viewState.zoom;
    const screenY = (e.clientY - rect.top - centerY - viewState.y) / viewState.zoom;

    // Convert to hex coordinates
    const hexCoords = pixelToHex(screenX, screenY);
    const key = getNodeKey(hexCoords.q, hexCoords.r);

    // Only create cluster if this slot is empty
    if (!nodes[key]) {
      createNewCluster(hexCoords);
    }
  };

  // Track touch position for tap detection
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".interactive-ui")) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      hasDragged.current = false;
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
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
      hasDragged.current = true;
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

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Check for tap (no drag) on empty space
    if (!hasDragged.current && touchStartPos.current) {
      const target = e.target as HTMLElement;
      if (!target.closest(".hex-node, .interactive-ui, .floating-action-bar")) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const screenX = (touchStartPos.current.x - rect.left - centerX - viewState.x) / viewState.zoom;
          const screenY = (touchStartPos.current.y - rect.top - centerY - viewState.y) / viewState.zoom;
          const hexCoords = pixelToHex(screenX, screenY);
          const key = getNodeKey(hexCoords.q, hexCoords.r);
          if (!nodes[key]) {
            createNewCluster(hexCoords);
          }
        }
      }
    }
    touchStartPos.current = null;
    setIsDragging(false);
    setTouchDistance(0);
  };

  // Wheel handler (uses native event for non-passive listener)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setViewState((prev) => ({
        ...prev,
        zoom: Math.min(Math.max(prev.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.1), 3),
      }));
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const exportAsImage = () => {
    const svgContent = document.getElementById("hex-canvas-layer")?.innerHTML;
    if (!svgContent) return;
    const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000" viewBox="-1000 -1000 2000 2000"><style>text { font-family: sans-serif; fill: white; } path { stroke: gray; fill: #222; }</style><g transform="translate(0,0)">${svgContent}</g></svg>`;
    const blob = new Blob([fullSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hivemind-export-${Date.now()}.svg`;
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
        a.download = `hivemind-export-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pngUrl);
      });
    };
    
    img.src = url;
  };

  // Get active node and its screen position for floating action bar
  const activeNodeKey = selectedNodeId || inspectedNodeId;
  const activeNode = activeNodeKey ? nodes[activeNodeKey] : null;

  // Hovered node for action bar (shows on hover, hides on leave)
  const hoveredNode = hoveredNodeId ? nodes[hoveredNodeId] : null;
  
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

  // Calculate connection lines between parent-child nodes and distant connections
  const connectionLines = useMemo(() => {
    const lines: Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      isDashed: boolean;
    }> = [];

    // Parent-child connections (solid lines)
    Object.entries(visibleNodes)
      .filter(([, node]) => node.parentId && nodes[node.parentId])
      .forEach(([key, node]) => {
        const parent = nodes[node.parentId!];
        const childPos = hexToPixel(node.q, node.r);
        const parentPos = hexToPixel(parent.q, parent.r);
        const style = NODE_TYPES[node.type] || NODE_TYPES.default;

        lines.push({
          key: `parent-${key}`,
          x1: parentPos.x,
          y1: parentPos.y,
          x2: childPos.x,
          y2: childPos.y,
          color: style.bgSolid,
          isDashed: false,
        });
      });

    // Distant connections (dashed lines)
    Object.entries(visibleNodes)
      .filter(([, node]) => node.relatedNodeKeys?.length)
      .forEach(([key, node]) => {
        node.relatedNodeKeys!.forEach((relatedKey) => {
          const relatedNode = visibleNodes[relatedKey];
          if (relatedNode) {
            const nodePos = hexToPixel(node.q, node.r);
            const relatedPos = hexToPixel(relatedNode.q, relatedNode.r);

            lines.push({
              key: `distant-${key}-${relatedKey}`,
              x1: nodePos.x,
              y1: nodePos.y,
              x2: relatedPos.x,
              y2: relatedPos.y,
              color: '#64748b', // Slate gray per spec
              isDashed: true,
            });
          }
        });
      });

    return lines;
  }, [visibleNodes, nodes]);

  return (
    <div className="flex flex-col w-full h-screen bg-background text-foreground overflow-hidden font-sans select-none relative">
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
          className="interactive-ui bg-card/90 backdrop-blur border border-border p-2 px-4 rounded-xl flex items-center gap-2 sm:gap-4 pointer-events-auto shadow-2xl"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="font-bold hidden sm:inline">HiveMind</span>
          </div>
          <div className="h-6 w-px bg-accent" />

          {Object.keys(nodes).length === 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-widest">
                New Board
              </span>
              <button
                onClick={() => setShowWelcome(true)}
                className="p-2 hover:bg-accent rounded-lg text-foreground"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBuildModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <FileText className="w-3 h-3" /> Build
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={exportAsPNG}
                  className="p-2.5 hover:bg-accent text-muted-foreground rounded-lg"
                  title="Export PNG"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  onClick={exportAsImage}
                  className="p-2.5 hover:bg-accent text-muted-foreground rounded-lg text-xs"
                  title="Export SVG"
                >
                  SVG
                </button>
              </div>

              {/* Undo/Redo */}
              <div className="flex items-center gap-1 border-l border-border pl-2">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  className="p-2.5 hover:bg-accent text-muted-foreground rounded-lg disabled:opacity-30"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex === history.length - 1}
                  className="p-2.5 hover:bg-accent text-muted-foreground rounded-lg disabled:opacity-30"
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
                className={`p-2.5 rounded-lg transition-colors ${isSearchOpen ? "bg-accent text-accent-foreground" : "hover:bg-accent text-muted-foreground"}`}
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Session Management */}
              <div className="flex items-center gap-1 border-l border-border pl-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowSessionsModal(true)}
                      className="p-2.5 hover:bg-accent text-muted-foreground rounded-lg"
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
                      className="p-2.5 hover:bg-accent text-muted-foreground rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Export JSON</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="p-2.5 hover:bg-accent text-muted-foreground rounded-lg cursor-pointer">
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
                      className="p-2 hover:bg-accent text-muted-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="interactive-ui pointer-events-auto absolute top-20 right-4 z-30 bg-card/90 backdrop-blur border border-border p-3 rounded-xl animate-in slide-in-from-top-2 shadow-xl">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Filter by Type</p>
            <div className="space-y-1">
              <button
                onClick={() => setFilterType(null)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm transition-colors text-foreground"
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
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm transition-colors flex items-center gap-2 ${filterType === key ? 'bg-accent' : ''}`}
                  >
                    <Icon className={`w-4 h-4 ${type.color}`} />
                    <span className="text-foreground">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Bar (Floating) */}
        {isSearchOpen && (
          <div className="interactive-ui pointer-events-auto absolute top-20 left-4 z-30 bg-card/90 backdrop-blur border border-border p-2 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 w-64 shadow-xl">
            <Search className="w-4 h-4 text-muted-foreground ml-2" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && cycleSearch()}
              placeholder="Find idea..."
              className="bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground"
            />
            {searchResults.length > 0 && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap px-2">
                {currentSearchIndex + 1}/{searchResults.length}
              </span>
            )}
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-1 hover:text-foreground text-muted-foreground"
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
          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-3 bg-card/90 backdrop-blur border border-border rounded-xl hover:bg-accent transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFilterType(filterType ? null : 'all')}
                className={`p-3 bg-card/90 border border-border rounded-xl transition-colors ${filterType ? 'bg-accent' : 'hover:bg-accent/50'}`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Filter by Type</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowMinimap(!showMinimap)}
                className={`p-3 bg-card/90 border border-border rounded-xl transition-colors ${showMinimap ? 'bg-accent' : 'hover:bg-accent/50'}`}
              >
                <Map className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{showMinimap ? 'Hide Minimap' : 'Show Minimap'}</TooltipContent>
          </Tooltip>

          <button
            onClick={() => setViewState({ x: 0, y: 0, zoom: 0.8 })}
            className="p-3 bg-card/90 border border-border rounded-xl hover:bg-accent/50"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main
        ref={containerRef}
        onMouseDown={!isTouchDevice ? handleMouseDown : undefined}
        onMouseMove={!isTouchDevice ? handleMouseMove : undefined}
        onMouseUp={!isTouchDevice ? () => setIsDragging(false) : undefined}
        onMouseLeave={!isTouchDevice ? () => setIsDragging(false) : undefined}
        onClick={!isTouchDevice ? handleCanvasClick : undefined}
        onTouchStart={isTouchDevice ? handleTouchStart : undefined}
        onTouchMove={isTouchDevice ? handleTouchMove : undefined}
        onTouchEnd={isTouchDevice ? handleTouchEnd : undefined}
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
                  key={line.key}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={line.color}
                  strokeWidth={2}
                  strokeOpacity={line.isDashed ? 0.25 : 0.3}
                  strokeLinecap="round"
                  strokeDasharray={line.isDashed ? "8 4" : undefined}
                />
              ))}
            </svg>

            {/* Nodes Layer */}
            {Object.entries(visibleNodes).map(([key, node]) => {
              const { x, y } = hexToPixel(node.q, node.r);
              const style = NODE_TYPES[node.type] || NODE_TYPES.default;
              const Icon = style.icon;
              const isSelected = selectedNodeId === key;
              const isHovered = inspectedNodeId === key;
              const isLoading = loadingNodes.has(key);
              const isAutoExpanding = autoExpandingNodes.has(key);

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
                  onMouseEnter={() => {
                    // Add 100ms delay to prevent flicker
                    if (hoverDelayTimer.current) clearTimeout(hoverDelayTimer.current);
                    hoverDelayTimer.current = setTimeout(() => {
                      setHoveredNodeId(key);
                      if (!inspectedNodeId) setInspectedNodeId(key);
                    }, 100);
                  }}
                  onMouseLeave={() => {
                    if (hoverDelayTimer.current) clearTimeout(hoverDelayTimer.current);
                    setHoveredNodeId(null);
                  }}
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
                          if (navigator.vibrate) navigator.vibrate(10);
                          handleNodeClick(key, node);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleDeepDive(node);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          longPressTimer.current = setTimeout(() => {
                            if (navigator.vibrate) navigator.vibrate(50);
                            handleDeepDive(node);
                            longPressTimer.current = null;
                          }, 500);
                        }}
                        onTouchEnd={() => {
                          if (longPressTimer.current) {
                            clearTimeout(longPressTimer.current);
                            longPressTimer.current = null;
                          }
                        }}
                        onTouchMove={() => {
                          if (longPressTimer.current) {
                            clearTimeout(longPressTimer.current);
                            longPressTimer.current = null;
                          }
                        }}
                        className={`
                          relative w-full h-full cursor-pointer flex items-center justify-center p-4 text-center
                          transition-transform duration-200
                          ${isSelected ? "scale-110" : isHovered ? "scale-105" : ""}
                          ${isLoading || isAutoExpanding ? "animate-pulse" : ""}
                          ${draggedNodeId === key ? "opacity-50 scale-95" : ""}
                          ${dropTargetId === key ? "ring-4 ring-indigo-500 ring-opacity-75 scale-110" : ""}
                        `}
                      >
                        <svg
                          className={`absolute inset-0 w-full h-full transition-all duration-200 ${
                            isSelected
                              ? 'hex-shadow-selected'
                              : isHovered
                                ? 'hex-shadow-hover'
                                : 'hex-shadow-default'
                          }`}
                          viewBox="0 0 173.2 200"
                        >
                          {/* Pattern definition for context info */}
                          {node.contextInfo && (
                            <defs>
                              <pattern
                                id={`context-pattern-${key}`}
                                patternUnits="userSpaceOnUse"
                                width="8"
                                height="8"
                                patternTransform="rotate(45)"
                              >
                                <line
                                  x1="0" y1="0" x2="0" y2="8"
                                  stroke="rgb(59, 130, 246)"
                                  strokeWidth="1.5"
                                  strokeOpacity="0.15"
                                />
                              </pattern>
                            </defs>
                          )}

                          {/* Main hexagon path */}
                          <path
                            d="M86.6 0L173.2 50V150L86.6 200L0 150V50L86.6 0Z"
                            className={`
                              transition-all duration-200
                              ${
                                node.contextPrompt && !isAutoExpanding
                                  ? "fill-card stroke-amber-400 stroke-[4]"
                                  : isAutoExpanding
                                    ? "fill-card stroke-purple-400 stroke-[4]"
                                    : node.isKeyTheme
                                      ? "fill-card stroke-yellow-300 stroke-[4]"
                                      : node.isClusterRoot
                                        ? `fill-card ${getClusterColor(node.clusterId).stroke} stroke-[3]`
                                        : isSelected
                                          ? `fill-card ${style.border} stroke-[4]`
                                          : isHovered
                                            ? `fill-secondary ${style.border} stroke-[3]`
                                            : `fill-background stroke-border/80 stroke-[2]`
                              }
                            `}
                            style={node.isKeyTheme ? { filter: 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.4))' } : undefined}
                          />

                          {/* Inner glow for selected/hovered */}
                          {(isSelected || isHovered) && (
                            <path
                              d="M86.6 10L163.2 55V145L86.6 190L10 145V55L86.6 10Z"
                              className={`${style.bg} stroke-none`}
                            />
                          )}

                          {/* Context info stripe overlay */}
                          {node.contextInfo && (
                            <path
                              d="M86.6 0L173.2 50V150L86.6 200L0 150V50L86.6 0Z"
                              fill={`url(#context-pattern-${key})`}
                            />
                          )}
                        </svg>

                        <div className="relative z-10 flex flex-col items-center gap-1 pointer-events-none px-3 max-w-[140px]">
                          {isLoading ? (
                            <Loader2 className={`w-6 h-6 animate-spin ${style.color}`} />
                          ) : (
                            <>
                              {(() => {
                                const IconComponent = node.contextPrompt && !isAutoExpanding
                                  ? HelpCircle
                                  : isAutoExpanding
                                    ? Zap
                                    : Icon;

                                const iconClasses = `w-5 h-5 sm:w-6 sm:h-6 ${style.color} opacity-90 shrink-0 ${
                                  isAutoExpanding ? 'animate-pulse' : ''
                                }`;

                                return (
                                  <div className="relative inline-block">
                                    <IconComponent className={iconClasses} />
                                    {/* Key theme sparkle overlay */}
                                    {node.isKeyTheme && (
                                      <Sparkles
                                        className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300"
                                        strokeWidth={2.5}
                                      />
                                    )}
                                  </div>
                                );
                              })()}
                              <span
                                className={`text-hex-node font-bold line-clamp-3 uppercase text-center ${node.isKeyTheme ? "text-foreground" : "text-card-foreground"}`}
                                style={{ wordBreak: 'break-word' }}
                              >
                                {node.text}
                              </span>
                            </>
                          )}

                          {/* Context info mini-icon */}
                          {node.contextInfo && (
                            <div className="absolute bottom-0 right-0 opacity-60">
                              <Info className="w-3 h-3 text-blue-400" />
                            </div>
                          )}
                        </div>
                      </div>
                </div>
              );
            })}

            {Object.keys(nodes).length === 0 && (
              <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-muted-foreground pointer-events-none">
                <Layout className="w-16 h-16 mb-4 opacity-10" />
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Bar - 3 Essential Actions: Refresh, Make Image, Deep Dive */}
        {hoveredNode && hoveredNodeId && !editingNodeId && (
          <FloatingActionBar
            node={hoveredNode}
            position={getNodeScreenPosition(hoveredNode)}
            onRefresh={() => refreshSingleNode(hoveredNode)}
            onGenerateImage={() => generateImage(hoveredNode)}
            onDeepDive={() => handleDeepDive(hoveredNode)}
            isLoading={loadingNodes.has(hoveredNodeId)}
            onMouseEnter={() => setHoveredNodeId(hoveredNodeId)}
            onMouseLeave={() => setHoveredNodeId(null)}
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
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Title
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-secondary border-border text-foreground"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full bg-secondary border border-border rounded-md p-3 text-sm text-neutral-300 h-24 resize-none outline-none focus:border-indigo-500"
            />
          </div>
          
          {/* Type Selector */}
          {editingNodeId && nodes[editingNodeId] && (
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
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
                        ? "bg-accent border-white/30 text-foreground"
                        : "bg-accent/50 border-transparent text-muted-foreground hover:bg-accent"
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

      {/* WELCOME MODAL - Clean, elegant intro */}
      <Modal
        isOpen={showWelcome}
        onClose={() => setShowWelcome(false)}
        title=""
        description=""
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-6">
          {/* Branding */}
          <div>
            <h1 className="text-fluid-3xl font-bold text-foreground mb-2">HiveMind</h1>
            <p className="text-fluid-sm text-muted-foreground">AI brainstorming on a hexagonal canvas</p>
          </div>

          {/* Input Section */}
          <div className="space-y-3">
            <Input
              value={rootInput}
              onChange={(e) => setRootInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && rootInput.trim() && startBrainstorm()}
              placeholder="A concept, project, or question..."
              className="w-full bg-secondary/50 border-border text-base text-foreground placeholder:text-muted-foreground text-center"
              autoFocus
            />
            <Button
              onClick={() => startBrainstorm()}
              disabled={!rootInput.trim()}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2.5"
            >
              Start Exploring
            </Button>
          </div>

          {/* Templates Link */}
          <button
            onClick={() => {
              setShowWelcome(false);
              setShowTemplates(true);
            }}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Or start from a template →
          </button>

        </div>
      </Modal>

      {/* Rich Hover Panel - Shows full node details on hover, persists until closed */}
      {inspectedNodeId && nodes[inspectedNodeId] && (
        <div 
          className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 w-auto sm:w-[380px] max-h-[calc(100vh-120px)] overflow-y-auto pointer-events-auto animate-in slide-in-from-left-2 duration-200"
        >
          <div className="bg-neutral-900/98 backdrop-blur-xl border-2 border-border rounded-2xl shadow-2xl p-6 pointer-events-auto">
            {/* Header with close button */}
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-fluid-2xl font-bold text-foreground pr-8">{nodes[inspectedNodeId].text}</h2>
              <button
                onClick={() => setInspectedNodeId(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-accent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Node Type Badge */}
              <div className="flex items-center gap-3">
                {(() => {
                  const node = nodes[inspectedNodeId];
                  const style = NODE_TYPES[node.type] || NODE_TYPES.default;
                  const Icon = style.icon;
                  return (
                    <>
                      <div className={`p-3 rounded-xl ${style.bg} ${style.border} border-2`}>
                        <Icon className={`w-6 h-6 ${style.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{node.type.toUpperCase()}</p>
                      </div>
                    </>
                  );
                })()}
                {nodes[inspectedNodeId].isKeyTheme && (
                  <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-400 font-bold">KEY THEME</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Description</h4>
                <p className="text-fluid-base text-card-foreground leading-relaxed">
                  {nodes[inspectedNodeId].description || "No description available."}
                </p>
              </div>

              {/* Generated Image */}
              {nodes[inspectedNodeId].imageUrl && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Generated Image</h4>
                  <img
                    src={nodes[inspectedNodeId].imageUrl}
                    alt={nodes[inspectedNodeId].text}
                    className="w-full rounded-xl border border-border shadow-lg"
                  />
                </div>
              )}

              {/* Context Info */}
              {nodes[inspectedNodeId].contextInfo && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Context Info
                  </h4>
                  <p className="text-sm text-card-foreground">
                    {nodes[inspectedNodeId].contextInfo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Drag this node onto others to transfer context info
                  </p>
                </div>
              )}

              {/* Panel Actions - Organized into clear groups */}
              <div className="flex flex-col gap-4 pt-4 border-t border-border">
                {/* PRIMARY ACTION: Deep Dive - Most engaging feature */}
                <button
                  onClick={() => handleDeepDive(nodes[inspectedNodeId])}
                  className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 hover:from-indigo-500/40 hover:to-purple-500/40 text-foreground text-base font-semibold transition-all shadow-lg hover:shadow-indigo-500/20"
                >
                  <BookOpen className="w-5 h-5" />
                  Deep Dive Analysis
                </button>

                {/* Group 1: Generate & Enhance */}
                <div>
                  <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Generate</h5>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => generateImage(nodes[inspectedNodeId])}
                      disabled={imageLoading === inspectedNodeId}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm transition-colors disabled:opacity-50"
                    >
                      {imageLoading === inspectedNodeId ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      {nodes[inspectedNodeId].imageUrl ? "Regen Image" : "Image"}
                    </button>
                    <button
                      onClick={() => {
                        const contextInfo = prompt("Enter context info/notes:", nodes[inspectedNodeId].contextInfo || "");
                        if (contextInfo !== null) {
                          commitNodes({
                            ...nodes,
                            [inspectedNodeId]: {
                              ...nodes[inspectedNodeId],
                              contextInfo: contextInfo.trim() || undefined
                            }
                          });
                          toast.success(contextInfo.trim() ? "Context info added! Drag this node onto others to transfer context." : "Context info cleared.");
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm transition-colors"
                    >
                      <Info className="w-4 h-4" />
                      {nodes[inspectedNodeId].contextInfo ? "Update" : "Add"} Info
                    </button>
                    <button
                      onClick={() => refreshSingleNode(nodes[inspectedNodeId])}
                      disabled={loadingNodes.has(inspectedNodeId)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm transition-colors disabled:opacity-50"
                    >
                      {loadingNodes.has(inspectedNodeId) ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Group 2: Edit & Organize */}
                <div>
                  <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Edit & Organize</h5>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setEditingNodeId(inspectedNodeId);
                        setEditTitle(nodes[inspectedNodeId].text);
                        setEditDesc(nodes[inspectedNodeId].description || "");
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent hover:bg-white/20 text-neutral-300 text-sm transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleManualAdd(nodes[inspectedNodeId])}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Child
                    </button>
                    <button
                      onClick={() => {
                        const isNowKeyTheme = !nodes[inspectedNodeId].isKeyTheme;
                        commitNodes({
                          ...nodes,
                          [inspectedNodeId]: { ...nodes[inspectedNodeId], isKeyTheme: isNowKeyTheme },
                        });
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        nodes[inspectedNodeId].isKeyTheme
                          ? "bg-amber-500/30 text-amber-300"
                          : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      {nodes[inspectedNodeId].isKeyTheme ? "Key Theme" : "Mark Key"}
                    </button>
                  </div>
                </div>
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
        maxWidth="max-w-5xl"
      >
        {isDeepDiveLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-4" />
            <p className="text-muted-foreground">Analyzing...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Export Actions */}
            <div className="flex justify-end gap-2 pb-4 border-b border-border">
              <Button
                onClick={() => {
                  const blob = new Blob([`# ${deepDiveTitle}\n\n${deepDiveContent}`], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${deepDiveTitle.replace(/[^a-z0-9]/gi, '_')}_deep_dive.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                variant="outline"
                size="sm"
                className="border-border text-neutral-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Download .md
              </Button>
              <Button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>${deepDiveTitle} - Deep Dive</title>
                        <style>
                          body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
                          h1 { font-size: 2em; margin-bottom: 0.5em; border-bottom: 2px solid #333; padding-bottom: 0.3em; }
                          h2 { font-size: 1.5em; margin-top: 1.5em; color: #444; }
                          h3 { font-size: 1.2em; margin-top: 1.2em; color: #555; }
                          p { margin-bottom: 1em; }
                          ul, ol { margin-left: 1.5em; margin-bottom: 1em; }
                          li { margin-bottom: 0.5em; }
                          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
                          strong { font-weight: bold; }
                          em { font-style: italic; }
                          @media print { body { margin: 0; padding: 20px; } }
                        </style>
                      </head>
                      <body>
                        <h1>${deepDiveTitle}</h1>
                        ${(deepDiveContent || '').replace(/^# .+\n/m, '').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^\* (.+)$/gm, '<li>$1</li>').replace(/^- (.+)$/gm, '<li>$1</li>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\n\n/g, '</p><p>').replace(/^(?!<[hlo])/gm, '<p>').replace(/<p><\/p>/g, '')}
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Print / Save PDF
              </Button>
            </div>

            {/* Content */}
            <div className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-6 text-foreground" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-6 mb-3 text-card-foreground" {...props} />,
                  p: ({node, ...props}) => <p className="text-base leading-relaxed mb-4 text-neutral-300" {...props} />,
                  ul: ({node, ...props}) => <ul className="space-y-2 mb-6 ml-6" {...props} />,
                  ol: ({node, ...props}) => <ol className="space-y-2 mb-6 ml-6" {...props} />,
                  li: ({node, ...props}) => <li className="text-base leading-relaxed text-neutral-300" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-card-foreground" {...props} />,
                  code: ({node, ...props}) => <code className="px-2 py-1 rounded bg-secondary text-amber-400 text-sm" {...props} />,
                }}
              >
                {deepDiveContent || ""}
              </ReactMarkdown>
            </div>
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
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Quick Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUILD_TEMPLATES.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setBuildPrompt(t.prompt)}
                      className="px-3 py-1.5 rounded-full bg-accent/50 border border-border text-xs text-neutral-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-foreground transition-all"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Custom Prompt
                </label>
                <textarea
                  value={buildPrompt}
                  onChange={(e) => setBuildPrompt(e.target.value)}
                  placeholder="Describe exactly what you need..."
                  className="w-full flex-1 bg-secondary border border-border rounded-xl p-4 text-foreground focus:border-indigo-500 outline-none resize-none"
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
              <p className="text-muted-foreground animate-pulse">
                Constructing artifact...
              </p>
            </div>
          )}
          {buildResult && (
            <>
              <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 rounded-lg border border-border custom-scrollbar mb-4">
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
                          <p className="text-xs text-muted-foreground">
                            {Object.keys(data.nodes).length} nodes • Last saved: {new Date(data.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          onClick={loadAutosave}
                          className="bg-amber-600 hover:bg-amber-500 text-foreground"
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
              className="flex-1 bg-secondary border-border"
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
              <p className="text-muted-foreground text-center py-4">No saved sessions yet</p>
            ) : (
              savedSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-accent/50 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{session.name}</p>
                    <p className="text-xs text-muted-foreground">
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
                className={selectedCategory === cat.id ? "bg-yellow-500 text-black" : "border-border text-neutral-300"}
                size="sm"
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto scrollbar-none pr-1">
              {TEMPLATES
                .filter((t) => selectedCategory === "all" || t.category === selectedCategory)
                .map((template) => (
                  <div
                    key={template.id}
                    className="bg-accent/50 border border-border rounded-xl p-5 hover:border-yellow-500/50 hover:bg-accent transition-all cursor-pointer group"
                    onClick={() => selectTemplate(template)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{template.icon}</div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-yellow-400 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{template.nodes.length} nodes</span>
                          <span>•</span>
                          <span className="capitalize">{template.category.replace("-", " ")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            {/* Scroll fade indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none" />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Templates provide a structured starting point. You can expand and customize them freely.
            </p>
            <Button
              onClick={() => setShowTemplates(false)}
              variant="ghost"
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Template Context Modal */}
      <Modal
        isOpen={!!pendingTemplate}
        onClose={() => {
          setPendingTemplate(null);
          setTemplateContext("");
        }}
        title={pendingTemplate?.name || "Customize Template"}
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{pendingTemplate?.icon}</span>
            <p className="text-sm text-muted-foreground">{pendingTemplate?.description}</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-card-foreground">
              What specifically are you planning?
            </label>
            <Input
              value={templateContext}
              onChange={(e) => setTemplateContext(e.target.value)}
              placeholder={
                pendingTemplate?.category === "product"
                  ? "e.g., A mobile app for dog walkers..."
                  : pendingTemplate?.category === "creative"
                    ? "e.g., A sci-fi novel about AI consciousness..."
                    : pendingTemplate?.category === "business"
                      ? "e.g., A coffee subscription service..."
                      : "Describe your specific idea..."
              }
              className="bg-secondary border-border"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && templateContext.trim()) {
                  generateContextualTemplate();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              The more specific you are, the more tailored your brainstorm will be.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={generateContextualTemplate}
              disabled={!templateContext.trim() || isGeneratingTemplate}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              {isGeneratingTemplate ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                "Generate Personalized Map"
              )}
            </Button>
            <Button
              onClick={() => {
                if (pendingTemplate) loadTemplate(pendingTemplate);
                setPendingTemplate(null);
              }}
              variant="outline"
              className="border-border text-muted-foreground"
            >
              Use Generic
            </Button>
          </div>
        </div>
      </Modal>

      {/* Context Prompt Modal */}
      <Modal
        isOpen={showContextPrompt}
        onClose={() => {
          setShowContextPrompt(false);
          setContextPromptNode(null);
          setContextResponse("");
        }}
        title="Provide Context"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {contextPromptQuestion}
          </p>
          <Input
            value={contextResponse}
            onChange={(e) => setContextResponse(e.target.value)}
            placeholder="Your answer..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && contextResponse.trim() && contextPromptNode) {
                const nodeKey = getNodeKey(contextPromptNode.q, contextPromptNode.r);
                setContextHistory({ ...contextHistory, [nodeKey]: contextResponse });
                setShowContextPrompt(false);
                generateNeighbors(contextPromptNode, false, contextResponse);
                setContextPromptNode(null);
                setContextResponse("");
              }
            }}
          />
          <div className="flex gap-3">
            <Button
              onClick={() => {
                if (contextPromptNode) {
                  const nodeKey = getNodeKey(contextPromptNode.q, contextPromptNode.r);
                  setContextHistory({ ...contextHistory, [nodeKey]: contextResponse });
                  setShowContextPrompt(false);
                  generateNeighbors(contextPromptNode, false, contextResponse);
                  setContextPromptNode(null);
                  setContextResponse("");
                }
              }}
              disabled={!contextResponse.trim()}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-foreground font-bold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </Button>
            <Button
              onClick={() => {
                setShowContextPrompt(false);
                setContextPromptNode(null);
                setContextResponse("");
              }}
              variant="outline"
              className="border-border text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Brainstorm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this link with others to let them view and continue your brainstorm:
          </p>
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1 bg-secondary border-border text-foreground font-mono text-sm"
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
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 The link contains your entire brainstorm encoded in the URL</p>
            <p>🔒 No server storage - everything is client-side</p>
            <p>⚡ Recipients can view and expand your ideas</p>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        creativity={creativity}
        setCreativity={setCreativity}
        fontSizeMultiplier={fontSizeMultiplier}
        setFontSizeMultiplier={setFontSizeMultiplier}
        enableAnimations={enableAnimations}
        setEnableAnimations={setEnableAnimations}
        enableAutoSave={enableAutoSave}
        setEnableAutoSave={setEnableAutoSave}
        enableSoundEffects={enableSoundEffects}
        setEnableSoundEffects={setEnableSoundEffects}
        enableSmartExpansion={enableSmartExpansion}
        setEnableSmartExpansion={setEnableSmartExpansion}
      />

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

      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden"
        style={{ clip: 'rect(0, 0, 0, 0)' }}
      >
        {loadingNodes.size > 0 && `Generating ideas for ${Array.from(loadingNodes).map(k => nodes[k]?.text).filter(Boolean).join(', ')}`}
      </div>
    </div>
  );
}
