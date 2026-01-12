import { useState, useRef, useCallback } from 'react';

/**
 * useCanvasInteraction Hook
 *
 * Handles all canvas pan/zoom/drag/touch interactions for hexagonal grid visualization.
 * Extracted from App.jsx to improve maintainability and testability.
 *
 * @param {Object} options - Configuration options
 * @param {number} options.minZoom - Minimum zoom level (default: 0.1)
 * @param {number} options.maxZoom - Maximum zoom level (default: 3)
 * @param {number} options.initialZoom - Starting zoom level (default: 0.8)
 * @param {number} options.zoomSensitivity - Mouse wheel zoom speed (default: 0.1)
 * @returns {Object} Canvas interaction state and handlers
 */
const useCanvasInteraction = (options = {}) => {
  const {
    minZoom = 0.1,
    maxZoom = 3,
    initialZoom = 0.8,
    zoomSensitivity = 0.1
  } = options;

  // --- Constants ---
  const HEX_SIZE = 80;

  // --- State ---
  const [viewState, setViewState] = useState({
    x: 0,
    y: 0,
    zoom: initialZoom
  });
  const [isDragging, setIsDragging] = useState(false);
  const [touchDistance, setTouchDistance] = useState(0);

  // --- Refs ---
  const dragStart = useRef({ x: 0, y: 0 });

  // --- Coordinate Transformation ---
  /**
   * Convert axial hex coordinates (q, r) to pixel coordinates (x, y)
   * Uses flat-top hexagon orientation
   */
  const hexToPixel = useCallback((q, r) => {
    const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = HEX_SIZE * (3 / 2 * r);
    return { x, y };
  }, []);

  /**
   * Convert pixel coordinates back to axial hex coordinates
   * Useful for determining which hex was clicked
   */
  const pixelToHex = useCallback((x, y) => {
    const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / HEX_SIZE;
    const r = (2 / 3 * y) / HEX_SIZE;
    // Cube rounding for accurate hex identification
    const cubeX = q;
    const cubeZ = r;
    const cubeY = -cubeX - cubeZ;

    let rx = Math.round(cubeX);
    let ry = Math.round(cubeY);
    let rz = Math.round(cubeZ);

    const xDiff = Math.abs(rx - cubeX);
    const yDiff = Math.abs(ry - cubeY);
    const zDiff = Math.abs(rz - cubeZ);

    if (xDiff > yDiff && xDiff > zDiff) {
      rx = -ry - rz;
    } else if (yDiff > zDiff) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }

    return { q: rx, r: rz };
  }, []);

  /**
   * Transform screen coordinates to world coordinates
   * Accounts for pan (x, y) and zoom
   */
  const screenToWorld = useCallback((screenX, screenY) => {
    return {
      x: (screenX - viewState.x) / viewState.zoom,
      y: (screenY - viewState.y) / viewState.zoom
    };
  }, [viewState]);

  /**
   * Transform world coordinates to screen coordinates
   */
  const worldToScreen = useCallback((worldX, worldY) => {
    return {
      x: worldX * viewState.zoom + viewState.x,
      y: worldY * viewState.zoom + viewState.y
    };
  }, [viewState]);

  // --- Pan/Zoom Actions ---
  /**
   * Reset view to initial state
   */
  const resetView = useCallback(() => {
    setViewState({ x: 0, y: 0, zoom: initialZoom });
  }, [initialZoom]);

  /**
   * Pan to specific world coordinates
   */
  const panTo = useCallback((x, y) => {
    setViewState(prev => ({ ...prev, x, y }));
  }, []);

  /**
   * Set zoom level, optionally centered on a specific point
   */
  const zoomTo = useCallback((newZoom, centerX, centerY) => {
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

    if (centerX !== undefined && centerY !== undefined) {
      // Zoom toward a specific point
      const worldPos = screenToWorld(centerX, centerY);
      setViewState({
        zoom: clampedZoom,
        x: centerX - worldPos.x * clampedZoom,
        y: centerY - worldPos.y * clampedZoom
      });
    } else {
      // Simple zoom without re-centering
      setViewState(prev => ({ ...prev, zoom: clampedZoom }));
    }
  }, [minZoom, maxZoom, screenToWorld]);

  // --- Mouse Event Handlers ---
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0 || e.target.closest('.interactive-ui')) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - viewState.x,
      y: e.clientY - viewState.y
    };
  }, [viewState]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setViewState(prev => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // --- Touch Event Handlers (Mobile) ---
  const handleTouchStart = useCallback((e) => {
    if (e.target.closest(".interactive-ui")) return;

    if (e.touches.length === 1) {
      // Single touch - pan
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX - viewState.x,
        y: e.touches[0].clientY - viewState.y
      };
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setTouchDistance(Math.sqrt(dx * dx + dy * dy));
    }
  }, [viewState]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && isDragging) {
      // Pan
      setViewState(prev => ({
        ...prev,
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y
      }));
    } else if (e.touches.length === 2 && touchDistance > 0) {
      // Pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newTouchDistance = Math.sqrt(dx * dx + dy * dy);
      const scale = newTouchDistance / touchDistance;

      setViewState(prev => ({
        ...prev,
        zoom: Math.max(minZoom, Math.min(maxZoom, prev.zoom * scale))
      }));
      setTouchDistance(newTouchDistance);
    }
  }, [isDragging, touchDistance, minZoom, maxZoom]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setTouchDistance(0);
  }, []);

  // --- Wheel Event Handler (Desktop Zoom) ---
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? (1 - zoomSensitivity) : (1 + zoomSensitivity);
    const newZoom = Math.max(minZoom, Math.min(maxZoom, viewState.zoom * zoomDelta));
    setViewState(prev => ({ ...prev, zoom: newZoom }));
  }, [viewState, zoomSensitivity, minZoom, maxZoom]);

  // --- Return API ---
  return {
    // State
    viewState,
    isDragging,

    // Actions
    setViewState,
    resetView,
    panTo,
    zoomTo,

    // Event Handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,

    // Coordinate Utilities
    hexToPixel,
    pixelToHex,
    screenToWorld,
    worldToScreen
  };
};

export default useCanvasInteraction;
