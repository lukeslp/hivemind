import { useState, useCallback } from 'react';

/**
 * Return type for the useHistory hook
 */
export interface UseHistoryReturn<T> {
  // Current state
  present: T;

  // Navigation capabilities
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;

  // Actions
  push: (state: T) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  jumpTo: (index: number) => void;

  // For external state sync (used when loading sessions)
  resetHistory: (newState: T) => void;
}

/**
 * Generic undo/redo hook with history management
 *
 * @param initialState - The initial state value
 * @param maxHistory - Maximum number of history entries to keep (default: 50)
 * @returns Object with present state and history navigation functions
 *
 * @example
 * ```typescript
 * const {
 *   present: nodes,
 *   canUndo,
 *   canRedo,
 *   push,
 *   undo,
 *   redo
 * } = useHistory<Record<string, HexNode>>({});
 *
 * // When committing nodes
 * const commitNodes = (newNodes: Record<string, HexNode>) => {
 *   push(newNodes);
 * };
 * ```
 */
export function useHistory<T>(
  initialState: T,
  maxHistory: number = 50
): UseHistoryReturn<T> {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Current state from history
  const present = history[historyIndex];

  // Navigation state
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  /**
   * Push a new state to history
   * Removes any future states if we're not at the end
   * Limits total history size to maxHistory
   */
  const push = useCallback((state: T) => {
    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(state);

      // Limit history size
      if (newHistory.length > maxHistory) {
        // Keep the most recent entries
        const trimmed = newHistory.slice(newHistory.length - maxHistory);
        // Adjust index since we removed items from the beginning
        setHistoryIndex(trimmed.length - 1);
        return trimmed;
      }

      return newHistory;
    });

    // Move to the new state
    setHistoryIndex(prev => {
      const newIndex = prev + 1;
      return Math.min(newIndex, maxHistory - 1);
    });
  }, [historyIndex, maxHistory]);

  /**
   * Go back one step in history
   */
  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
    }
  }, [canUndo]);

  /**
   * Go forward one step in history
   */
  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
    }
  }, [canRedo]);

  /**
   * Clear history and reset to current state
   */
  const clear = useCallback(() => {
    setHistory([present]);
    setHistoryIndex(0);
  }, [present]);

  /**
   * Jump to a specific index in history
   */
  const jumpTo = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
    }
  }, [history.length]);

  /**
   * Reset history completely with a new state
   * Used when loading sessions or importing data
   */
  const resetHistory = useCallback((newState: T) => {
    setHistory([newState]);
    setHistoryIndex(0);
  }, []);

  return {
    present,
    canUndo,
    canRedo,
    historyLength: history.length,
    push,
    undo,
    redo,
    clear,
    jumpTo,
    resetHistory,
  };
}
