/**
 * useNodeManagement Hook
 *
 * Centralized node state management for HiveMind
 * Handles CRUD operations, session persistence, filtering, and clusters
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { HexNode, ViewState } from '@/types/hivemind';

// Constants
const STORAGE_KEY = "hivemind_sessions";
const AUTOSAVE_KEY = "hivemind_autosave";

export interface SessionMetadata {
  id: string;
  name: string;
  date: string;
  nodeCount: number;
}

export interface SessionData {
  nodes: Record<string, HexNode>;
  viewState: ViewState;
  creativity: number;
  keyThemes: string[];
}

export interface UseNodeManagementReturn {
  // State
  nodes: Record<string, HexNode>;
  loadingNodes: Set<string>;
  clusters: string[];

  // CRUD Operations
  addNode: (node: HexNode) => void;
  updateNode: (key: string, updates: Partial<HexNode>) => void;
  deleteNode: (key: string) => void;
  commitNodes: (newNodes: Record<string, HexNode>) => void;

  // Bulk Operations
  clearAllNodes: () => void;

  // Session Management
  saveSession: (name: string) => void;
  loadSession: (sessionId: string) => void;
  loadAutosave: () => void;
  deleteSession: (sessionId: string) => void;
  exportSession: () => void;
  importSession: (file: File) => void;
  savedSessions: SessionMetadata[];

  // Filtering
  getVisibleNodes: (
    viewState: ViewState,
    showOnlyKeyThemes: boolean,
    containerRef: React.RefObject<HTMLDivElement>
  ) => Record<string, HexNode>;

  // Cluster Management
  addCluster: (clusterId: string) => void;

  // Loading State
  setLoadingNode: (key: string, isLoading: boolean) => void;

  // Refs
  nodesRef: React.MutableRefObject<Record<string, HexNode>>;
}

export interface UseNodeManagementOptions {
  nodes: Record<string, HexNode>; // nodes from useHistory hook
  viewState: ViewState;
  creativity: number;
  enableAutoSave?: boolean;
  onHistoryPush: (nodes: Record<string, HexNode>) => void;
}

// Hex geometry helper
const HEX_SIZE = 80;
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;

export function useNodeManagement({
  nodes,
  viewState,
  creativity,
  enableAutoSave = true,
  onHistoryPush,
}: UseNodeManagementOptions): UseNodeManagementReturn {

  // Core state (nodes managed by history hook, passed in)
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [clusters, setClusters] = useState<string[]>(["main"]);
  const [savedSessions, setSavedSessions] = useState<SessionMetadata[]>([]);

  // Ref for async operations
  const nodesRef = useRef(nodes);

  // Update ref when nodes change
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Load saved sessions metadata on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load sessions:", e);
    }
  }, []);

  // Autosave logic
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

  // Helper: Get node key from coordinates
  const getNodeKey = useCallback((q: number, r: number) => `${q},${r}`, []);

  // Helper: Convert hex coordinates to pixel coordinates
  const hexToPixel = useCallback((q: number, r: number) => {
    const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = HEX_SIZE * ((3 / 2) * r);
    return { x, y };
  }, []);

  // --- CRUD Operations ---

  const addNode = useCallback((node: HexNode) => {
    const key = getNodeKey(node.q, node.r);
    const newNodes = { ...nodes, [key]: node };
    commitNodes(newNodes);
  }, [getNodeKey, nodes, commitNodes]);

  const updateNode = useCallback((key: string, updates: Partial<HexNode>) => {
    if (!nodes[key]) return;
    const newNodes = {
      ...nodes,
      [key]: { ...nodes[key], ...updates }
    };
    commitNodes(newNodes);
  }, [nodes, commitNodes]);

  const deleteNode = useCallback((key: string) => {
    const { [key]: removed, ...rest } = nodes;
    commitNodes(rest);
  }, [nodes, commitNodes]);

  const commitNodes = useCallback((newNodes: Record<string, HexNode>) => {
    // Push to history - this will trigger nodes update via useHistory
    onHistoryPush(newNodes);
  }, [onHistoryPush]);

  const clearAllNodes = useCallback(() => {
    commitNodes({});
  }, [commitNodes]);

  // --- Session Management ---

  const saveSession = useCallback((name: string) => {
    const sessionId = `session_${Date.now()}`;
    const session: SessionMetadata = {
      id: sessionId,
      name: name || `Session ${savedSessions.length + 1}`,
      date: new Date().toISOString(),
      nodeCount: Object.keys(nodes).length,
    };

    const sessionData: SessionData = {
      nodes,
      viewState,
      creativity,
      keyThemes: Object.keys(nodes).filter(k => nodes[k].isKeyTheme),
    };

    try {
      localStorage.setItem(sessionId, JSON.stringify(sessionData));
      const newSessions = [...savedSessions, session];
      setSavedSessions(newSessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    } catch (e) {
      console.error("Failed to save session:", e);
      throw e;
    }
  }, [nodes, viewState, creativity, savedSessions]);

  const loadSession = useCallback((sessionId: string) => {
    try {
      const data = localStorage.getItem(sessionId);
      if (data) {
        const parsed: SessionData = JSON.parse(data);
        onHistoryPush(parsed.nodes); // Use history push to set nodes
        // Note: viewState and creativity updates handled by parent component
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load session:", e);
      throw e;
    }
  }, [onHistoryPush]);

  const loadAutosave = useCallback(() => {
    try {
      const autosave = localStorage.getItem(AUTOSAVE_KEY);
      if (autosave) {
        const data: SessionData = JSON.parse(autosave);
        if (data.nodes && Object.keys(data.nodes).length > 0) {
          onHistoryPush(data.nodes); // Use history push to set nodes
          return data;
        }
      }
    } catch (e) {
      console.error("Failed to load autosave:", e);
      throw e;
    }
  }, [onHistoryPush]);

  const deleteSession = useCallback((sessionId: string) => {
    try {
      localStorage.removeItem(sessionId);
      const newSessions = savedSessions.filter(s => s.id !== sessionId);
      setSavedSessions(newSessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    } catch (e) {
      console.error("Failed to delete session:", e);
      throw e;
    }
  }, [savedSessions]);

  const exportSession = useCallback(() => {
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
  }, [nodes, viewState, creativity]);

  const importSession = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.nodes) {
          onHistoryPush(data.nodes); // Use history push to set nodes
          // Note: viewState and creativity updates handled by parent component
          return data;
        }
      } catch (err) {
        console.error("Failed to import session:", err);
        throw err;
      }
    };
    reader.readAsText(file);
  }, [onHistoryPush]);

  // --- Filtering ---

  const getVisibleNodes = useCallback((
    currentViewState: ViewState,
    showOnlyKeyThemes: boolean,
    containerRef: React.RefObject<HTMLDivElement>
  ): Record<string, HexNode> => {
    const container = containerRef.current;
    if (!container) return {};

    // Apply key theme filter first
    const filteredNodes = showOnlyKeyThemes
      ? Object.fromEntries(Object.entries(nodes).filter(([, n]) => n.isKeyTheme))
      : nodes;

    // Viewport culling for performance
    const padding = HEX_WIDTH * 2;
    const { width, height } = container.getBoundingClientRect();
    const newVisibleNodes: Record<string, HexNode> = {};

    for (const [key, node] of Object.entries(filteredNodes)) {
      const { x, y } = hexToPixel(node.q, node.r);
      const screenX = width / 2 + currentViewState.x + x * currentViewState.zoom;
      const screenY = height / 2 + currentViewState.y + y * currentViewState.zoom;

      if (
        screenX > -padding &&
        screenX < width + padding &&
        screenY > -padding &&
        screenY < height + padding
      ) {
        newVisibleNodes[key] = node;
      }
    }
    return newVisibleNodes;
  }, [nodes, hexToPixel]);

  // --- Cluster Management ---

  const addCluster = useCallback((clusterId: string) => {
    setClusters(prev => {
      if (prev.includes(clusterId)) return prev;
      return [...prev, clusterId];
    });
  }, []);

  // --- Loading State ---

  const setLoadingNode = useCallback((key: string, isLoading: boolean) => {
    setLoadingNodes(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  }, []);

  return {
    // State
    nodes,
    loadingNodes,
    clusters,

    // CRUD
    addNode,
    updateNode,
    deleteNode,
    commitNodes,
    clearAllNodes,

    // Sessions
    saveSession,
    loadSession,
    loadAutosave,
    deleteSession,
    exportSession,
    importSession,
    savedSessions,

    // Filtering
    getVisibleNodes,

    // Clusters
    addCluster,

    // Loading
    setLoadingNode,

    // Refs
    nodesRef,
  };
}
