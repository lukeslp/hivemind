import React from 'react';
import { Loader2, Zap, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@/contexts/ThemeContext';
import { buildApiUrl } from '@/lib/api';

interface HexNode {
  text: string;
  description?: string;
  type: string;
}

interface Nodes {
  [key: string]: HexNode;
}

interface BuildArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildPrompt: string;
  setBuildPrompt: (prompt: string) => void;
  buildResult: string;
  setBuildResult: (result: string) => void;
  isBuilding: boolean;
  setIsBuilding: (building: boolean) => void;
  nodes: Nodes;
}

const BUILD_TEMPLATES = [
  { label: "Project Proposal", prompt: "Write a comprehensive project proposal based on these ideas. Include Executive Summary, Objectives, Methodology, and Timeline." },
  { label: "SWOT Analysis", prompt: "Perform a SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats) based on the mapped concepts." },
  { label: "User Stories", prompt: "Generate a list of Agile User Stories with Acceptance Criteria based on the features and actions in this map." },
  { label: "Code Architecture", prompt: "Design a high-level software architecture and file structure for a system implementing these technical nodes." },
  { label: "Risk Assessment", prompt: "Identify potential risks, bottlenecks, and unknowns from the map and suggest mitigation strategies." },
  { label: "Email Update", prompt: "Draft a professional email to stakeholders summarizing the key outcomes of this brainstorming session." }
];

export default function BuildArtifactModal({
  isOpen,
  onClose,
  buildPrompt,
  setBuildPrompt,
  buildResult,
  setBuildResult,
  isBuilding,
  setIsBuilding,
  nodes
}: BuildArtifactModalProps) {
  const { theme } = useTheme();
  if (!isOpen) return null;

  const handleAgentBuild = async () => {
    if (!buildPrompt.trim()) return;
    setIsBuilding(true);
    setBuildResult("");

    const context = Object.values(nodes).map(n => `- [${n.type}] ${n.text}: ${n.description}`).join("\n");
    const prompt = `Context:\n${context}\n\nUser Request: ${buildPrompt}\n\nDetermine the best format and generate it in Markdown.`;

    try {
      const response = await fetch(buildApiUrl("generate"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-preview-09-2025',
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const result = await response.json();
      setBuildResult(result.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to build.");
    } catch (e) {
      setBuildResult("Error building artifact.");
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="flex flex-col h-[60vh]">
      {!buildResult && !isBuilding && (
        <div className="flex flex-col gap-6">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Quick Templates</label>
            <div className="flex flex-wrap gap-2">
              {BUILD_TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setBuildPrompt(t.prompt)}
                  className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-neutral-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-white'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-indigo-100 hover:border-indigo-400 hover:text-indigo-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Custom Prompt</label>
            <textarea
              value={buildPrompt}
              onChange={e => setBuildPrompt(e.target.value)}
              placeholder="Describe exactly what you need..."
              className={`w-full flex-1 border rounded-xl p-4 focus:border-indigo-500 outline-none resize-none ${
                theme === 'dark'
                  ? 'bg-neutral-800 border-white/10 text-white placeholder:text-neutral-500'
                  : 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
              }`}
            />
          </div>

          <div className="flex justify-end">
            <button onClick={handleAgentBuild} disabled={!buildPrompt} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold">
              <Zap className="w-4 h-4" /> Generate
            </button>
          </div>
        </div>
      )}
      {isBuilding && (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
          <p className="text-muted-foreground animate-pulse">Constructing artifact...</p>
        </div>
      )}
      {buildResult && (
        <>
          <div className={`flex-1 overflow-y-auto p-6 rounded-lg border custom-scrollbar mb-4 ${
            theme === 'dark'
              ? 'bg-neutral-950 border-white/10'
              : 'bg-neutral-50 border-neutral-300'
          }`}>
            <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
              <ReactMarkdown>{buildResult}</ReactMarkdown>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setBuildResult(""); setIsBuilding(false); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Back</button>
            <button onClick={() => { navigator.clipboard.writeText(buildResult); alert('Copied!'); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-500">
              <Save className="w-4 h-4" /> Copy
            </button>
          </div>
        </>
      )}
    </div>
  );
}
