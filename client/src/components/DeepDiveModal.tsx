import React from 'react';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DeepDiveModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  isLoading: boolean;
}

export default function DeepDiveModal({
  isOpen,
  title,
  content,
  isLoading
}: DeepDiveModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {isLoading ? (
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
      ) : (
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </>
  );
}
