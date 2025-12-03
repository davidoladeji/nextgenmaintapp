'use client';

import { DashboardMetrics } from '@/types';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Target } from 'lucide-react';
import { useRiskSettings } from '@/lib/stores/riskSettingsStore';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const { getRPNColor, getRPNLabel } = useRiskSettings();

  // Get color for Average RPN card based on threshold settings
  const avgRPNColor = getRPNColor(metrics.averageRPN);

  const cards = [
    {
      title: 'Total Failure Modes',
      value: metrics.totalFailureModes,
      icon: Activity,
      color: 'bg-accent',
      textColor: 'text-accent',
      useHexColor: false
    },
    {
      title: 'High Risk Modes',
      value: metrics.highRiskModes,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      useHexColor: false
    },
    {
      title: 'Open Actions',
      value: metrics.openActions,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      useHexColor: false
    },
    {
      title: 'Completed Actions',
      value: metrics.completedActions,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      useHexColor: false
    },
    {
      title: 'Average RPN',
      value: metrics.averageRPN,
      icon: TrendingUp,
      color: avgRPNColor,
      textColor: avgRPNColor,
      useHexColor: true
    },
    {
      title: 'Critical Modes',
      value: metrics.criticalModes,
      icon: Target,
      color: 'bg-accent',
      textColor: 'text-accent',
      useHexColor: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-center">
              {card.useHexColor ? (
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${card.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: card.textColor }} />
                </div>
              ) : (
                <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              )}
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{card.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}