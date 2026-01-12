/**
 * HexCanvas Component
 *
 * Renders the hexagonal node grid with SVG visualization.
 * Optimized with React.memo and useMemo for performance.
 * Fully accessible with ARIA labels and keyboard navigation support.
 */

import React, { useMemo } from 'react';
import {
  Loader2,
  Zap,
  HelpCircle,
  Sparkles,
  Info,
} from '@/lib/icons';

// Constants
const HEX_SIZE = 80;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;

// Node type configurations (imported from parent or defined here)
import {
  Lightbulb,
  Activity,
  Terminal,
  HelpCircle as QuestionIcon,
  Target,
  Box,
} from '@/lib/icons';

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
    id: 'root',
    label: 'Core',
    color: 'text-yellow-400',
    border: 'stroke-yellow-500',
    bg: 'fill-yellow-500/20',
    bgSolid: '#facc15',
    icon: Zap,
  },
  concept: {
    id: 'concept',
    label: 'Concept',
    color: 'text-amber-400',
    border: 'stroke-amber-500',
    bg: 'fill-amber-500/20',
    bgSolid: '#f59e0b',
    icon: Lightbulb,
  },
  action: {
    id: 'action',
    label: 'Action',
    color: 'text-rose-400',
    border: 'stroke-rose-500',
    bg: 'fill-rose-500/20',
    bgSolid: '#f43f5e',
    icon: Activity,
  },
  technical: {
    id: 'technical',
    label: 'Technical',
    color: 'text-cyan-400',
    border: 'stroke-cyan-500',
    bg: 'fill-cyan-500/20',
    bgSolid: '#22d3ee',
    icon: Terminal,
  },
  question: {
    id: 'question',
    label: 'Question',
    color: 'text-purple-400',
    border: 'stroke-purple-500',
    bg: 'fill-purple-500/20',
    bgSolid: '#a78bfa',
    icon: QuestionIcon,
  },
  risk: {
    id: 'risk',
    label: 'Risk',
    color: 'text-red-500',
    border: 'stroke-red-600',
    bg: 'fill-red-500/20',
    bgSolid: '#ef4444',
    icon: Target,
  },
  default: {
    id: 'default',
    label: 'Default',
    color: 'text-slate-400',
    border: 'stroke-slate-500',
    bg: 'fill-slate-500/20',
    bgSolid: '#94a3b8',
    icon: Box,
  },
};

// Cluster color palette
const CLUSTER_COLORS = [
  { stroke: 'stroke-yellow-500', glow: 'shadow-yellow-500/30', accent: 'bg-yellow-500' },
  { stroke: 'stroke-cyan-400', glow: 'shadow-cyan-400/30', accent: 'bg-cyan-400' },
  { stroke: 'stroke-pink-400', glow: 'shadow-pink-400/30', accent: 'bg-pink-400' },
  { stroke: 'stroke-emerald-400', glow: 'shadow-emerald-400/30', accent: 'bg-emerald-400' },
  { stroke: 'stroke-orange-400', glow: 'shadow-orange-400/30', accent: 'bg-orange-400' },
  { stroke: 'stroke-violet-400', glow: 'shadow-violet-400/30', accent: 'bg-violet-400' },
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
  isKeyTheme?: boolean;
  hasDeepDive?: boolean;
  wasInteracted?: boolean;
  hierarchyLevel?: number;
  clusterId?: string;
  isClusterRoot?: boolean;
  contextPrompt?: string;
  contextInfo?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  visualization?: {
    type: 'chart' | 'map' | 'timeline' | 'diagram';
    data: any;
    config?: any;
  };
  linkedContext?: string[];
  relatedNodeKeys?: string[];
}

interface ViewState {
  x: number;
  y: number;
  zoom: number;
}

interface ConnectionLine {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  isDashed: boolean;
}

interface HexCanvasProps {
  nodes: Record<string, HexNode>;
  viewState: ViewState;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  inspectedNodeId: string | null;
  loadingNodes: Set<string>;
  autoExpandingNodes: Set<string>;
  draggedNodeId: string | null;
  dropTargetId: string | null;
  editingNodeId: string | null;
  searchQuery: string;
  filterType: string | null;
  clusters: string[];
  isTouchDevice: boolean;

  // Event handlers
  onNodeClick: (key: string, node: HexNode) => void;
  onNodeDoubleClick: (node: HexNode) => void;
  onNodeKeyDown: (e: React.KeyboardEvent, key: string, node: HexNode) => void;
  onNodeHover: (key: string | null) => void;
  onNodeInspect: (key: string | null) => void;
  onDragStart: (key: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, key: string) => void;
  onDragLeave: (key: string) => void;
  onDrop: (e: React.DragEvent, targetKey: string) => void;
  onTouchStart: (key: string) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
}

/**
 * Individual Hexagon Node Component
 * Memoized to prevent unnecessary re-renders
 */
const HexNode = React.memo<{
  nodeKey: string;
  node: HexNode;
  x: number;
  y: number;
  isSelected: boolean;
  isHovered: boolean;
  isInspected: boolean;
  isLoading: boolean;
  isAutoExpanding: boolean;
  isDragged: boolean;
  isDropTarget: boolean;
  isDimmed: boolean;
  scale: number;
  strokeWidth: number;
  clusterColor: typeof CLUSTER_COLORS[0];
  isTouchDevice: boolean;
  onNodeClick: (key: string, node: HexNode) => void;
  onNodeDoubleClick: (node: HexNode) => void;
  onNodeKeyDown: (e: React.KeyboardEvent, key: string, node: HexNode) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
}>(({
  nodeKey,
  node,
  x,
  y,
  isSelected,
  isHovered,
  isInspected,
  isLoading,
  isAutoExpanding,
  isDragged,
  isDropTarget,
  isDimmed,
  scale,
  strokeWidth,
  clusterColor,
  isTouchDevice,
  onNodeClick,
  onNodeDoubleClick,
  onNodeKeyDown,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
}) => {
  const style = NODE_TYPES[node.type] || NODE_TYPES.default;
  const Icon = style.icon;

  // Determine icon to display based on node state
  const IconComponent = node.contextPrompt && !isAutoExpanding
    ? HelpCircle
    : isAutoExpanding
      ? Zap
      : Icon;

  const iconClasses = `w-5 h-5 sm:w-6 sm:h-6 ${style.color} opacity-90 shrink-0 ${
    isAutoExpanding ? 'animate-pulse' : ''
  }`;

  return (
    <div
      key={nodeKey}
      data-hierarchy={node.hierarchyLevel}
      data-key-theme={node.isKeyTheme ? 'true' : undefined}
      style={{
        left: x,
        top: y,
        width: HEX_WIDTH,
        height: HEX_HEIGHT,
        transform: `translate(-50%, -50%) scale(${scale})`,
        zIndex: isSelected ? 20 : isInspected ? 15 : 10,
      }}
      className={`absolute group transition-all duration-300 overflow-visible ${isDimmed ? 'opacity-20 grayscale' : 'opacity-100'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        tabIndex={0}
        role="button"
        aria-label={`${node.text}, ${node.type} node, level ${node.depth}${node.pinned ? ', pinned' : ''}${node.isKeyTheme ? ', key theme' : ''}. Tap to expand. Long press for actions. Double tap for deep dive.`}
        onKeyDown={(e) => onNodeKeyDown(e, nodeKey, node)}
        draggable={!node.pinned && node.type !== 'root'}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={(e) => {
          e.stopPropagation();
          if (navigator.vibrate) navigator.vibrate(10);
          onNodeClick(nodeKey, node);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onNodeDoubleClick(node);
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        className={`
          hex-node relative w-full h-full cursor-pointer flex items-center justify-center p-4 text-center overflow-visible
          transition-transform duration-200
          ${isLoading || isAutoExpanding ? 'animate-pulse' : ''}
          ${isDragged ? 'opacity-50' : ''}
          ${isDropTarget ? 'ring-4 ring-indigo-500 ring-opacity-75' : ''}
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
          viewBox="-4 -4 181.2 208"
          overflow="visible"
        >
          {/* Pattern definition for context info */}
          {node.contextInfo && (
            <defs>
              <pattern
                id={`context-pattern-${nodeKey}`}
                patternUnits="userSpaceOnUse"
                width="8"
                height="8"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
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
                  ? 'fill-card stroke-amber-400'
                  : isAutoExpanding
                    ? 'fill-card stroke-purple-400'
                    : node.isKeyTheme
                      ? 'fill-card stroke-yellow-300'
                      : node.isClusterRoot
                        ? `fill-card ${clusterColor.stroke}`
                        : isSelected
                          ? `fill-card ${style.border}`
                          : isHovered
                            ? `fill-secondary ${style.border}`
                            : 'fill-background stroke-border/80'
              }
            `}
            style={{
              strokeWidth: strokeWidth,
              paintOrder: 'stroke fill', // Fill renders over stroke to prevent overlap bleeding
              ...(node.isKeyTheme ? { filter: 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.4))' } : {}),
            }}
            strokeLinejoin="round"
            strokeLinecap="round"
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
              fill={`url(#context-pattern-${nodeKey})`}
            />
          )}
        </svg>

        <div className="relative z-10 flex flex-col items-center gap-1 pointer-events-none px-2.5 max-w-[150px]">
          {isLoading ? (
            <Loader2 className={`w-6 h-6 animate-spin ${style.color}`} />
          ) : (
            <>
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
              <span
                className={`text-hex-node font-bold line-clamp-4 uppercase text-center ${
                  node.isKeyTheme ? 'text-foreground' : 'text-card-foreground'
                }`}
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
}, (prevProps, nextProps) => {
  // Custom comparison for optimized re-renders
  return (
    prevProps.node === nextProps.node &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isInspected === nextProps.isInspected &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.isAutoExpanding === nextProps.isAutoExpanding &&
    prevProps.isDragged === nextProps.isDragged &&
    prevProps.isDropTarget === nextProps.isDropTarget &&
    prevProps.isDimmed === nextProps.isDimmed &&
    prevProps.scale === nextProps.scale &&
    prevProps.strokeWidth === nextProps.strokeWidth
  );
});

HexNode.displayName = 'HexNode';

/**
 * Main HexCanvas Component
 * Renders the complete hexagonal grid with connection lines
 */
export const HexCanvas = React.memo<HexCanvasProps>(({
  nodes,
  viewState,
  selectedNodeId,
  hoveredNodeId,
  inspectedNodeId,
  loadingNodes,
  autoExpandingNodes,
  draggedNodeId,
  dropTargetId,
  editingNodeId,
  searchQuery,
  filterType,
  clusters,
  isTouchDevice,
  onNodeClick,
  onNodeDoubleClick,
  onNodeKeyDown,
  onNodeHover,
  onNodeInspect,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
}) => {
  // Coordinate conversion
  const hexToPixel = useMemo(() => (q: number, r: number) => {
    const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = HEX_SIZE * ((3 / 2) * r);
    return { x, y };
  }, []);

  // Visual hierarchy helpers
  const getNodeHierarchyLevel = useMemo(() => (node: HexNode, isHovered: boolean): number => {
    if (node.isKeyTheme) return 1;
    if (node.hasDeepDive) return 2;
    if (node.wasInteracted) return 3;
    if (isHovered) return 4;
    return 5;
  }, []);

  const getHierarchyScale = useMemo(() => (level: number): number => {
    const scales = [1.15, 1.1, 1.05, 1.0, 0.9];
    return scales[level - 1] || 1.0;
  }, []);

  const getHierarchyStrokeWidth = useMemo(() => (level: number): number => {
    const widths = [5, 4, 3, 3, 2];
    return widths[level - 1] || 2;
  }, []);

  const getClusterColor = useMemo(() => (clusterId: string | undefined) => {
    if (!clusterId) return CLUSTER_COLORS[0];
    const index = clusters.indexOf(clusterId);
    return CLUSTER_COLORS[index % CLUSTER_COLORS.length];
  }, [clusters]);

  // Calculate connection lines between nodes
  const connectionLines = useMemo<ConnectionLine[]>(() => {
    const lines: ConnectionLine[] = [];

    Object.entries(nodes).forEach(([key, node]) => {
      // Parent-child connections
      if (node.parentId && nodes[node.parentId]) {
        const parent = nodes[node.parentId];
        const from = hexToPixel(parent.q, parent.r);
        const to = hexToPixel(node.q, node.r);

        lines.push({
          key: `${node.parentId}-${key}`,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          color: 'rgb(148, 163, 184)', // slate-400
          isDashed: false,
        });
      }

      // Related node connections (suggestions from AI)
      if (node.relatedNodeKeys && node.relatedNodeKeys.length > 0) {
        node.relatedNodeKeys.forEach((relatedKey) => {
          if (nodes[relatedKey]) {
            const related = nodes[relatedKey];
            const from = hexToPixel(node.q, node.r);
            const to = hexToPixel(related.q, related.r);

            lines.push({
              key: `related-${key}-${relatedKey}`,
              x1: from.x,
              y1: from.y,
              x2: to.x,
              y2: to.y,
              color: 'rgb(96, 165, 250)', // blue-400
              isDashed: true,
            });
          }
        });
      }
    });

    return lines;
  }, [nodes, hexToPixel]);

  return (
    <>
      {/* Connection Lines Layer */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: 0,
          overflow: 'visible',
          width: 1,
          height: 1,
        }}
        aria-hidden="true"
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
            strokeDasharray={line.isDashed ? '8 4' : undefined}
          />
        ))}
      </svg>

      {/* Nodes Layer */}
      {Object.entries(nodes).map(([key, node]) => {
        const { x, y } = hexToPixel(node.q, node.r);
        const isSelected = selectedNodeId === key;
        const isHovered = hoveredNodeId === key;
        const isInspected = inspectedNodeId === key;
        const isLoading = loadingNodes.has(key);
        const isAutoExpanding = autoExpandingNodes.has(key);
        const isDragged = draggedNodeId === key;
        const isDropTarget = dropTargetId === key;

        // Visual hierarchy calculations
        const hoveredForHierarchy = hoveredNodeId === key;
        const hierarchyLevel = getNodeHierarchyLevel(node, hoveredForHierarchy);
        const scale = getHierarchyScale(hierarchyLevel);
        const strokeWidth = getHierarchyStrokeWidth(hierarchyLevel);
        const clusterColor = getClusterColor(node.clusterId);

        // Search and Filter Dimming
        const isDimmed = Boolean(
          (searchQuery &&
            !node.text.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (filterType && filterType !== 'all' && node.type !== filterType)
        );

        let hoverDelayTimer: NodeJS.Timeout | null = null;

        return (
          <HexNode
            key={key}
            nodeKey={key}
            node={node}
            x={x}
            y={y}
            isSelected={isSelected}
            isHovered={isHovered}
            isInspected={isInspected}
            isLoading={isLoading}
            isAutoExpanding={isAutoExpanding}
            isDragged={isDragged}
            isDropTarget={isDropTarget}
            isDimmed={isDimmed}
            scale={scale}
            strokeWidth={strokeWidth}
            clusterColor={clusterColor}
            isTouchDevice={isTouchDevice}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeKeyDown={onNodeKeyDown}
            onMouseEnter={() => {
              if (hoverDelayTimer) clearTimeout(hoverDelayTimer);
              hoverDelayTimer = setTimeout(() => {
                onNodeHover(key);
                if (!inspectedNodeId) onNodeInspect(key);
              }, 100);
            }}
            onMouseLeave={() => {
              if (hoverDelayTimer) clearTimeout(hoverDelayTimer);
              onNodeHover(null);
            }}
            onDragStart={(e) => {
              if (node.pinned || node.type === 'root') {
                e.preventDefault();
                return;
              }
              onDragStart(key);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={onDragEnd}
            onDragOver={(e) => {
              if (draggedNodeId && draggedNodeId !== key) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                onDragOver(e, key);
              }
            }}
            onDragLeave={() => {
              if (dropTargetId === key) onDragLeave(key);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedNodeId && draggedNodeId !== key) {
                onDrop(e, key);
              }
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              onTouchStart(key);
            }}
            onTouchEnd={onTouchEnd}
            onTouchMove={onTouchMove}
          />
        );
      })}
    </>
  );
}, (prevProps, nextProps) => {
  // Performance optimization: only re-render if these props change
  return (
    prevProps.nodes === nextProps.nodes &&
    prevProps.viewState === nextProps.viewState &&
    prevProps.selectedNodeId === nextProps.selectedNodeId &&
    prevProps.hoveredNodeId === nextProps.hoveredNodeId &&
    prevProps.inspectedNodeId === nextProps.inspectedNodeId &&
    prevProps.loadingNodes === nextProps.loadingNodes &&
    prevProps.autoExpandingNodes === nextProps.autoExpandingNodes &&
    prevProps.draggedNodeId === nextProps.draggedNodeId &&
    prevProps.dropTargetId === nextProps.dropTargetId &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.filterType === nextProps.filterType
  );
});

HexCanvas.displayName = 'HexCanvas';

export default HexCanvas;
