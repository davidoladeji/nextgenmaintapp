import { NextRequest, NextResponse } from 'next/server';
import { readDatabase } from '@/lib/database-simple';
import { DashboardMetrics, ChartData, FailureMode, Cause, Effect, Control, Action } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const db = readDatabase();

    // Verify project exists
    const project = db.projects.find((p: any) => p.id === projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get all failure modes for this project
    const failureModes = db.failureModes.filter((fm: any) => fm.project_id === projectId);

    // Get related data
    const allCauses = db.causes.filter((c: any) => 
      failureModes.some((fm: FailureMode) => fm.id === c.failure_mode_id)
    );
    const allEffects = db.effects.filter((e: any) => 
      failureModes.some((fm: FailureMode) => fm.id === e.failure_mode_id)
    );
    const allControls = db.controls.filter((c: any) => 
      failureModes.some((fm: FailureMode) => fm.id === c.failure_mode_id)
    );
    const allActions = db.actions.filter((a: any) => 
      failureModes.some((fm: FailureMode) => fm.id === a.failure_mode_id)
    );

    // Calculate RPN for each failure mode
    const failureModesWithRPN = failureModes.map((fm: any) => {
      const causes = allCauses.filter((c: any) => c.failure_mode_id === fm.id);
      const effects = allEffects.filter((e: any) => e.failure_mode_id === fm.id);
      const controls = allControls.filter((c: any) => c.failure_mode_id === fm.id);

      let maxRPN = 0;
      let maxSeverity = 0;
      let maxOccurrence = 0;
      let maxDetection = 10;

      if (causes.length > 0 && effects.length > 0) {
        for (const cause of causes) {
          for (const effect of effects) {
            const detectionScore = controls.length > 0
              ? Math.min(...controls.map((c: any) => c.detection))
              : 10;
            
            const rpn = effect.severity * cause.occurrence * detectionScore;
            if (rpn > maxRPN) {
              maxRPN = rpn;
              maxSeverity = effect.severity;
              maxOccurrence = cause.occurrence;
              maxDetection = detectionScore;
            }
          }
        }
      }

      return {
        ...fm,
        rpn: maxRPN,
        severity: maxSeverity,
        occurrence: maxOccurrence,
        detection: maxDetection
      };
    });

    // Calculate dashboard metrics
    const metrics: DashboardMetrics = {
      totalFailureModes: failureModes.length,
      highRiskModes: failureModesWithRPN.filter((fm: any) => fm.rpn >= 200).length,
      openActions: allActions.filter((a: any) => a.status === 'open').length,
      completedActions: allActions.filter((a: any) => a.status === 'completed').length,
      averageRPN: failureModesWithRPN.length > 0
        ? Math.round(failureModesWithRPN.reduce((sum: number, fm: any) => sum + fm.rpn, 0) / failureModesWithRPN.length)
        : 0,
      criticalModes: failureModesWithRPN.filter((fm: any) => fm.rpn >= 300).length
    };

    // Calculate chart data
    const chartData: ChartData = {
      // RPN Heatmap data
      rpnHeatmap: failureModesWithRPN.map((fm: any) => ({
        severity: fm.severity,
        occurrence: fm.occurrence,
        detection: fm.detection,
        count: 1,
        rpn: fm.rpn
      })),

      // Top 10 highest risk failure modes
      topRisks: failureModesWithRPN
        .sort((a: any, b: any) => b.rpn - a.rpn)
        .slice(0, 10)
        .map((fm: any) => ({
          failureMode: fm.failure_mode.length > 30 
            ? fm.failure_mode.substring(0, 30) + '...'
            : fm.failure_mode,
          rpn: fm.rpn,
          severity: fm.severity,
          occurrence: fm.occurrence,
          detection: fm.detection
        })),

      // Risk distribution
      riskDistribution: [
        {
          range: 'Low (1-49)',
          count: failureModesWithRPN.filter((fm: any) => fm.rpn >= 1 && fm.rpn <= 49).length,
          percentage: 0
        },
        {
          range: 'Medium (50-99)',
          count: failureModesWithRPN.filter((fm: any) => fm.rpn >= 50 && fm.rpn <= 99).length,
          percentage: 0
        },
        {
          range: 'High (100-199)',
          count: failureModesWithRPN.filter((fm: any) => fm.rpn >= 100 && fm.rpn <= 199).length,
          percentage: 0
        },
        {
          range: 'Critical (200+)',
          count: failureModesWithRPN.filter((fm: any) => fm.rpn >= 200).length,
          percentage: 0
        }
      ].map(item => ({
        ...item,
        percentage: failureModesWithRPN.length > 0 
          ? Math.round((item.count / failureModesWithRPN.length) * 100)
          : 0
      })),

      // Action status distribution (from Smart Table effects)
      actionStatus: [
        {
          status: 'Open',
          count: allEffects.filter((e: any) => !e.action_status || e.action_status === 'Not Started').length,
          percentage: 0
        },
        {
          status: 'In Progress',
          count: allEffects.filter((e: any) => e.action_status === 'In Progress').length,
          percentage: 0
        },
        {
          status: 'Completed',
          count: allEffects.filter((e: any) => e.action_status === 'Done').length,
          percentage: 0
        }
      ].map(item => ({
        ...item,
        percentage: allEffects.length > 0
          ? Math.round((item.count / allEffects.length) * 100)
          : 0
      }))
    };

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        chartData
      }
    });

  } catch (error) {
    console.error('Error fetching project metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}