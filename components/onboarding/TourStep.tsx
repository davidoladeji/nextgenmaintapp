'use client';

import { motion } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, CheckCircle, HelpCircle } from 'lucide-react';

interface TourStepProps {
  step: {
    id: string;
    title: string;
    content: string;
    position: 'center' | 'top' | 'bottom' | 'left' | 'right';
    target: string | null;
  };
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
  isLastStep: boolean;
  canGoPrevious: boolean;
}

export default function TourStep({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onClose,
  isLastStep,
  canGoPrevious,
}: TourStepProps) {
  // Get target element position for positioning
  const getStepPosition = () => {
    if (!step.target) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    // Try to find the target element
    const targetElement = document.querySelector(`[data-tour="${step.target}"]`) ||
                         document.querySelector(`#${step.target}`) ||
                         document.querySelector(`.${step.target}`);

    if (!targetElement) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const targetTop = rect.top + scrollTop;
    const targetLeft = rect.left + scrollLeft;
    const targetWidth = rect.width;
    const targetHeight = rect.height;

    // Calculate initial position
    let position: any = {};
    
    switch (step.position) {
      case 'top':
        position = {
          top: targetTop - 20,
          left: targetLeft + targetWidth / 2,
          transform: 'translate(-50%, -100%)',
        };
        break;
      case 'bottom':
        position = {
          top: targetTop + targetHeight + 20,
          left: targetLeft + targetWidth / 2,
          transform: 'translate(-50%, 0)',
        };
        break;
      case 'left':
        position = {
          top: targetTop + targetHeight / 2,
          left: targetLeft - 20,
          transform: 'translate(-100%, -50%)',
        };
        break;
      case 'right':
        position = {
          top: targetTop + targetHeight / 2,
          left: targetLeft + targetWidth + 20,
          transform: 'translate(0, -50%)',
        };
        break;
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    // Ensure the tour step stays within viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tourStepWidth = step.position === 'center' ? 512 : 384; // 32rem : 24rem
    const tourStepHeight = 300; // Approximate height

    // Adjust horizontal position if too far right
    if (position.left + tourStepWidth > viewportWidth) {
      position.left = viewportWidth - tourStepWidth - 20;
      position.transform = 'translate(0, -50%)';
    }
    
    // Adjust horizontal position if too far left
    if (position.left < 20) {
      position.left = 20;
      position.transform = 'translate(0, -50%)';
    }

    // Adjust vertical position if too far down
    if (position.top + tourStepHeight > viewportHeight + scrollTop) {
      position.top = viewportHeight + scrollTop - tourStepHeight - 20;
    }
    
    // Adjust vertical position if too far up
    if (position.top < scrollTop + 20) {
      position.top = scrollTop + 20;
    }

    return position;
  };

  const position = getStepPosition();

  // Highlight target element
  const highlightTarget = () => {
    if (!step.target) return;

    const targetElement = document.querySelector(`[data-tour="${step.target}"]`) ||
                         document.querySelector(`#${step.target}`) ||
                         document.querySelector(`.${step.target}`);

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute border-4 border-primary-400 rounded-lg shadow-lg pointer-events-none"
          style={{
            top: rect.top + scrollTop - 4,
            left: rect.left + scrollLeft - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            zIndex: 45,
          }}
        />
      );
    }
    return null;
  };

  return (
    <>
      {/* Target highlight */}
      {highlightTarget()}

      {/* Tour card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md w-full mx-4"
        style={{
          ...position,
          zIndex: 51,
          maxWidth: step.position === 'center' ? '32rem' : '24rem',
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-500">
                  Step {currentStep} of {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              title="Close tour"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 leading-relaxed">{step.content}</p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {canGoPrevious && (
                <button
                  onClick={onPrevious}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              )}
              
              {!isLastStep && (
                <button
                  onClick={onSkip}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip tour
                </button>
              )}
            </div>

            <button
              onClick={onNext}
              className={`flex items-center space-x-1 px-4 py-1.5 text-sm rounded-md transition-colors ${
                isLastStep
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isLastStep ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Tour</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pointer arrow */}
        {step.target && step.position !== 'center' && (
          <div
            className={`absolute w-0 h-0 border-8 ${
              step.position === 'top'
                ? 'border-l-transparent border-r-transparent border-b-transparent border-t-white top-full left-1/2 transform -translate-x-1/2'
                : step.position === 'bottom'
                ? 'border-l-transparent border-r-transparent border-t-transparent border-b-white bottom-full left-1/2 transform -translate-x-1/2'
                : step.position === 'left'
                ? 'border-t-transparent border-b-transparent border-r-transparent border-l-white left-full top-1/2 transform -translate-y-1/2'
                : 'border-t-transparent border-b-transparent border-l-transparent border-r-white right-full top-1/2 transform -translate-y-1/2'
            }`}
          />
        )}
      </motion.div>
    </>
  );
}