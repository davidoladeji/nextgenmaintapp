'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useUI } from '@/lib/store';
import TourStep from './TourStep';

type OnboardingStep = {
  id: string;
  title: string;
  content: string;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
  target: string | null;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI-Assisted FMEA Builder!',
    content: 'This powerful tool helps you conduct Failure Mode and Effects Analysis with AI assistance. Let\'s take a quick tour to get you started.',
    position: 'center',
    target: null,
  },
  {
    id: 'header',
    title: 'Header Controls',
    content: 'The header contains your project information, AI assistant toggle, and user menu. Click the bot icon to open/close the AI assistant.',
    position: 'bottom',
    target: 'header',
  },
  {
    id: 'sidebar',
    title: 'Command Center',
    content: 'Your command center provides quick access to create new items, get AI suggestions, search, and export your FMEA data.',
    position: 'right',
    target: 'sidebar',
  },
  {
    id: 'quick-add',
    title: 'Quick Add Section',
    content: 'Quickly create new failure modes and other FMEA elements. The "Failure Mode" button opens a comprehensive form.',
    position: 'right',
    target: 'quick-add',
  },
  {
    id: 'ai-actions',
    title: 'AI Actions',
    content: 'Get intelligent suggestions for failure modes, causes, effects, and risk assessments. These buttons open the AI assistant with relevant prompts.',
    position: 'right',
    target: 'ai-actions',
  },
  {
    id: 'main-content',
    title: 'FMEA Workspace',
    content: 'This is where your FMEA analysis takes place. You can switch between table and card views to work with your failure modes.',
    position: 'left',
    target: 'main-content',
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    content: 'Your floating AI assistant is always available to help with FMEA analysis. You can drag it around, minimize it, and get contextual suggestions.',
    position: 'top',
    target: 'ai-assistant',
  },
  {
    id: 'workflow',
    title: 'FMEA Workflow',
    content: 'Start by creating a project, then add failure modes. For each mode, define causes, effects, controls, and actions. The AI assistant can help with suggestions.',
    position: 'center',
    target: null,
  },
];

export default function OnboardingGuide() {
  const { 
    onboarding, 
    setOnboardingStep, 
    completeOnboarding, 
    setOnboardingActive,
    setAiChatMinimized 
  } = useUI();

  const currentStepData = ONBOARDING_STEPS[onboarding.currentStep];
  const isLastStep = onboarding.currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      const nextStep = onboarding.currentStep + 1;
      
      // Special handling for AI assistant step - make sure it's visible
      if (ONBOARDING_STEPS[nextStep]?.id === 'ai-assistant') {
        setAiChatMinimized(false);
      }
      
      setOnboardingStep(nextStep);
    }
  };

  const handlePrevious = () => {
    if (onboarding.currentStep > 0) {
      setOnboardingStep(onboarding.currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const handleClose = () => {
    setOnboardingActive(false);
  };

  // Handle step-specific setup
  useEffect(() => {
    if (!onboarding.isActive) return;
    
    // Special handling for AI assistant step - make sure it's visible
    if (currentStepData?.id === 'ai-assistant') {
      setAiChatMinimized(false);
    }
  }, [onboarding.currentStep, onboarding.isActive, currentStepData?.id]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!onboarding.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onboarding.isActive, onboarding.currentStep]);

  if (!onboarding.isActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Tour Step */}
        <TourStep
          step={currentStepData}
          currentStep={onboarding.currentStep + 1}
          totalSteps={ONBOARDING_STEPS.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSkip={handleSkip}
          onClose={handleClose}
          isLastStep={isLastStep}
          canGoPrevious={onboarding.currentStep > 0}
        />

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2"
        >
          <div className="bg-white dark:bg-slate-800 rounded-full px-4 py-2 shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === onboarding.currentStep
                      ? 'bg-primary-600'
                      : index < onboarding.currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Keyboard shortcuts hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-4 right-4 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 shadow-lg border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-400"
        >
          <div>Use ← → arrow keys or ESC to exit</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}