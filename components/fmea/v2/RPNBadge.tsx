'use client';

import { useRiskSettings, CriticalityThreshold } from '@/lib/stores/riskSettingsStore';

interface RPNBadgeProps {
  value: number;
  showLabel?: boolean;
  showTooltip?: boolean;
  formula?: string; // e.g., "7 × 5 × 3 = 105"
  thresholds?: CriticalityThreshold[];
  className?: string;
}

export function RPNBadge({
  value,
  showLabel = true,
  showTooltip = false,
  formula,
  thresholds: propThresholds,
  className = '',
}: RPNBadgeProps) {
  const { thresholds: globalThresholds, getRPNColor, getRPNLabel } = useRiskSettings();
  const thresholds = propThresholds || globalThresholds;

  const color = getRPNColor(value);
  const label = getRPNLabel(value);

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={showTooltip && formula ? formula : undefined}
    >
      {/* RPN Value Badge */}
      <span
        className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{
          backgroundColor: `${color}20`,
          color: color,
        }}
      >
        RPN {value}
      </span>

      {/* Risk Level Label */}
      {showLabel && (
        <span
          className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide"
          style={{
            backgroundColor: `${color}15`,
            color: color,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
