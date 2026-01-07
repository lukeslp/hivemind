import React from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';

export default function SessionManagerModal({
  isOpen,
  savedMaps,
  saveName,
  setSaveName,
  onSave,
  onLoad,
  onDelete,
  onOpenConfirmModal
}) {
  if (!isOpen) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          placeholder="Name your current map..."
          className="flex-1 bg-neutral-800 border border-white/10 rounded-lg p-2 text-white outline-none"
        />
        <button onClick={onSave} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm">
          Save New
        </button>
      </div>
      <div className="h-px bg-white/10 my-2" />
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar">
        {savedMaps.map(map => (
          <div key={map.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <div>
              <div className="font-bold text-white">{map.name}</div>
              <div className="text-xs text-neutral-500">
                {new Date(map.createdAt?.seconds * 1000).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onLoad(map)}
                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenConfirmModal(() => onDelete(map.id))}
                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {savedMaps.length === 0 && (
          <p className="text-center text-neutral-500 py-4">No saved maps found.</p>
        )}
      </div>
    </div>
  );
}
