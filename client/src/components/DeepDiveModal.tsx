import React from 'react';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <>
      {isLoading ? (
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
      ) : (
        <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </>
  );
}
