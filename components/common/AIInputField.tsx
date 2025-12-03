'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

interface AIInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'text' | 'textarea';
  aiContext?: {
    type: 'cause' | 'effect' | 'control' | 'action' | 'processStep' | 'failureMode' | 'component';
    asset?: any;
    failureMode?: any;
    processStep?: string;
    cause?: any;
    effect?: any;
  };
  disabled?: boolean;
  rows?: number;
  token?: string;
}

export default function AIInputField({
  value,
  onChange,
  placeholder,
  className = '',
  type = 'text',
  aiContext,
  disabled = false,
  rows = 3,
  token,
}: AIInputFieldProps) {
  const [aiLoading, setAiLoading] = useState(false);

  const handleAISuggest = async () => {
    if (!aiContext || !token) {
      toast.error('AI suggestions not available');
      return;
    }

    setAiLoading(true);
    try {
      // For component/failureMode/processStep/effect types, use the duplicate endpoint for single name generation
      if (['component', 'failureMode', 'processStep', 'effect'].includes(aiContext.type)) {
        const response = await fetch('/api/ai/duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: aiContext.type === 'component' ? 'component' :
                  aiContext.type === 'failureMode' ? 'failureMode' : 'effect',
            originalName: value || 'New Item',
            context: {
              componentName: aiContext.asset?.name,
              failureModeName: aiContext.failureMode?.failure_mode || aiContext.failureMode?.name,
            },
          }),
        });

        const result = await response.json();
        if (result.success && result.data?.name) {
          onChange(result.data.name);
          toast.success('AI suggestion applied!');
        } else {
          throw new Error(result.error || 'No suggestions available');
        }
      } else {
        // For cause/effect/control types, use the existing bulk suggestion endpoint
        const response = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: aiContext.type === 'cause' ? 'causes' :
                  aiContext.type === 'effect' ? 'effects' :
                  aiContext.type === 'control' ? 'controls' :
                  aiContext.type === 'action' ? 'actions' :
                  'general',
            context: {
              asset: aiContext.asset,
              failureMode: aiContext.failureMode,
              processStep: aiContext.processStep,
              cause: aiContext.cause,
              effect: aiContext.effect,
            },
          }),
        });

        const result = await response.json();
        if (result.success && result.data.suggestions?.length > 0) {
          // Use the first suggestion
          onChange(result.data.suggestions[0].text);
          toast.success('AI suggestion applied!');
        } else {
          throw new Error(result.error || 'No suggestions available');
        }
      }
    } catch (error) {
      toast.error('AI suggestions temporarily unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  const inputClasses = `input ${className} ${aiContext ? 'pr-10' : ''}`;

  return (
    <div className="relative">
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
          disabled={disabled}
          rows={rows}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
          disabled={disabled}
        />
      )}

      {aiContext && token && (
        <button
          type="button"
          onClick={handleAISuggest}
          disabled={aiLoading || disabled}
          className="absolute right-2 top-2 p-1.5 hover:bg-purple-50 rounded-md transition-colors group"
          title="Get AI suggestion"
        >
          {aiLoading ? (
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
          )}
        </button>
      )}
    </div>
  );
}
