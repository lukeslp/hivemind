/**
 * Type definitions for HiveMind modal components
 * Ensures type safety for lazy-loaded modals
 */

export interface HexNode {
  text: string;
  description: string;
  type: string;
}

export interface Nodes {
  [key: string]: HexNode;
}

export interface SavedMap {
  id: string;
  name: string;
  createdAt?: {
    seconds: number;
  };
}

export interface BuildArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildPrompt: string;
  setBuildPrompt: (prompt: string) => void;
  buildResult: string;
  setBuildResult: (result: string) => void;
  isBuilding: boolean;
  setIsBuilding: (building: boolean) => void;
  nodes: Nodes;
  apiKey: string;
}

export interface DeepDiveModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  isLoading: boolean;
}

export interface SessionManagerModalProps {
  isOpen: boolean;
  savedMaps: SavedMap[];
  saveName: string;
  setSaveName: (name: string) => void;
  onSave: () => void;
  onLoad: (map: SavedMap) => void;
  onDelete: (id: string) => void;
  onOpenConfirmModal: (callback: () => void) => void;
}
