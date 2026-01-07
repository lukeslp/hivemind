/**
 * useAccessibilityLabels Hook
 *
 * Generates comprehensive ARIA labels for HiveMind nodes and UI elements.
 * Ensures screen readers get full context about node state, type, and position.
 *
 * WCAG 2.1 Level AA Compliance:
 * - 4.1.2 Name, Role, Value (Level A)
 * - 2.4.6 Headings and Labels (Level AA)
 */

import { useMemo } from 'react';

export interface NodeData {
  text: string;
  type: string;
  depth: number;
  pinned?: boolean;
  isKeyTheme?: boolean;
  hasChildren?: boolean;
  childCount?: number;
}

export interface AccessibilityLabel {
  ariaLabel: string;
  ariaDescribedBy?: string;
  role: string;
}

/**
 * Generate comprehensive aria-label for a hexagonal node
 */
export function useNodeLabel(node: NodeData): AccessibilityLabel {
  return useMemo(() => {
    const parts: string[] = [];

    // Primary content
    parts.push(node.text);

    // Type information
    const typeDescriptions: Record<string, string> = {
      root: 'central topic',
      question: 'question',
      idea: 'idea',
      task: 'task',
      note: 'note',
      person: 'person',
      place: 'location',
      concept: 'concept',
      problem: 'problem',
      solution: 'solution',
      default: 'node',
    };
    parts.push(typeDescriptions[node.type] || typeDescriptions.default);

    // Depth information (helps understand hierarchy)
    if (node.depth > 0) {
      parts.push(`level ${node.depth}`);
    }

    // State modifiers
    if (node.pinned) {
      parts.push('pinned');
    }

    if (node.isKeyTheme) {
      parts.push('key theme');
    }

    // Children information
    if (node.hasChildren && node.childCount) {
      parts.push(`${node.childCount} ${node.childCount === 1 ? 'child' : 'children'}`);
    } else if (node.hasChildren) {
      parts.push('has children');
    }

    return {
      ariaLabel: parts.join(', '),
      role: 'button',
    };
  }, [node]);
}

/**
 * Generate aria-label for toolbar action buttons
 */
export function useToolbarLabel(
  action: string,
  options?: {
    disabled?: boolean;
    count?: number;
    shortcut?: string;
  }
): AccessibilityLabel {
  return useMemo(() => {
    const labels: Record<string, string> = {
      search: 'Search nodes',
      export: 'Export mind map',
      'export-png': 'Export as PNG image',
      'export-svg': 'Export as SVG image',
      undo: 'Undo last action',
      redo: 'Redo last action',
      build: 'Build from template or AI',
      settings: 'Open settings',
      info: 'Show help and information',
      'zoom-in': 'Zoom in',
      'zoom-out': 'Zoom out',
      'zoom-reset': 'Reset zoom',
      filter: 'Filter nodes by type',
    };

    let label = labels[action] || action;

    // Add state information
    if (options?.disabled) {
      label += ' (unavailable)';
    }

    if (options?.count !== undefined) {
      label += ` (${options.count})`;
    }

    // Add keyboard shortcut hint
    if (options?.shortcut) {
      label += `. Keyboard shortcut: ${options.shortcut}`;
    }

    return {
      ariaLabel: label,
      role: 'button',
    };
  }, [action, options]);
}

/**
 * Generate aria-label for modals and dialogs
 */
export function useModalLabel(
  modalType: string,
  context?: string
): string {
  return useMemo(() => {
    const labels: Record<string, string> = {
      welcome: 'Welcome to HiveMind',
      settings: 'HiveMind Settings',
      build: 'Build Mind Map',
      'template-browser': 'Browse Templates',
      'keyboard-shortcuts': 'Keyboard Shortcuts Reference',
      'node-details': 'Node Details',
      'export-options': 'Export Options',
    };

    const baseLabel = labels[modalType] || 'Dialog';
    return context ? `${baseLabel}: ${context}` : baseLabel;
  }, [modalType, context]);
}

/**
 * Generate aria-live region announcements for state changes
 */
export function useStateAnnouncement(
  state: 'loading' | 'success' | 'error' | 'info',
  message: string
): { message: string; politeness: 'polite' | 'assertive' } {
  return useMemo(() => {
    const politeness = state === 'error' ? 'assertive' : 'polite';

    const prefixes: Record<string, string> = {
      loading: 'Loading:',
      success: 'Success:',
      error: 'Error:',
      info: '',
    };

    const prefix = prefixes[state];
    const announcement = prefix ? `${prefix} ${message}` : message;

    return {
      message: announcement,
      politeness,
    };
  }, [state, message]);
}

export default useNodeLabel;
