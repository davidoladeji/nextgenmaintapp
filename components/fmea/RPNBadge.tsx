'use client';

interface RPNBadgeProps {
  rpn: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * RPN Badge Component
 * Displays RPN value with color coding based on risk level
 *
 * Color bands:
 * - Red (Critical): >150
 * - Orange (High): 100-150
 * - Yellow (Medium): 70-99
 * - Green (Low): <70
 */
export default function RPNBadge({ rpn, showLabel = true, size = 'md' }: RPNBadgeProps) {
  // Determine risk band based on RPN value
  const band = (rpn: number) => {
    if (rpn > 150) return { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-50', borderColor: 'border-red-600' };
    if (rpn >= 100) return { label: 'High', color: 'bg-orange-500', textColor: 'text-orange-50', borderColor: 'border-orange-600' };
    if (rpn >= 70) return { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-50', borderColor: 'border-yellow-600' };
    return { label: 'Low', color: 'bg-green-500', textColor: 'text-green-50', borderColor: 'border-green-600' };
  };

  const riskBand = band(rpn);

  // Size variations
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const labelSizeClasses = {
    sm: 'text-[10px] mt-0.5',
    md: 'text-xs mt-1',
    lg: 'text-sm mt-1'
  };

  return (
    <div className="inline-flex flex-col items-center">
      <span
        className={`inline-flex items-center justify-center rounded-full font-bold border-2 ${riskBand.color} ${riskBand.textColor} ${riskBand.borderColor} ${sizeClasses[size]} min-w-[60px] shadow-sm`}
      >
        RPN {rpn}
      </span>
      {showLabel && (
        <span className={`font-medium ${riskBand.color.replace('bg-', 'text-')} ${labelSizeClasses[size]}`}>
          {riskBand.label}
        </span>
      )}
    </div>
  );
}
