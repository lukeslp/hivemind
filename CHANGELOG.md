# HexMind Changelog

## Version 2.2 (December 2024)

This release focuses on Phase 1 of the strategic roadmap: **Polish & Optimization**. The improvements enhance mobile usability, accessibility, and performance while maintaining the existing feature set.

---

### Mobile Optimization

The application now supports touch-based interactions for mobile and tablet devices. Users can pan the canvas using single-finger drag gestures and zoom using the standard pinch-to-zoom gesture with two fingers. The touch event handlers work alongside the existing mouse controls, ensuring a consistent experience across all device types.

The UI has been made responsive with adjusted spacing and sizing for smaller screens. The info panel now adapts its width and positioning based on screen size, and the creativity slider has been optimized for touch interaction.

---

### Accessibility Enhancements

Keyboard navigation has been implemented for grid traversal. Users can now use arrow keys to move selection between adjacent nodes, making the application more accessible for users who prefer or require keyboard-based navigation. The initial press of an arrow key will select the root node if no node is currently selected.

ARIA labels have been added to major UI sections including the main controls, view controls, and the node information panel. These labels improve screen reader compatibility and help users understand the purpose of each interface element.

---

### Performance Optimization

A viewport culling system has been implemented to improve rendering performance with large maps. The application now calculates which nodes are visible within the current viewport and only renders those nodes. This optimization significantly reduces DOM operations when working with maps containing hundreds of nodes.

The culling system updates automatically when the view state changes (pan, zoom) or when nodes are added or removed, with a debounced update to prevent excessive recalculations during rapid interactions.

---

### User Experience Improvements

Native browser `confirm()` dialogs have been replaced with custom modal dialogs that match the application's visual design. This provides a more consistent and polished user experience, particularly on mobile devices where native dialogs can be disruptive.

The following actions now use the custom confirmation modal:
- Deleting a node and its children (Prune)
- Loading a saved map
- Refreshing an idea (regenerating neighbors)
- Deleting a saved map

---

### Code Quality

The custom `BookOpenIcon` SVG component has been replaced with the `BookOpen` icon from lucide-react, reducing code duplication and ensuring consistent icon styling throughout the application.

The Gemini API key has been properly configured for AI-powered features including neighbor generation, deep dive analysis, and artifact building.

---

### Technical Details

| Feature | Implementation |
|---------|----------------|
| Touch Pan | Single-finger drag via `onTouchStart`, `onTouchMove`, `onTouchEnd` |
| Pinch Zoom | Two-finger gesture tracking with distance calculation |
| Keyboard Nav | Arrow key handlers in global keydown listener |
| Viewport Culling | Screen-space bounds checking in `useEffect` hook |
| Custom Dialogs | `ConfirmationModal` component with callback pattern |
| Responsive UI | Tailwind CSS `sm:` breakpoint utilities |

---

### Migration Notes

This version is fully backward compatible with v2.1. Existing saved maps will load without modification. The Firebase data structure remains unchanged.

---

**Author:** Luke Steuber  
**License:** MIT
