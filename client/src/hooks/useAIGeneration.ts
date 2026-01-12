/**
 * useAIGeneration Hook
 *
 * Encapsulates all AI generation logic for HiveMind:
 * - Neighbor generation via Gemini API
 * - Deep dive analysis
 * - Rate limiting and error handling
 * - Loading state management
 */

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { buildApiUrl } from '@/lib/api';

// Constants
const GEMINI_TEXT_MODEL = "gemini-3-flash-preview";
const MAX_REQUEST_SIZE = 50000; // 50KB limit
const REQUEST_TIMEOUT = 30000; // 30 seconds
const HEX_SIZE = 80;

// Hex Directions (pointy-top hexagon neighbors)
const DIRECTIONS = [
  { q: 1, r: 0 },   // East
  { q: 1, r: -1 },  // Northeast
  { q: 0, r: -1 },  // Northwest
  { q: -1, r: 0 },  // West
  { q: -1, r: 1 },  // Southwest
  { q: 0, r: 1 },   // Southeast
];

// Types
interface HexNode {
  q: number;
  r: number;
  text: string;
  description?: string;
  type: string;
  depth: number;
  parentId?: string | null;
  pinned: boolean;
  isKeyTheme?: boolean;
  hasDeepDive?: boolean;
  wasInteracted?: boolean;
  hierarchyLevel?: number;
  clusterId?: string;
  isClusterRoot?: boolean;
  contextPrompt?: string;
  contextInfo?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  visualization?: {
    type: 'chart' | 'map' | 'timeline' | 'diagram';
    data: any;
    config?: any;
  };
  linkedContext?: string[];
  relatedNodeKeys?: string[];
}

interface NODE_TYPE {
  id: string;
  label: string;
  color: string;
  border: string;
  bg: string;
  bgSolid: string;
  icon: React.ElementType;
}

export interface UseAIGenerationOptions {
  nodes: Record<string, HexNode>;
  NODE_TYPES: Record<string, NODE_TYPE>;
  maxGenerationsPerSession?: number;
  enableSmartExpansion?: boolean;
}

export interface UseAIGenerationReturn {
  // State
  isGenerating: boolean;
  error: string | null;
  creativity: number;
  generationsThisSession: number;
  isThrottled: boolean;

  // Actions
  setCreativity: (value: number) => void;
  generateNeighbors: (
    centerNode: HexNode,
    forceRefresh?: boolean,
    additionalContext?: string
  ) => Promise<Record<string, HexNode> | null>;
  generateDeepDive: (node: HexNode) => Promise<string>;
  resetGenerationCount: () => void;
  clearError: () => void;
}

// Helper: Get node key from coordinates
const getNodeKey = (q: number, r: number) => `${q},${r}`;

// Helper: Calculate distance between two hex nodes
const hexDistance = (a: { q: number; r: number }, b: { q: number; r: number }) => {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
};

// Helper: Get nearest nodes for LLM context
const getNearestNodes = (
  centerNode: HexNode,
  allNodes: Record<string, HexNode>,
  maxNodes: number = 10
): string => {
  const centerPos = { q: centerNode.q, r: centerNode.r };
  const centerKey = getNodeKey(centerNode.q, centerNode.r);

  // Get key themes first (always include regardless of distance)
  const keyThemes = Object.entries(allNodes)
    .filter(([key, node]) => node.isKeyTheme && key !== centerKey)
    .map(([key, node]) => ({
      key,
      node,
      distance: hexDistance(centerPos, { q: node.q, r: node.r }),
    }));

  // Get nearest non-key-theme nodes
  const nearbyNodes = Object.entries(allNodes)
    .filter(([key, node]) => !node.isKeyTheme && key !== centerKey)
    .map(([key, node]) => ({
      key,
      node,
      distance: hexDistance(centerPos, { q: node.q, r: node.r }),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.max(0, maxNodes - keyThemes.length));

  const combined = [...keyThemes, ...nearbyNodes];

  if (combined.length === 0) return "No nearby nodes yet.";

  return combined
    .map(({ node }) => {
      const keyThemeLabel = node.isKeyTheme ? " [KEY THEME]" : "";
      return `- [${node.type.toUpperCase()}] ${node.text}${keyThemeLabel}: ${node.description || "No description"}`;
    })
    .join("\n");
};

// Helper: Sanitize LLM JSON output
const sanitizeJson = (jsonStr: string): string => {
  let sanitized = jsonStr;

  // Pattern 0: Fix missing closing brace before comma
  sanitized = sanitized.replace(/("(?:[^"\\]|\\.)*")\s*\n\s*,\s*\n/g, '$1\n},\n');
  sanitized = sanitized.replace(/(null|true|false)\s*\n\s*,\s*\n/g, '$1\n},\n');
  sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s*\n\s*,\s*\n/g, '$1\n},\n');

  // Remove stray words after ANY valid JSON value
  sanitized = sanitized.replace(/("(?:[^"\\]|\\.)*")\s*\n\s*[a-zA-Z][a-zA-Z0-9-_]*\s*\n(\s*[,}\]])/g, '$1\n$2');
  sanitized = sanitized.replace(/(null|true|false)\s*\n\s*[a-zA-Z][a-zA-Z0-9-_]*\s*\n(\s*[,}\]])/g, '$1\n$2');
  sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s*\n\s*[a-zA-Z][a-zA-Z0-9-_]*\s*\n(\s*[,}\]])/g, '$1\n$2');

  // Inline random words after values
  sanitized = sanitized.replace(/("(?:[^"\\]|\\.)*")\s+[a-zA-Z][a-zA-Z0-9-_]*\s*([,}\]])/g, '$1$2');
  sanitized = sanitized.replace(/(null|true|false)\s+[a-zA-Z][a-zA-Z0-9-_]*\s*([,}\]])/g, '$1$2');
  sanitized = sanitized.replace(/(\d+(?:\.\d+)?)\s+[a-zA-Z][a-zA-Z0-9-_]*\s*([,}\]])/g, '$1$2');

  return sanitized;
};

export function useAIGeneration({
  nodes,
  NODE_TYPES,
  maxGenerationsPerSession = 100,
  enableSmartExpansion = true,
}: UseAIGenerationOptions): UseAIGenerationReturn {
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creativity, setCreativity] = useState(0.5);
  const [generationsThisSession, setGenerationsThisSession] = useState(0);
  const [isThrottled, setIsThrottled] = useState(false);

  // Refs for abort control
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Generate 6 neighboring nodes for a center node using Gemini API
   */
  const generateNeighbors = useCallback(async (
    centerNode: HexNode,
    forceRefresh = false,
    additionalContext = ""
  ): Promise<Record<string, HexNode> | null> => {
    const key = getNodeKey(centerNode.q, centerNode.r);

    // Check generation limit
    if (generationsThisSession >= maxGenerationsPerSession) {
      setIsThrottled(true);
      toast.error("Generation limit reached for this session. Start a new session to continue.");
      return null;
    }

    // Increment generation counter
    setGenerationsThisSession(prev => prev + 1);
    setIsGenerating(true);
    setError(null);

    const tempDesc =
      creativity < 0.3
        ? "Logical, concrete, and safe"
        : creativity > 0.7
          ? "Wild, abstract, and out-of-the-box"
          : "Balanced and creative";

    // Build system prompt
    const systemPrompt = `You are a brainstorming engine for a hexagonal mind map. Style: ${tempDesc}.

**CRITICAL - KEY THEME PRIORITIZATION:**
Nodes marked as **[KEY THEME]** are the most important concepts. When generating:
1. Consider how new concepts relate to or build upon key themes
2. Suggest connections to key themes when relevant (even if spatially distant)
3. Weight key themes more heavily when determining brainstorm direction
4. If central idea is adjacent to a key theme, explore angles aligning with that theme

Given a central idea, you MUST generate EXACTLY 6 distinct related nodes to fill all hexagonal neighbors.
Each node should explore a different angle or aspect of the central idea.
Types available: concept, action, technical, question, risk.
Vary the types to create a diverse exploration.

You will also receive a list of existing nearby nodes in the map. If any of your generated branches
have a strong conceptual relationship with existing nodes (NOT the parent), suggest those connections.

IMPORTANT:
- You MUST return exactly 6 branches, no more, no less.
- For each branch, assess its COMPLEXITY (1-5 scale):
  1-2: Simple, specific concept (no expansion needed)
  3: Moderate complexity (could benefit from expansion)
  4-5: Rich, multi-faceted concept that SHOULD be expanded further
- Mark branches with complexity 4-5 as "autoExpand": true (max 2 per generation)

CONTEXT PROMPTING (CRITICAL - MANDATORY FOR 2-3 BRANCHES):
When a concept is too broad/vague to explore meaningfully without specifics, you MUST add a contextPrompt question.
This is NOT optional - include contextPrompt for AT LEAST 2-3 branches per generation.

Examples of concepts that REQUIRE contextPrompt:
- "cafe business" → contextPrompt: "What type of cafe (coffee shop, internet cafe, bakery-cafe) and in which city?"
- "market research" → contextPrompt: "Which specific market or industry are you targeting?"
- "pricing strategy" → contextPrompt: "What product/service and who is your target customer?"
- "location analysis" → contextPrompt: "Which city, neighborhood, or region should I analyze?"
- "competition" → contextPrompt: "Who are your main competitors or what industry?"
- "target audience" → contextPrompt: "Describe your ideal customer (age, income, interests)?"

If you see concepts like "research", "planning", "analysis", "design", "strategy" without specifics, ADD contextPrompt.

CRITICAL: Return ONLY valid JSON. No explanations, no commentary, no extra text. Just pure JSON.

Return JSON: { "branches": [{ "title": "Short Title (2-4 words)", "description": "Brief explanation (1-2 sentences)", "type": "concept|action|technical|question|risk", "complexity": 3, "autoExpand": false, "contextPrompt": "Specific question here or null", "relatedTo": ["node-key-1", "node-key-2"] | null }, ... ] }

The "relatedTo" field should contain keys of existing nodes that have meaningful conceptual
connections to this new branch. Only suggest strong connections, not tangential ones.

Example valid response:
{
  "branches": [
    {
      "title": "Market Analysis",
      "description": "Research target market size and demographics.",
      "type": "action",
      "complexity": 3,
      "autoExpand": false,
      "contextPrompt": null,
      "relatedTo": null
    }
  ]
}`;

    const nearbyNodesContext = getNearestNodes(centerNode, nodes, 10);
    const keyThemeCount = Object.values(nodes).filter(n => n.isKeyTheme).length;

    const userQuery = `Central idea: "${centerNode.text}"
${keyThemeCount > 0 ? `\n**This brainstorm has ${keyThemeCount} key theme(s) - prioritize connections.**` : ''}
Context: ${centerNode.description || "No additional context"}
${centerNode.contextInfo ? `Additional context: ${centerNode.contextInfo}` : ""}
${additionalContext ? `User input: ${additionalContext}` : ""}

Existing nearby nodes in the map:
${nearbyNodesContext}

Generate 6 diverse related ideas. Connect to key themes when relevant.`;

    // Prepare request payload
    const requestPayload = {
      model: GEMINI_TEXT_MODEL,
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7 + (creativity * 0.6), // 0.7-1.3 based on creativity
      },
    };

    // Validate request size
    const requestSize = JSON.stringify(requestPayload).length;
    if (requestSize > MAX_REQUEST_SIZE) {
      const errorMsg = "Context too large - try marking fewer key themes";
      setError(errorMsg);
      toast.error(errorMsg);
      setIsGenerating(false);
      return null;
    }

    // Create abort controller with timeout
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(buildApiUrl("generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      console.log("=== API Response ===", result);

      if (!response.ok) {
        console.error("HTTP Error:", response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check for API errors
      if (result.error) {
        console.error("API Error:", result.error);
        throw new Error(result.error.message || "API request failed");
      }

      let text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("=== Raw API text ===", text);

      if (!text) {
        console.error("No text in API response. Full result:", JSON.stringify(result, null, 2));
        throw new Error("API returned no content");
      }

      // Strip markdown code fences if present
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

      // Sanitize and parse JSON
      const sanitizedText = sanitizeJson(text);
      console.log("Sanitized text:", sanitizedText);
      let branches = [];

      try {
        const parsed = sanitizedText ? JSON.parse(sanitizedText) : {};
        branches = parsed.branches || [];
        console.log("Parsed branches:", branches);
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Sanitized text:", sanitizedText);
        // Try to extract branches using regex as fallback
        try {
          const branchMatches = sanitizedText.match(/"title"\s*:\s*"([^"]+)"/g) || [];
          const descMatches = sanitizedText.match(/"description"\s*:\s*"([^"]+)"/g) || [];
          const typeMatches = sanitizedText.match(/"type"\s*:\s*"([^"]+)"/g) || [];

          for (let i = 0; i < Math.min(6, branchMatches.length); i++) {
            branches.push({
              title: branchMatches[i]?.match(/"title"\s*:\s*"([^"]+)"/)?.[1] || `Idea ${i + 1}`,
              description: descMatches[i]?.match(/"description"\s*:\s*"([^"]+)"/)?.[1] || "",
              type: typeMatches[i]?.match(/"type"\s*:\s*"([^"]+)"/)?.[1] || "concept",
            });
          }
          console.log("Recovered branches via regex:", branches);
        } catch {
          branches = [];
        }
      }

      // Ensure exactly 6 branches by padding if needed
      const defaultTypes = ["concept", "action", "technical", "question", "risk", "concept"];
      while (branches.length < 6) {
        branches.push({
          title: `Idea ${branches.length + 1}`,
          description: `Related aspect of "${centerNode.text}"`,
          type: defaultTypes[branches.length % defaultTypes.length],
        });
      }

      // Build new nodes
      const newNodes: Record<string, HexNode> = {};

      DIRECTIONS.forEach((dir, i) => {
        const nQ = centerNode.q + dir.q;
        const nR = centerNode.r + dir.r;
        const neighborKey = getNodeKey(nQ, nR);
        const existing = nodes[neighborKey];
        const shouldUpdate =
          !existing || (forceRefresh && !existing.pinned && existing.parentId === key);

        if (shouldUpdate && branches[i]) {
          const nodeType = branches[i].type?.toLowerCase() || "concept";
          const validType = NODE_TYPES[nodeType] ? nodeType : "concept";
          const newDepth = (centerNode.depth || 0) + 1;

          // Extract and validate relatedTo connections
          const relatedNodeKeys = (branches[i].relatedTo || [])
            .filter((relKey: string) =>
              nodes[relKey] && relKey !== key && relKey !== neighborKey
            );

          const newNode: HexNode = {
            q: nQ,
            r: nR,
            text: branches[i].title || `Idea ${i + 1}`,
            description: branches[i].description || "",
            type: validType,
            depth: newDepth,
            parentId: key,
            pinned: false,
            clusterId: centerNode.clusterId,
            contextPrompt: branches[i].contextPrompt || undefined,
            relatedNodeKeys: relatedNodeKeys.length > 0 ? relatedNodeKeys : undefined,
          };

          newNodes[neighborKey] = newNode;
        }
      });

      setIsGenerating(false);

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]);

      return newNodes;

    } catch (err) {
      // Handle timeout specifically
      if (err instanceof Error && err.name === 'AbortError') {
        const errorMsg = "Request timeout - try again";
        setError(errorMsg);
        toast.error(errorMsg);
        setIsGenerating(false);
        return null;
      }

      console.error("AI Error:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to generate ideas";
      setError(errorMsg);
      setIsGenerating(false);

      // Generate placeholder nodes on error
      const newNodes: Record<string, HexNode> = {};
      const defaultTypes = ["concept", "action", "technical", "question", "risk", "concept"];

      DIRECTIONS.forEach((dir, i) => {
        const nQ = centerNode.q + dir.q;
        const nR = centerNode.r + dir.r;
        const neighborKey = getNodeKey(nQ, nR);

        if (!nodes[neighborKey]) {
          newNodes[neighborKey] = {
            q: nQ,
            r: nR,
            text: `Explore ${i + 1}`,
            description: `Click to expand from "${centerNode.text}"`,
            type: defaultTypes[i],
            depth: (centerNode.depth || 0) + 1,
            parentId: key,
            pinned: false,
          };
        }
      });

      return newNodes;
    } finally {
      abortControllerRef.current = null;
    }
  }, [creativity, nodes, NODE_TYPES, generationsThisSession, maxGenerationsPerSession, enableSmartExpansion]);

  /**
   * Generate deep dive analysis for a node
   */
  const generateDeepDive = useCallback(async (node: HexNode): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    const key = getNodeKey(node.q, node.r);

    // Gather context from connected nodes
    const connectedNodes = Object.values(nodes).filter(n =>
      n.parentId === key || key === n.parentId
    );
    const contextFromNetwork = connectedNodes.length > 0
      ? `\nRelated ideas in the brainstorm: ${connectedNodes.map(n => n.text).join(', ')}`
      : '';

    const prompt = `# Deep Dive Analysis: "${node.text}"

Context: ${node.description || "No additional context provided"}${contextFromNetwork}
Category: ${node.type}

Create a comprehensive, well-structured analysis document that could stand alone as a reference. Use clear Markdown formatting.

## Required Sections:

### 1. Executive Summary
A 2-3 sentence overview of what this concept is and why it matters.

### 2. Core Concepts
Explain the fundamental ideas, principles, or components. Define any important terms.

### 3. Key Considerations
What are the critical factors, trade-offs, or decisions involved? Include:
- Advantages and benefits
- Challenges and risks
- Dependencies and prerequisites

### 4. Implementation Approaches
Practical strategies, methods, or steps to explore or execute this concept. Be specific and actionable.

### 5. Related Concepts & Resources
What adjacent ideas should be explored? What fields or domains does this connect to?

### 6. Questions to Explore Further
5-7 thought-provoking questions that would deepen understanding or guide next steps.

### 7. Quick Reference
Bullet-point summary of the most important takeaways.

Write in a professional but accessible tone. Be thorough and substantive - this should be a useful reference document.`;

    try {
      const response = await fetch(buildApiUrl("generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GEMINI_TEXT_MODEL,
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      const result = await response.json();
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated.";

      setIsGenerating(false);
      return content;
    } catch (err) {
      const errorMsg = "Error generating content. Please try again.";
      setError(errorMsg);
      setIsGenerating(false);
      return errorMsg;
    }
  }, [nodes]);

  /**
   * Reset generation counter (e.g., on new session)
   */
  const resetGenerationCount = useCallback(() => {
    setGenerationsThisSession(0);
    setIsThrottled(false);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    error,
    creativity,
    generationsThisSession,
    isThrottled,

    // Actions
    setCreativity,
    generateNeighbors,
    generateDeepDive,
    resetGenerationCount,
    clearError,
  };
}
