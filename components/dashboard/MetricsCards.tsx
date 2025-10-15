'use client';

import { DashboardMetrics } from '@/types';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Target } from 'lucide-react';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
}

export default function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: 'Total Failure Modes',
      value: metrics.totalFailureModes,
      icon: Activity,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'High Risk Modes',
      value: metrics.highRiskModes,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: 'Open Actions',
      value: metrics.openActions,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Completed Actions',
      value: metrics.completedActions,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Average RPN',
      value: metrics.averageRPN,
      icon: TrendingUp,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Critical Modes',
      value: metrics.criticalModes,
      icon: Target,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}