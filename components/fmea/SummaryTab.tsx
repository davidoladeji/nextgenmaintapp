'use client';

import { useState, useEffect } from 'react';
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { Project, Component, FailureMode } from '@/types';
import { useAuth } from '@/lib/store';

interface SummaryTabProps {
  project: Project;
}

export default function SummaryTab({ project }: SummaryTabProps) {
  const { token } = useAuth();
  const [components, setComponents] = useState<Component[]>([]);
  const [failureModes, setFailureModes] = useState<FailureMode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    try {
      const [componentsRes, failureModesRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/components`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/projects/${project.id}/failure-modes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const componentsData = await componentsRes.json();
      const failureModesData = await failureModesRes.json();

      if (componentsData.success) {
        setComponents(componentsData.data);
      }
      if (failureModesData.success) {
        setFailureModes(failureModesData.data);
      }
    } catch (error) {
      console.error('Failed to load summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMaxRPN = (failureMode: FailureMode) => {
    if (!failureMode.causes?.length || !failureMode.effects?.length) return 0;

    let maxRPN = 0;
    for (const cause of failureMode.causes) {
      for (const effect of failureMode.effects) {
        const detection = failureMode.controls?.length
          ? Math.min(...failureMode.controls.map(c => c.detection))
          : 10;
        const rpn = effect.severity * cause.occurrence * detection;
        maxRPN = Math.max(maxRPN, rpn);
      }
    }
    return maxRPN;
  };

  // Calculate summary metrics
  const totalComponents = components.length;
  const totalFailureModes = failureModes.length;

  const rpnValues = failureModes.map(fm => calculateMaxRPN(fm));
  const totalRPN = rpnValues.reduce((sum, rpn) => sum + rpn, 0);
  const avgRPN = totalFailureModes > 0 ? Math.round(totalRPN / totalFailureModes) : 0;
  const highestRPN = Math.max(...rpnValues, 0);

  const criticalRisks = failureModes.filter(fm => calculateMaxRPN(fm) > 150).length;
  const highRisks = failureModes.filter(fm => {
    const rpn = calculateMaxRPN(fm);
    return rpn > 100 && rpn <= 150;
  }).length;

  // Count actions
  let totalActions = 0;
  let openActions = 0;
  let completedActions = 0;

  failureModes.forEach(fm => {
    if (fm.actions) {
      fm.actions.forEach(action => {
        totalActions++;
        if (action.status === 'completed') {
          completedActions++;
        } else {
          openActions++;
        }
      });
    }
  });

  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Find top 5 highest risk failure modes
  const topRisks = failureModes
    .map(fm => ({
      failureMode: fm,
      rpn: calculateMaxRPN(fm),
      component: components.find(c => c.id === fm.component_id),
    }))
    .sort((a, b) => b.rpn - a.rpn)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading summary...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-monday-purple via-monday-softPurple to-monday-pink rounded-lg shadow-xl p-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-white/90 text-sm mt-1">Executive Summary Report</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/15 rounded-lg p-3 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
            <div className="text-2xl font-bold">{totalComponents}</div>
            <div className="text-sm text-white/90">Components</div>
          </div>
          <div className="bg-white/15 rounded-lg p-3 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
            <div className="text-2xl font-bold">{totalFailureModes}</div>
            <div className="text-sm text-white/90">Failure Modes</div>
          </div>
          <div className="bg-white/15 rounded-lg p-3 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
            <div className="text-2xl font-bold">{avgRPN}</div>
            <div className="text-sm text-white/90">Avg RPN</div>
          </div>
          <div className="bg-white/15 rounded-lg p-3 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="text-sm text-white/90">Actions Complete</div>
          </div>
        </div>
      </div>

      {/* Key Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Highest Risk */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-status-critical/30 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-status-critical to-status-high rounded-lg shadow-md">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-monday-darkNavy">Highest Risk</h3>
              <p className="text-sm text-gray-600">Top priority for mitigation</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold bg-gradient-to-r from-status-critical to-status-high bg-clip-text text-transparent">{highestRPN}</span>
              <span className="text-sm text-gray-500">RPN</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Critical (&gt;150):</span>
                <span className="font-semibold text-gray-900">{criticalRisks}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">High (100-150):</span>
                <span className="font-semibold text-gray-900">{highRisks}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Open Actions</h3>
              <p className="text-sm text-gray-600">Pending mitigations</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-blue-600">{openActions}</span>
              <span className="text-sm text-gray-500">actions</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Actions:</span>
                <span className="font-semibold text-gray-900">{totalActions}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Completed:</span>
                <span className="font-semibold text-green-600">{completedActions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
              <p className="text-sm text-gray-600">Mitigation completion</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-green-600">{completionRate}%</span>
              <span className="text-sm text-gray-500">complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Risks */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Top 5 Risks Requiring Attention</h2>
          <p className="text-sm text-gray-600 mt-1">Failure modes with the highest RPN values</p>
        </div>
        <div className="p-6">
          {topRisks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No failure modes analyzed yet
            </div>
          ) : (
            <div className="space-y-4">
              {topRisks.map((item, index) => (
                <div key={item.failureMode.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.failureMode.failure_mode}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Component:</span> {item.component?.name || 'N/A'}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                          item.rpn > 150 ? 'bg-red-100 text-red-800 border border-red-300'
                          : item.rpn > 100 ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : item.rpn > 70 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : 'bg-green-100 text-green-800 border border-green-300'
                        }`}>
                          RPN: {item.rpn}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-600">
                      {item.failureMode.causes && item.failureMode.causes[0] && (
                        <span>OCC: {item.failureMode.causes[0].occurrence}</span>
                      )}
                      {item.failureMode.effects && item.failureMode.effects[0] && (
                        <span>SEV: {item.failureMode.effects[0].severity}</span>
                      )}
                      {item.failureMode.controls && item.failureMode.controls[0] && (
                        <span>DET: {item.failureMode.controls[0].detection}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Key Recommendations</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              {criticalRisks > 0 && (
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Prioritize mitigation of {criticalRisks} critical risk{criticalRisks > 1 ? 's' : ''} (RPN &gt; 150) immediately</span>
                </li>
              )}
              {openActions > 0 && (
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Complete {openActions} pending action{openActions > 1 ? 's' : ''} to reduce overall risk exposure</span>
                </li>
              )}
              {avgRPN > 100 && (
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Average RPN of {avgRPN} indicates medium risk level - focus on high-impact mitigations</span>
                </li>
              )}
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Review and update FMEA regularly as design, processes, or controls change</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Document lessons learned and share best practices across the organization</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Project Metadata */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Project Name:</span>
            <span className="ml-2 font-medium text-gray-900">{project.name}</span>
          </div>
          {project.description && (
            <div>
              <span className="text-gray-600">Description:</span>
              <span className="ml-2 font-medium text-gray-900">{project.description}</span>
            </div>
          )}
          <div>
            <span className="text-gray-600">Created:</span>
            <span className="ml-2 font-medium text-gray-900">
              {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Last Updated:</span>
            <span className="ml-2 font-medium text-gray-900">
              {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
