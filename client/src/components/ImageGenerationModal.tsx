import React, { useState } from 'react';
import { Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { buildApiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface HexNode {
  text: string;
  description?: string;
  type: string;
}

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: HexNode;
  onImageGenerated?: (imageUrl: string) => void;
}

type AspectRatio = '1:1' | '16:9' | '9:16';

const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Landscape (16:9)' },
  { value: '9:16', label: 'Portrait (9:16)' },
];

export default function ImageGenerationModal({
  isOpen,
  onClose,
  node,
  onImageGenerated,
}: ImageGenerationModalProps) {
  const { theme } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const generatePrompt = (): string => {
    // Build context-aware prompt from node data
    const parts: string[] = [];

    parts.push(node.text);

    if (node.description) {
      parts.push(node.description);
    }

    // Add type-specific context
    const typeDescriptions: Record<string, string> = {
      root: 'Core concept, central theme',
      concept: 'Abstract idea, conceptual visualization',
      action: 'Action-oriented, dynamic scene',
      technical: 'Technical diagram or illustration',
      question: 'Thought-provoking imagery',
      risk: 'Warning or caution themed',
    };

    if (typeDescriptions[node.type]) {
      parts.push(typeDescriptions[node.type]);
    }

    return parts.join('. ');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const prompt = generatePrompt();

      const response = await fetch(buildApiUrl('generate-image'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-2.5-flash-image',
          contents: [{
            parts: [{ text: prompt }],
          }],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: {
              aspectRatio: aspectRatio,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract base64 image data
      if (data.candidates?.[0]?.content?.parts?.[0]?.inline_data) {
        const { mimeType, data: base64Data } = data.candidates[0].content.parts[0].inline_data;
        const imageUrl = `data:${mimeType};base64,${base64Data}`;
        setGeneratedImage(imageUrl);

        if (onImageGenerated) {
          onImageGenerated(imageUrl);
        }
      } else {
        throw new Error('No image data in response');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `hivemind_${node.text.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-2xl mx-4 rounded-lg shadow-2xl ${
          theme === 'dark' ? 'bg-card border border-border' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-semibold text-foreground">Generate Image</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close modal"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Node Info */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <h3 className="font-semibold text-foreground mb-1">{node.text}</h3>
            {node.description && (
              <p className="text-sm text-muted-foreground">{node.description}</p>
            )}
          </div>

          {/* Aspect Ratio Selection */}
          {!generatedImage && (
            <div className="space-y-2">
              <Label className="text-foreground">Aspect Ratio</Label>
              <div className="flex gap-2">
                {ASPECT_RATIO_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAspectRatio(option.value)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      aspectRatio === option.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generated Image Display */}
          {generatedImage && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={generatedImage}
                  alt={`Generated image for ${node.text}`}
                  className="w-full h-auto"
                />
              </div>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full border-border text-foreground"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
              <p className="text-muted-foreground">Generating image...</p>
            </div>
          )}

          {/* Actions */}
          {!generatedImage && !isGenerating && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-border text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
            </div>
          )}

          {generatedImage && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setGeneratedImage(null);
                  setError(null);
                }}
                variant="outline"
                className="flex-1 border-border text-foreground"
              >
                Generate Another
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
