'use client';

import { useEffect } from 'react';
import { SmartTable } from '@/components/fmea/v2/SmartTable';
import { useFMEAStore } from '@/lib/stores/fmea-store';

export default function FMEATestPage() {
  const { components, addComponent, addFailureMode, addEffect } = useFMEAStore();

  // Add sample data on mount if store is empty
  useEffect(() => {
    if (components.length === 0) {
      // Add Drive Train component
      const driveTrainId = addComponent({
        name: 'Drive Train',
        function: 'Transfers power from motor to wheels',
      });

      // Add Seal Leakage failure mode
      const sealLeakageId = addFailureMode(driveTrainId, {
        name: 'Seal Leakage',
        owner: 'John Smith',
      });

      // Add effects for Seal Leakage
      addEffect(sealLeakageId, {
        effects: 'Safety hazard',
        sev: 7,
        potentialCause: 'Worn seal',
        occ: 5,
        currentDesign: 'Regular inspection',
        det: 3,
        justificationPre: 'Based on historical data',
        recommendedActions: 'Fit captive tool-operated fasteners on all access panels',
        justificationPost: 'Improved design prevents seal wear',
        responsible: 'Engineering Team',
        actionStatus: 'Not Started',
        sevPost: 3,
        occPost: 2,
        detPost: 2,
      });

      addEffect(sealLeakageId, {
        effects: 'Plant downtime',
        sev: 5,
        potentialCause: 'Age degradation',
        occ: 4,
        currentDesign: 'Visual checks',
        det: 4,
        justificationPre: 'Industry standard',
        recommendedActions: 'Implement predictive maintenance schedule',
        justificationPost: 'Early detection reduces downtime',
        responsible: 'Maintenance Team',
        actionStatus: 'Not Started',
        sevPost: 2,
        occPost: 2,
        detPost: 2,
      });

      // Add Rod damage failure mode
      const rodDamageId = addFailureMode(driveTrainId, {
        name: 'Rod damage',
        owner: 'Jane Doe',
      });

      addEffect(rodDamageId, {
        effects: 'Complete system failure',
        sev: 9,
        potentialCause: 'Excessive load',
        occ: 3,
        currentDesign: 'Load monitoring system',
        det: 5,
        justificationPre: 'Rare but catastrophic',
        recommendedActions: 'Install redundant monitoring and automatic shutoff',
        justificationPost: 'Redundancy prevents catastrophic failure',
        responsible: 'Safety Team',
        actionStatus: 'Not Started',
        sevPost: 4,
        occPost: 1,
        detPost: 2,
      });

      // Add Gear Box component
      const gearBoxId = addComponent({
        name: 'Gear Box',
        function: 'Transmits torque and adjusts speed ratio',
      });

      const gearWearId = addFailureMode(gearBoxId, {
        name: 'Gear tooth wear',
        owner: 'Mike Johnson',
      });

      addEffect(gearWearId, {
        effects: 'Reduced efficiency',
        sev: 6,
        potentialCause: 'Insufficient lubrication',
        occ: 6,
        currentDesign: 'Scheduled oil changes',
        det: 4,
        justificationPre: 'Common failure mode',
        recommendedActions: 'Install oil quality sensors',
        justificationPost: 'Real-time monitoring improves detection',
        responsible: 'Maintenance Team',
        actionStatus: 'Not Started',
        sevPost: 3,
        occPost: 3,
        detPost: 2,
      });

      // Add Hydraulics component
      const hydraulicsId = addComponent({
        name: 'Hydraulics',
        function: 'Provides hydraulic power for actuation',
      });

      const pumpFailureId = addFailureMode(hydraulicsId, {
        name: 'Pump failure',
        owner: 'Sarah Williams',
      });

      addEffect(pumpFailureId, {
        effects: 'Loss of hydraulic pressure',
        sev: 8,
        potentialCause: 'Cavitation',
        occ: 4,
        currentDesign: 'Pressure monitoring',
        det: 6,
        justificationPre: 'Critical system component',
        recommendedActions: 'Implement flow rate monitoring and alarm system',
        justificationPost: 'Early warning prevents pump damage',
        responsible: 'Engineering Team',
        actionStatus: 'Not Started',
        sevPost: 4,
        occPost: 2,
        detPost: 3,
      });
    }
  }, [components.length, addComponent, addFailureMode, addEffect]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">
            FMEA Smart Table Test
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Testing the rebuilt Smart Table with hierarchical structure and internal horizontal scrollbar
          </p>
        </div>

        <SmartTable />
      </div>
    </div>
  );
}
