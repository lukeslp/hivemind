import React from 'react';
import { Loader2, Zap, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
  nodes,
  apiKey
}) {
  if (!isOpen) return null;

  const handleAgentBuild = async () => {
    if (!buildPrompt.trim()) return;
    setIsBuilding(true);
    setBuildResult("");

    const context = Object.values(nodes).map(n => `- [${n.type}] ${n.text}: ${n.description}`).join("\n");
    const prompt = `Context:\n${context}\n\nUser Request: ${buildPrompt}\n\nDetermine the best format and generate it in Markdown.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
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
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">Quick Templates</label>
            <div className="flex flex-wrap gap-2">
              {BUILD_TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setBuildPrompt(t.prompt)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:text-white transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Custom Prompt</label>
            <textarea
              value={buildPrompt}
              onChange={e => setBuildPrompt(e.target.value)}
              placeholder="Describe exactly what you need..."
              className="w-full flex-1 bg-neutral-800 border border-white/10 rounded-xl p-4 text-white focus:border-indigo-500 outline-none resize-none"
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
          <p className="text-neutral-400 animate-pulse">Constructing artifact...</p>
        </div>
      )}
      {buildResult && (
        <>
          <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 rounded-lg border border-white/10 custom-scrollbar mb-4">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{buildResult}</ReactMarkdown>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setBuildResult(""); setIsBuilding(false); }} className="px-4 py-2 text-sm text-neutral-400">Back</button>
            <button onClick={() => { navigator.clipboard.writeText(buildResult); alert('Copied!'); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">
              <Save className="w-4 h-4" /> Copy
            </button>
          </div>
        </>
      )}
    </div>
  );
}
