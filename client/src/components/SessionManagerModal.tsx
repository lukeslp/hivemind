import React from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface SavedMap {
  id: string;
  name: string;
  createdAt?: {
    seconds: number;
  };
}

interface SessionManagerModalProps {
  isOpen: boolean;
  savedMaps: SavedMap[];
  saveName: string;
  setSaveName: (name: string) => void;
  onSave: () => void;
  onLoad: (map: SavedMap) => void;
  onDelete: (id: string) => void;
  onOpenConfirmModal: (callback: () => void) => void;
}

export default function SessionManagerModal({
  isOpen,
  savedMaps,
  saveName,
  setSaveName,
  onSave,
  onLoad,
  onDelete,
  onOpenConfirmModal
}: SessionManagerModalProps) {
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          placeholder="Name your current map..."
          className={`flex-1 border rounded-lg p-2 outline-none ${
            theme === 'dark'
              ? 'bg-neutral-800 border-white/10 text-white placeholder:text-neutral-500'
              : 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
          }`}
        />
        <button onClick={onSave} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm">
          Save New
        </button>
      </div>
      <div className={`h-px my-2 ${theme === 'dark' ? 'bg-white/10' : 'bg-neutral-300'}`} />
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar">
        {savedMaps.map(map => (
          <div key={map.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
            theme === 'dark'
              ? 'bg-white/5 hover:bg-white/10'
              : 'bg-neutral-100 hover:bg-neutral-200'
          }`}>
            <div>
              <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{map.name}</div>
              <div className="text-xs text-muted-foreground">
                {map.createdAt?.seconds
                  ? new Date(map.createdAt.seconds * 1000).toLocaleDateString()
                  : 'No date'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onLoad(map)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenConfirmModal(() => onDelete(map.id))}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {savedMaps.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No saved maps found.</p>
        )}
      </div>
    </div>
  );
}
