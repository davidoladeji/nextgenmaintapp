'use client';

import { useEffect, useState, useCallback } from 'react';
import { Project, Component as BackendComponent, FailureMode as BackendFailureMode, Effect as BackendEffect } from '@/types';
import { useAuth } from '@/lib/store';
import { Component, FailureMode, Effect, CreateComponentInput, CreateFailureModeInput, CreateEffectInput } from '@/lib/types/fmea';
import { ComponentRow } from './ComponentRow';
import { Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { SelectionToolbar } from './SelectionToolbar';
import { EditOwnerModal } from './EditOwnerModal';
import { SimpleEditModal } from './SimpleEditModal';
import { motion } from 'framer-motion';
import { generateAIDuplicateNameWithToast } from '@/lib/ai-utils';
import { useRiskSettings } from '@/lib/stores/riskSettingsStore';

interface SmartTableIntegratedProps {
  project: Project;
  components: BackendComponent[];
}

export function SmartTableIntegrated({ project, components: backendComponents }: SmartTableIntegratedProps) {
  const { token } = useAuth();
  const { matrixSize, scaleType, thresholds, getRPNColor, getRPNLabel } = useRiskSettings();
  const maxRating = scaleType === '1-5' ? 5 : 10;
  const [components, setComponents] = useState<Component[]>([]);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [expandedFailureModes, setExpandedFailureModes] = useState<Set<string>>(new Set());
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedFailureModeId, setSelectedFailureModeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showFailureModeModal, setShowFailureModeModal] = useState(false);
  const [showEffectModal, setShowEffectModal] = useState(false);

  // Selection state for Monday.com-style toolbar
  const [selectedItem, setSelectedItem] = useState<{
    type: 'component' | 'failureMode' | 'effect';
    id: string;
    data: any;
  } | null>(null);
  const [showEditOwnerModal, setShowEditOwnerModal] = useState(false);

  // Edit mode state - stores the item being edited
  const [editingItem, setEditingItem] = useState<{
    type: 'component' | 'failureMode' | 'effect';
    id: string;
    data: any;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Transform backend data to v2 format
  const transformBackendData = useCallback((backendComponents: BackendComponent[]): Component[] => {
    return backendComponents.map((backendComp) => {
      const failureModes: FailureMode[] = (backendComp.failureModes || []).map((backendFM) => {
        const effects: Effect[] = (backendFM.effects || []).map((backendEffect) => {
          // Get related cause and control for OCC and DET values
          const relatedCause = backendFM.causes?.[0]; // Simplified: take first cause
          const relatedControl = backendFM.controls?.[0]; // Simplified: take first control
          const relatedAction = backendFM.actions?.[0]; // Simplified: take first action

          const sev = backendEffect.severity || 5;
          const occ = relatedCause?.occurrence || 5;
          const det = relatedControl?.detection || 5;

          const sevPost = backendEffect.severity_post || sev;
          const occPost = backendEffect.occurrence_post || occ;
          const detPost = backendEffect.detection_post || det;

          return {
            id: backendEffect.id,
            failureModeId: backendFM.id,

            // Pre-Mitigation
            effects: backendEffect.description || '',
            sev,
            potentialCause: backendEffect.potential_cause || relatedCause?.description || '',
            occ,
            currentDesign: backendEffect.current_design || '',
            det,
            justificationPre: backendEffect.justification_pre || '',
            rpnPre: sev * occ * det,

            // Post-Mitigation
            recommendedActions: relatedAction?.description || '',
            justificationPost: backendEffect.justification_post || '',
            responsible: backendEffect.responsible || relatedAction?.owner || '',
            actionStatus: (backendEffect.action_status || 'Not Started') as 'Not Started' | 'In Progress' | 'Done',
            sevPost,
            occPost,
            detPost,
            rpnPost: sevPost * occPost * detPost,

            createdAt: new Date(backendEffect.created_at),
            updatedAt: new Date(backendEffect.updated_at),
          };
        });

        return {
          id: backendFM.id,
          componentId: backendComp.id,
          name: backendFM.failure_mode || '',
          owner: backendFM.actions?.[0]?.owner || 'Unassigned',
          effects,
          createdAt: new Date(backendFM.created_at),
          updatedAt: new Date(backendFM.updated_at),
        };
      });

      return {
        id: backendComp.id,
        name: backendComp.name,
        function: backendComp.function || backendComp.description || '',
        failureModes,
        createdAt: new Date(backendComp.created_at),
        updatedAt: new Date(backendComp.updated_at),
      };
    });
  }, []);

  // Load and transform data
  useEffect(() => {
    setLoading(true);
    const transformed = transformBackendData(backendComponents);
    setComponents(transformed);
    setLoading(false);
  }, [backendComponents, transformBackendData]);

  // Click outside and ESC to clear selection
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('.smart-table-row') &&
        !target.closest('.selection-toolbar') &&
        !target.closest('[role="dialog"]')
      ) {
        setSelectedItem(null);
        setShowEditOwnerModal(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEditOwnerModal) {
          setShowEditOwnerModal(false);
        } else {
          setSelectedItem(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showEditOwnerModal]);

  // Add Component
  const handleAddComponent = async (input: CreateComponentInput) => {
    try {
      const response = await fetch(`/api/projects/${project.id}/components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: input.name,
          description: null,
          function: input.function || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Component added successfully');

        // Update local state with new component
        const newComponent = result.data;

        setComponents(prev => [
          ...prev,
          {
            id: newComponent.id,
            name: newComponent.name,
            function: newComponent.function || newComponent.description || '',
            failureModes: [],
            createdAt: new Date(newComponent.created_at),
            updatedAt: new Date(newComponent.updated_at),
          }
        ]);
      } else {
        toast.error(result.error || 'Failed to add component');
      }
    } catch (error) {
      console.error('Error adding component:', error);
      toast.error('Failed to add component');
    }
  };

  // Add Failure Mode
  const handleAddFailureMode = async (input: CreateFailureModeInput) => {
    if (!selectedComponentId) return;

    try {
      const response = await fetch(`/api/components/${selectedComponentId}/failure-modes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          failureMode: input.name,
          processStep: '',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Failure mode added successfully');

        // Update local state with new failure mode
        const newFailureMode = result.data;

        setComponents(prev => prev.map(comp =>
          comp.id === selectedComponentId
            ? {
                ...comp,
                failureModes: [
                  ...comp.failureModes,
                  {
                    id: newFailureMode.id,
                    componentId: comp.id,
                    name: newFailureMode.failure_mode || newFailureMode.name,
                    owner: newFailureMode.owner || '',
                    effects: [],
                    createdAt: new Date(newFailureMode.created_at),
                    updatedAt: new Date(newFailureMode.updated_at),
                  }
                ]
              }
            : comp
        ));
      } else {
        toast.error(result.error || 'Failed to add failure mode');
      }
    } catch (error) {
      console.error('Error adding failure mode:', error);
      toast.error('Failed to add failure mode');
    }
  };

  // Add Effect
  const handleAddEffect = async (input: CreateEffectInput) => {
    if (!selectedFailureModeId) return;

    try {
      const response = await fetch(`/api/failure-modes/${selectedFailureModeId}/effects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: input.effects,
          severity: input.sev,
          potential_cause: input.potentialCause,
          occurrence: input.occ,
          current_design: input.currentDesign,
          detection: input.det,
          justification_pre: input.justificationPre,
          severity_post: input.sevPost,
          occurrence_post: input.occPost,
          detection_post: input.detPost,
          justification_post: input.justificationPost,
          responsible: input.responsible,
          action_status: input.actionStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Effect added successfully');

        // Update local state instead of reloading the page
        const newEffect = result.data;

        setComponents(prev => prev.map(comp => ({
          ...comp,
          failureModes: comp.failureModes.map(fm =>
            fm.id === selectedFailureModeId
              ? {
                  ...fm,
                  effects: [
                    ...fm.effects,
                    {
                      id: newEffect.id,
                      failureModeId: fm.id,
                      effects: newEffect.description || '',
                      sev: newEffect.severity || 5,
                      potentialCause: newEffect.potential_cause || '',
                      occ: newEffect.occurrence || 5,
                      currentDesign: newEffect.current_design || '',
                      det: newEffect.detection || 5,
                      justificationPre: newEffect.justification_pre || '',
                      rpnPre: (newEffect.severity || 5) * (newEffect.occurrence || 5) * (newEffect.detection || 5),
                      recommendedActions: '',
                      justificationPost: newEffect.justification_post || '',
                      responsible: newEffect.responsible || '',
                      actionStatus: (newEffect.action_status || 'Not Started') as 'Not Started' | 'In Progress' | 'Done',
                      sevPost: newEffect.severity_post || newEffect.severity || 5,
                      occPost: newEffect.occurrence_post || newEffect.occurrence || 5,
                      detPost: newEffect.detection_post || newEffect.detection || 5,
                      rpnPost: (newEffect.severity_post || newEffect.severity || 5) *
                               (newEffect.occurrence_post || newEffect.occurrence || 5) *
                               (newEffect.detection_post || newEffect.detection || 5),
                      createdAt: new Date(newEffect.created_at),
                      updatedAt: new Date(newEffect.updated_at),
                    }
                  ]
                }
              : fm
          )
        })));
      } else {
        toast.error(result.error || 'Failed to add effect');
      }
    } catch (error) {
      console.error('Error adding effect:', error);
      toast.error('Failed to add effect');
    }
  };

  // Update Effect
  const handleUpdateEffect = async (effectId: string, updates: Partial<Effect>) => {
    const failureMode = components
      .flatMap(c => c.failureModes)
      .find(fm => fm.effects.some(e => e.id === effectId));

    if (!failureMode) return;

    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/effects/${effectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: updates.effects,
          severity: updates.sev,
          potential_cause: updates.potentialCause,
          occurrence: updates.occ,
          current_design: updates.currentDesign,
          detection: updates.det,
          justification_pre: updates.justificationPre,
          recommended_actions: updates.recommendedActions,
          severity_post: updates.sevPost,
          occurrence_post: updates.occPost,
          detection_post: updates.detPost,
          justification_post: updates.justificationPost,
          responsible: updates.responsible,
          action_status: updates.actionStatus,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Effect updated successfully');
        // Update local state
        setComponents(prev => prev.map(c => ({
          ...c,
          failureModes: c.failureModes.map(fm => ({
            ...fm,
            effects: fm.effects.map(e =>
              e.id === effectId
                ? {
                    ...e,
                    ...updates,
                    rpnPre: (updates.sev || e.sev) * (updates.occ || e.occ) * (updates.det || e.det),
                    rpnPost: (updates.sevPost || e.sevPost) * (updates.occPost || e.occPost) * (updates.detPost || e.detPost),
                    updatedAt: new Date(),
                  }
                : e
            ),
          })),
        })));
      } else {
        toast.error(result.error || 'Failed to update effect');
      }
    } catch (error) {
      console.error('Error updating effect:', error);
      toast.error('Failed to update effect');
    }
  };

  // Selection Action Handlers
  const handleEdit = () => {
    if (!selectedItem) return;

    // Set editing item and open edit modal
    setEditingItem(selectedItem);
    setShowEditModal(true);
  };

  const handleEditOwner = () => {
    if (!selectedItem) return;
    if (selectedItem.type !== 'component' && selectedItem.type !== 'failureMode') return;

    setShowEditOwnerModal(true);
  };

  const handleSaveOwner = async (owner: string) => {
    if (!selectedItem) return;

    try {
      let endpoint = '';
      let body: any = {};

      if (selectedItem.type === 'component') {
        // Note: You may need to add owner field to Component model
        endpoint = `/api/projects/${project.id}/components/${selectedItem.id}`;
        body = { owner };
      } else if (selectedItem.type === 'failureMode') {
        endpoint = `/api/failure-modes/${selectedItem.id}`;
        body = { owner };
      }

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success || response.ok) {
        toast.success('Owner updated successfully');
        setShowEditOwnerModal(false);

        // Update local state
        setComponents(prev => prev.map(c => {
          if (selectedItem.type === 'component' && c.id === selectedItem.id) {
            return { ...c, owner } as any; // Note: may need to add owner to Component type
          }
          return {
            ...c,
            failureModes: c.failureModes.map(fm => {
              if (selectedItem.type === 'failureMode' && fm.id === selectedItem.id) {
                return { ...fm, owner };
              }
              return fm;
            }),
          };
        }));

        // Update selectedItem data
        setSelectedItem(prev => prev ? { ...prev, data: { ...prev.data, owner } } : null);
      } else {
        toast.error(result.error || 'Failed to update owner');
      }
    } catch (error) {
      console.error('Error updating owner:', error);
      toast.error('Failed to update owner');
    }
  };

  // Handle saving edits from SimpleEditModal
  const handleSaveEdit = async (formData: any) => {
    if (!editingItem) return;

    try {
      let endpoint = '';
      let body: any = {};
      let method = 'PUT';

      switch (editingItem.type) {
        case 'component':
          endpoint = `/api/components/${editingItem.id}`;
          body = {
            name: formData.name,
            function: formData.function || null,
          };
          break;

        case 'failureMode':
          endpoint = `/api/failure-modes/${editingItem.id}`;
          body = {
            failure_mode: formData.name,
            owner: formData.owner || null,
          };
          break;

        case 'effect':
          // Find parent failure mode
          const parentFM = components
            .flatMap(c => c.failureModes)
            .find(fm => fm.effects.some(e => e.id === editingItem.id));

          if (!parentFM) {
            toast.error('Parent failure mode not found');
            return;
          }

          endpoint = `/api/failure-modes/${parentFM.id}/effects/${editingItem.id}`;
          method = 'PATCH';
          body = {
            description: formData.effects,
          };
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success || response.ok) {
        const itemLabel = editingItem.type === 'component' ? 'Component' :
                          editingItem.type === 'failureMode' ? 'Failure Mode' : 'Effect';
        toast.success(`${itemLabel} updated successfully`);

        // Update local state
        setComponents(prev => {
          switch (editingItem.type) {
            case 'component':
              return prev.map(c =>
                c.id === editingItem.id
                  ? { ...c, name: formData.name, function: formData.function || '' }
                  : c
              );

            case 'failureMode':
              return prev.map(c => ({
                ...c,
                failureModes: c.failureModes.map(fm =>
                  fm.id === editingItem.id
                    ? { ...fm, name: formData.name, owner: formData.owner || '' }
                    : fm
                ),
              }));

            case 'effect':
              return prev.map(c => ({
                ...c,
                failureModes: c.failureModes.map(fm => ({
                  ...fm,
                  effects: fm.effects.map(e =>
                    e.id === editingItem.id
                      ? { ...e, effects: formData.effects }
                      : e
                  ),
                })),
              }));

            default:
              return prev;
          }
        });

        // Clear editing state
        setEditingItem(null);
        setSelectedItem(null);
      } else {
        toast.error(result.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Failed to update');
    }
  };

  const handleDuplicate = async () => {
    if (!selectedItem) return;

    const itemLabel = selectedItem.type === 'component' ? 'Component' :
                      selectedItem.type === 'failureMode' ? 'Failure Mode' : 'Effect';

    if (!confirm(`Duplicate this ${itemLabel}? This will create a copy with "(Copy)" appended to the name.`)) {
      return;
    }

    try {
      let endpoint = '';
      let newData: any = {};

      switch (selectedItem.type) {
        case 'component':
          // Duplicate component with all failure modes
          const component = components.find(c => c.id === selectedItem.id);
          if (!component) {
            toast.error('Component not found');
            return;
          }

          // Generate AI name
          const aiComponentName = await generateAIDuplicateNameWithToast(
            'component',
            component.name,
            {},
            token ?? ''
          );

          newData = {
            name: aiComponentName,
            function: component.function,
          };

          endpoint = `/api/projects/${project.id}/components`;
          break;

        case 'failureMode':
          // Duplicate failure mode with all effects
          const failureMode = components
            .flatMap(c => c.failureModes)
            .find(fm => fm.id === selectedItem.id);

          if (!failureMode) {
            toast.error('Failure Mode not found');
            return;
          }

          const parentComponent = components.find(c =>
            c.failureModes.some(fm => fm.id === selectedItem.id)
          );

          if (!parentComponent) {
            toast.error('Parent component not found');
            return;
          }

          // Generate AI name
          const aiFailureModeName = await generateAIDuplicateNameWithToast(
            'failureMode',
            failureMode.name,
            { componentName: parentComponent.name },
            token ?? ''
          );

          newData = {
            failure_mode: aiFailureModeName,
            owner: failureMode.owner,
          };

          endpoint = `/api/components/${parentComponent.id}/failure-modes`;
          break;

        case 'effect':
          // Duplicate effect
          const effect = components
            .flatMap(c => c.failureModes)
            .flatMap(fm => fm.effects)
            .find(e => e.id === selectedItem.id);

          if (!effect) {
            toast.error('Effect not found');
            return;
          }

          const parentFM = components
            .flatMap(c => c.failureModes)
            .find(fm => fm.effects.some(e => e.id === selectedItem.id));

          if (!parentFM) {
            toast.error('Parent failure mode not found');
            return;
          }

          // Generate AI description
          const aiEffectDescription = await generateAIDuplicateNameWithToast(
            'effect',
            effect.effects,
            { failureModeName: parentFM.name },
            token ?? ''
          );

          newData = {
            description: aiEffectDescription,
            severity: effect.sev ?? 5,
            potential_cause: effect.potentialCause || '',
            occurrence: effect.occ ?? 5,
            current_design: effect.currentDesign || '',
            detection: effect.det ?? 5,
            justification_pre: effect.justificationPre || '',
            severity_post: effect.sevPost ?? effect.sev ?? 5,
            occurrence_post: effect.occPost ?? effect.occ ?? 5,
            detection_post: effect.detPost ?? effect.det ?? 5,
            justification_post: effect.justificationPost || '',
            responsible: effect.responsible || '',
            action_status: effect.actionStatus || 'Not Started',
          };

          endpoint = `/api/failure-modes/${parentFM.id}/effects`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newData),
      });

      const result = await response.json();

      if (result.success || response.ok) {
        toast.success(`${itemLabel} duplicated successfully`);
        setSelectedItem(null);

        // Update local state with the new duplicated item
        const newItem = result.data;

        setComponents(prev => {
          switch (selectedItem.type) {
            case 'component': {
              // Add the new component to the array
              const newComponent: Component = {
                id: newItem.id,
                name: newItem.name,
                function: newItem.function || '',
                failureModes: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              return [...prev, newComponent];
            }

            case 'failureMode': {
              // Find parent component and add the new failure mode
              const parentComponent = components.find(c =>
                c.failureModes.some(fm => fm.id === selectedItem.id)
              );

              if (!parentComponent) return prev;

              return prev.map(c => {
                if (c.id === parentComponent.id) {
                  const newFailureMode: FailureMode = {
                    id: newItem.id,
                    name: newItem.failure_mode,
                    owner: newItem.owner || '',
                    componentId: c.id,
                    effects: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  return {
                    ...c,
                    failureModes: [...c.failureModes, newFailureMode],
                  };
                }
                return c;
              });
            }

            case 'effect': {
              // Find parent failure mode and add the new effect
              const parentFM = components
                .flatMap(c => c.failureModes)
                .find(fm => fm.effects.some(e => e.id === selectedItem.id));

              if (!parentFM) return prev;

              return prev.map(c => ({
                ...c,
                failureModes: c.failureModes.map(fm => {
                  if (fm.id === parentFM.id) {
                    const newEffect: Effect = {
                      id: newItem.id,
                      failureModeId: fm.id,
                      effects: newItem.description,
                      sev: newItem.severity ?? 5,
                      potentialCause: newItem.potential_cause || '',
                      occ: newItem.occurrence ?? 5,
                      currentDesign: newItem.current_design || '',
                      det: newItem.detection ?? 5,
                      justificationPre: newItem.justification_pre || '',
                      rpnPre: (newItem.severity ?? 5) * (newItem.occurrence ?? 5) * (newItem.detection ?? 5),
                      recommendedActions: '',
                      justificationPost: newItem.justification_post || '',
                      responsible: newItem.responsible || '',
                      actionStatus: (newItem.action_status || 'Not Started') as 'Not Started' | 'In Progress' | 'Done',
                      sevPost: newItem.severity_post ?? newItem.severity ?? 5,
                      occPost: newItem.occurrence_post ?? newItem.occurrence ?? 5,
                      detPost: newItem.detection_post ?? newItem.detection ?? 5,
                      rpnPost: (newItem.severity_post ?? newItem.severity ?? 5) *
                               (newItem.occurrence_post ?? newItem.occurrence ?? 5) *
                               (newItem.detection_post ?? newItem.detection ?? 5),
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    };
                    return {
                      ...fm,
                      effects: [...fm.effects, newEffect],
                    };
                  }
                  return fm;
                }),
              }));
            }

            default:
              return prev;
          }
        });
      } else {
        toast.error(result.error || 'Failed to duplicate');
      }
    } catch (error) {
      console.error('Error duplicating:', error);
      toast.error('Failed to duplicate');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    const itemLabel = selectedItem.type === 'component' ? 'Component' :
                      selectedItem.type === 'failureMode' ? 'Failure Mode' : 'Effect';

    if (!confirm(`Delete this ${itemLabel}? This action cannot be undone.`)) {
      return;
    }

    try {
      let endpoint = '';

      switch (selectedItem.type) {
        case 'component':
          endpoint = `/api/components/${selectedItem.id}`;
          break;
        case 'failureMode':
          endpoint = `/api/failure-modes/${selectedItem.id}`;
          break;
        case 'effect':
          const failureMode = components
            .flatMap(c => c.failureModes)
            .find(fm => fm.effects.some(e => e.id === selectedItem.id));
          if (!failureMode) {
            toast.error('Failed to find parent failure mode');
            return;
          }
          endpoint = `/api/failure-modes/${failureMode.id}/effects/${selectedItem.id}`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success || response.ok) {
        toast.success(`${itemLabel} deleted successfully`);
        setSelectedItem(null);

        // Update local state instead of reloading
        setComponents(prev => {
          switch (selectedItem.type) {
            case 'component':
              // Filter out the deleted component
              return prev.filter(c => c.id !== selectedItem.id);

            case 'failureMode':
              // Map through components and filter out the deleted failure mode
              return prev.map(c => ({
                ...c,
                failureModes: c.failureModes.filter(fm => fm.id !== selectedItem.id),
              }));

            case 'effect':
              // Map through components and failure modes to filter out the deleted effect
              return prev.map(c => ({
                ...c,
                failureModes: c.failureModes.map(fm => ({
                  ...fm,
                  effects: fm.effects.filter(e => e.id !== selectedItem.id),
                })),
              }));

            default:
              return prev;
          }
        });
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  // Computed view models
  const getComponentViewModel = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return null;

    const allEffects = component.failureModes.flatMap(fm => fm.effects);
    const highestRPN = allEffects.length > 0
      ? Math.max(...allEffects.map(e => e.rpnPre))
      : 0;

    return {
      ...component,
      failureModeCount: component.failureModes.length,
      highestRPN,
    };
  };

  const getFailureModeViewModel = (failureModeId: string) => {
    const failureMode = components
      .flatMap(c => c.failureModes)
      .find(fm => fm.id === failureModeId);

    if (!failureMode) return null;

    const rpnPre = failureMode.effects.length > 0
      ? Math.max(...failureMode.effects.map(e => e.rpnPre))
      : 0;

    const rpnPost = failureMode.effects.length > 0
      ? Math.max(...failureMode.effects.map(e => e.rpnPost))
      : 0;

    return {
      ...failureMode,
      effectCount: failureMode.effects.length,
      rpnPre,
      rpnPost,
    };
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4 mx-auto" />
          <p className="text-gray-600 dark:text-slate-400">Loading Smart Table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            Smart Table
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            Hierarchical FMEA analysis: Components → Failure Modes → Effects
          </p>
        </div>
        <button
          onClick={() => setShowComponentModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Component
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {components.length === 0 ? (
          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 p-8 text-center">
            <p className="text-gray-600 dark:text-slate-400 mb-4">
              No components yet. Get started by adding your first component.
            </p>
            <button
              onClick={() => setShowComponentModal(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors"
            >
              + Add Component
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {components.map((component) => (
              <ComponentRowIntegrated
                key={component.id}
                component={component}
                isExpanded={expandedComponents.has(component.id)}
                isSelected={selectedItem?.type === 'component' && selectedItem.id === component.id}
                expandedFailureModes={expandedFailureModes}
                onToggleExpand={() => {
                  setExpandedComponents(prev => {
                    const next = new Set(prev);
                    if (next.has(component.id)) {
                      next.delete(component.id);
                    } else {
                      next.add(component.id);
                    }
                    return next;
                  });
                  setSelectedComponentId(component.id);
                }}
                onToggleFailureModeExpand={(fmId) => {
                  setExpandedFailureModes(prev => {
                    const next = new Set(prev);
                    if (next.has(fmId)) {
                      next.delete(fmId);
                    } else {
                      next.add(fmId);
                    }
                    return next;
                  });
                  setSelectedFailureModeId(fmId);
                }}
                onAddFailureMode={() => {
                  setSelectedComponentId(component.id);
                  setShowFailureModeModal(true);
                }}
                onAddEffect={(fmId) => {
                  setSelectedFailureModeId(fmId);
                  setShowEffectModal(true);
                }}
                onUpdateEffect={handleUpdateEffect}
                getComponentViewModel={getComponentViewModel}
                getFailureModeViewModel={getFailureModeViewModel}
                selectedItem={selectedItem}
                onSelect={(comp) => {
                  setSelectedItem({
                    type: 'component',
                    id: comp.id,
                    data: comp,
                  });
                }}
                onSelectFailureMode={(fm) => {
                  setSelectedItem({
                    type: 'failureMode',
                    id: fm.id,
                    data: fm,
                  });
                }}
                onSelectEffect={(effect) => {
                  setSelectedItem({
                    type: 'effect',
                    id: effect.id,
                    data: effect,
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showComponentModal && (
        <ComponentModal
          onClose={() => setShowComponentModal(false)}
          onSave={(data) => {
            handleAddComponent(data);
            setShowComponentModal(false);
          }}
          project={project}
        />
      )}

      {showFailureModeModal && (
        <FailureModeModal
          onClose={() => setShowFailureModeModal(false)}
          onSave={(data) => {
            handleAddFailureMode(data);
            setShowFailureModeModal(false);
          }}
          project={project}
          componentId={selectedComponentId}
          components={components}
        />
      )}

      {showEffectModal && (
        <EffectModal
          onClose={() => setShowEffectModal(false)}
          onSave={(data) => {
            handleAddEffect(data);
            setShowEffectModal(false);
          }}
          project={project}
          failureModeId={selectedFailureModeId}
          components={components}
        />
      )}

      {/* Selection Toolbar */}
      <SelectionToolbar
        selectedItem={selectedItem}
        onClear={() => {
          setSelectedItem(null);
          setShowEditOwnerModal(false);
        }}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onEditOwner={handleEditOwner}
      />

      {/* Edit Owner Modal */}
      {showEditOwnerModal && selectedItem && (
        <EditOwnerModal
          itemType={selectedItem.type as 'component' | 'failureMode'}
          itemName={selectedItem.data.name}
          currentOwner={selectedItem.data.owner || ''}
          onClose={() => setShowEditOwnerModal(false)}
          onSave={handleSaveOwner}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <SimpleEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
          }}
          onSave={handleSaveEdit}
          title={`Edit ${
            editingItem.type === 'component' ? 'Component' :
            editingItem.type === 'failureMode' ? 'Failure Mode' : 'Effect'
          }`}
          initialData={{
            name: editingItem.data.name || editingItem.data.failure_mode,
            function: editingItem.data.function || '',
            owner: editingItem.data.owner || '',
            effects: editingItem.data.effects || '',
          }}
          fields={
            editingItem.type === 'component' ? [
              { key: 'name', label: 'Component Name', required: true },
              { key: 'function', label: 'Function', type: 'textarea' },
            ] :
            editingItem.type === 'failureMode' ? [
              { key: 'name', label: 'Failure Mode', required: true },
              { key: 'owner', label: 'Owner' },
            ] :
            [
              { key: 'effects', label: 'Effect Description', type: 'textarea', required: true },
            ]
          }
          itemType={editingItem.type}
          itemData={editingItem.data}
          isNewItem={false}
        />
      )}
    </div>
  );
}

// Integrated Component Row (uses v2 UI with local state management)
import { ChevronRight } from 'lucide-react';
import { RPNBadge } from './RPNBadge';
import { FailureModeRow } from './FailureModeRow';

interface ComponentRowIntegratedProps {
  component: Component;
  isExpanded: boolean;
  isSelected: boolean;
  expandedFailureModes: Set<string>;
  selectedItem: { type: 'component' | 'failureMode' | 'effect'; id: string; data: any } | null;
  onToggleExpand: () => void;
  onToggleFailureModeExpand: (fmId: string) => void;
  onAddFailureMode: () => void;
  onAddEffect: (fmId: string) => void;
  onUpdateEffect: (effectId: string, updates: Partial<Effect>) => void;
  getComponentViewModel: (id: string) => any;
  getFailureModeViewModel: (id: string) => any;
  onSelect?: (component: Component) => void;
  onSelectFailureMode?: (failureMode: FailureMode) => void;
  onSelectEffect?: (effect: Effect) => void;
}

function ComponentRowIntegrated(props: ComponentRowIntegratedProps) {
  const { getRPNColor } = useRiskSettings();
  const viewModel = props.getComponentViewModel(props.component.id);
  if (!viewModel) return null;

  const truncateFunction = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="mb-3">
      {/* Component Header */}
      <div
        onClick={(e) => {
          if (!e.defaultPrevented) {
            props.onSelect?.(props.component);
          }
        }}
        className={`
          relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700
          rounded-lg shadow-sm hover:shadow-md p-4 cursor-pointer transition-all duration-200
          overflow-hidden smart-table-row
          ${props.isSelected ? 'ring-2 ring-accent bg-accent/10 dark:bg-accent/20' : ''}
          before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-orange-500
        `}
      >
        <div className="flex items-center justify-between pl-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ChevronRight
              onClick={(e) => {
                e.stopPropagation();
                props.onToggleExpand();
              }}
              className={`w-5 h-5 flex-shrink-0 text-gray-600 dark:text-slate-400 transition-transform duration-200 hover:text-gray-800 dark:hover:text-slate-200 ${
                props.isExpanded ? 'rotate-90' : ''
              }`}
            />
            <span className="text-lg font-bold text-gray-900 dark:text-slate-100">
              COMPONENT: {viewModel.name}
            </span>
            <span className="text-gray-400 dark:text-slate-500">|</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-gray-600 dark:text-slate-400">Function:</span>
              <span className="text-sm text-gray-700 dark:text-slate-300 truncate">
                {truncateFunction(viewModel.function)}
              </span>
            </div>
            <span className="text-gray-400 dark:text-slate-500">|</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                {viewModel.failureModeCount}
              </span>
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {viewModel.failureModeCount === 1 ? 'Failure Mode' : 'Failure Modes'}
              </span>
            </div>
            <span className="text-gray-400 dark:text-slate-500">|</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-gray-600 dark:text-slate-400">Highest RPN:</span>
              <span
                className="px-2.5 py-1 text-sm font-bold rounded-md"
                style={{
                  backgroundColor: `${getRPNColor(viewModel.highestRPN)}20`,
                  color: getRPNColor(viewModel.highestRPN),
                }}
              >
                {viewModel.highestRPN}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onAddFailureMode();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors flex-shrink-0 ml-4"
          >
            <Plus className="w-4 h-4" />
            Failure Mode
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {props.isExpanded && (
        <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
          {viewModel.failureModes.length === 0 ? (
            <div className="ml-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg text-sm text-gray-600 dark:text-slate-400">
              No failure modes added yet. Click "+ Failure Mode" to add one.
            </div>
          ) : (
            viewModel.failureModes.map((failureMode: FailureMode) => (
              <FailureModeRowIntegrated
                key={failureMode.id}
                failureMode={failureMode}
                isExpanded={props.expandedFailureModes.has(failureMode.id)}
                isSelected={props.selectedItem?.type === 'failureMode' && props.selectedItem.id === failureMode.id}
                selectedItem={props.selectedItem}
                onToggleExpand={() => props.onToggleFailureModeExpand(failureMode.id)}
                onAddEffect={() => props.onAddEffect(failureMode.id)}
                onUpdateEffect={props.onUpdateEffect}
                getFailureModeViewModel={props.getFailureModeViewModel}
                onSelect={props.onSelectFailureMode}
                onSelectEffect={props.onSelectEffect}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Integrated Failure Mode Row
interface FailureModeRowIntegratedProps {
  failureMode: FailureMode;
  isExpanded: boolean;
  isSelected?: boolean;
  selectedItem?: { type: 'component' | 'failureMode' | 'effect'; id: string; data: any } | null;
  onToggleExpand: () => void;
  onAddEffect: () => void;
  onUpdateEffect: (effectId: string, updates: Partial<Effect>) => void;
  getFailureModeViewModel: (id: string) => any;
  onSelect?: (failureMode: FailureMode) => void;
  onSelectEffect?: (effect: Effect) => void;
}

function FailureModeRowIntegrated(props: FailureModeRowIntegratedProps) {
  const viewModel = props.getFailureModeViewModel(props.failureMode.id);
  if (!viewModel) return null;

  return (
    <div className="ml-6 mb-2">
      <div
        onClick={(e) => {
          if (!e.defaultPrevented) {
            props.onSelect?.(props.failureMode);
          }
        }}
        className={`smart-table-row bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg p-3 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-slate-600 hover:shadow-sm ${
          props.isSelected ? 'ring-2 ring-accent bg-accent/10 dark:bg-accent/20' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ChevronRight
              onClick={(e) => {
                e.stopPropagation();
                props.onToggleExpand();
              }}
              className={`w-5 h-5 flex-shrink-0 text-gray-600 dark:text-slate-400 transition-transform duration-200 hover:text-gray-800 dark:hover:text-slate-200 ${
                props.isExpanded ? 'rotate-90' : ''
              }`}
            />
            <span className="text-base font-semibold text-gray-900 dark:text-slate-100 truncate">
              Failure Mode: {viewModel.name}
            </span>
            <span className="text-gray-400 dark:text-slate-500">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-slate-400">RPN (Pre):</span>
              <RPNBadge value={viewModel.rpnPre} showLabel={false} />
            </div>
            <span className="text-gray-400 dark:text-slate-500">|</span>
            <span className="text-sm text-gray-600 dark:text-slate-400">
              {viewModel.effectCount} {viewModel.effectCount === 1 ? 'Effect' : 'Effects'}
            </span>
            <span className="text-gray-400 dark:text-slate-500">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-slate-400">RPN (Post):</span>
              <RPNBadge value={viewModel.rpnPost} showLabel={false} />
            </div>
            <span className="text-gray-400 dark:text-slate-500">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-slate-400">Owner:</span>
              <span className="text-sm text-gray-700 dark:text-slate-300">
                {viewModel.owner || 'Unassigned'}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              props.onAddEffect();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors flex-shrink-0 ml-4"
          >
            <Plus className="w-4 h-4" />
            Effect
          </button>
        </div>
      </div>

      {/* Expanded Content - Effects Table */}
      {props.isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <EffectsTableIntegrated
            effects={props.failureMode.effects}
            onUpdateEffect={props.onUpdateEffect}
            selectedItem={props.selectedItem}
            onSelectEffect={props.onSelectEffect}
          />
        </div>
      )}
    </div>
  );
}

// Integrated Effects Table
import { EffectsTable } from './EffectsTable';

interface EffectsTableIntegratedProps {
  effects: Effect[];
  onUpdateEffect: (effectId: string, updates: Partial<Effect>) => void;
  selectedItem?: { type: 'component' | 'failureMode' | 'effect'; id: string; data: any } | null;
  onSelectEffect?: (effect: Effect) => void;
}

function EffectsTableIntegrated({ effects, onUpdateEffect, selectedItem, onSelectEffect }: EffectsTableIntegratedProps) {
  if (effects.length === 0) {
    return (
      <div className="ml-12 mt-2 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg text-sm text-gray-600 dark:text-slate-400">
        No effects added yet. Click "+ Effect" to add one.
      </div>
    );
  }

  // Render using the v2 EffectsTable but with custom update handler
  // We'll need to modify EffectsTable to accept effects as props
  return (
    <div className="ml-12 mt-2">
      <div className="w-full overflow-x-auto overflow-y-visible rounded-lg border border-gray-200 dark:border-slate-700">
        <table className="min-w-full border-collapse bg-white dark:bg-slate-800">
          <thead className="bg-gray-100 dark:bg-slate-700 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[200px]">Effects</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">SEV</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[180px]">Potential Cause</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">OCC</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[180px]">Current Design</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">DET</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[180px]">Justification (Pre)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[120px]">RPN (Pre)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[200px]">Recommended Actions</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[180px]">Justification (Post)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[150px]">Responsible</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[150px]">Action Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">SEV (Post)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">OCC (Post)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[60px]">DET (Post)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-slate-400 uppercase border-b border-gray-300 dark:border-slate-600 min-w-[120px]">RPN (Post)</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800">
            {effects.map((effect, index) => (
              <EffectRowIntegrated
                key={effect.id}
                effect={effect}
                isEven={index % 2 === 0}
                isSelected={selectedItem?.type === 'effect' && selectedItem.id === effect.id}
                onUpdate={(updates) => onUpdateEffect(effect.id, updates)}
                onSelect={onSelectEffect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Effect Row with inline editing
import { useRPNCalculation } from '@/lib/hooks/useRPNCalculation';

interface EffectRowIntegratedProps {
  effect: Effect;
  isEven: boolean;
  isSelected?: boolean;
  onUpdate: (updates: Partial<Effect>) => void;
  onSelect?: (effect: Effect) => void;
}

function EffectRowIntegrated({ effect, isEven, isSelected, onUpdate, onSelect }: EffectRowIntegratedProps) {
  const { formatRPN } = useRPNCalculation();
  const { scaleType, thresholds } = useRiskSettings();
  const maxRating = scaleType === '1-5' ? 5 : 10;
  const rpnPreFormatted = formatRPN(effect.sev, effect.occ, effect.det);
  const rpnPostFormatted = formatRPN(effect.sevPost, effect.occPost, effect.detPost);

  return (
    <tr
      onClick={() => onSelect?.(effect)}
      className={`smart-table-row border-b border-gray-200 dark:border-slate-700 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-accent/20 dark:bg-accent/30 ring-2 ring-accent ring-inset'
          : isEven
            ? 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
            : 'bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700'
      }`}
    >
      <EditableCell value={effect.effects} onSave={(value) => onUpdate({ effects: value })} />
      <NumberCell value={effect.sev} min={1} max={maxRating} onSave={(value) => onUpdate({ sev: value })} />
      <EditableCell value={effect.potentialCause} onSave={(value) => onUpdate({ potentialCause: value })} />
      <NumberCell value={effect.occ} min={1} max={maxRating} onSave={(value) => onUpdate({ occ: value })} />
      <EditableCell value={effect.currentDesign} onSave={(value) => onUpdate({ currentDesign: value })} />
      <NumberCell value={effect.det} min={1} max={maxRating} onSave={(value) => onUpdate({ det: value })} />
      <EditableCell value={effect.justificationPre} onSave={(value) => onUpdate({ justificationPre: value })} />
      <td className="px-4 py-3 text-sm">
        <RPNBadge value={effect.rpnPre} showLabel={true} showTooltip={true} formula={rpnPreFormatted.formula} thresholds={thresholds} />
      </td>
      <EditableCell value={effect.recommendedActions} onSave={(value) => onUpdate({ recommendedActions: value })} />
      <EditableCell value={effect.justificationPost} onSave={(value) => onUpdate({ justificationPost: value })} />
      <EditableCell value={effect.responsible} onSave={(value) => onUpdate({ responsible: value })} />
      <ActionStatusCell value={effect.actionStatus} onSave={(value) => onUpdate({ actionStatus: value })} />
      <NumberCell value={effect.sevPost} min={1} max={maxRating} onSave={(value) => onUpdate({ sevPost: value })} />
      <NumberCell value={effect.occPost} min={1} max={maxRating} onSave={(value) => onUpdate({ occPost: value })} />
      <NumberCell value={effect.detPost} min={1} max={maxRating} onSave={(value) => onUpdate({ detPost: value })} />
      <td className="px-4 py-3 text-sm">
        <RPNBadge value={effect.rpnPost} showLabel={true} showTooltip={true} formula={rpnPostFormatted.formula} thresholds={thresholds} />
      </td>
    </tr>
  );
}

// Reuse EditableCell and NumberCell from SmartTable.tsx
interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
}

function EditableCell({ value, onSave }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <td className="px-4 py-3">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
        />
      </td>
    );
  }

  return (
    <td
      className="px-4 py-3 text-sm text-gray-900 dark:text-slate-100 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
      onClick={() => setIsEditing(true)}
    >
      {value || <span className="text-gray-400 dark:text-slate-500 italic">Click to edit</span>}
    </td>
  );
}

interface NumberCellProps {
  value: number;
  min: number;
  max: number;
  onSave: (value: number) => void;
}

function NumberCell({ value, min, max, onSave }: NumberCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState((value ?? 5).toString());

  const handleSave = () => {
    const numValue = parseInt(editValue, 10);
    const currentValue = value ?? 5;
    if (!isNaN(numValue) && numValue >= min && numValue <= max && numValue !== currentValue) {
      onSave(numValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue((value ?? 5).toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <td className="px-4 py-3">
        <input
          type="number"
          min={min}
          max={max}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-16 px-2 py-1 text-sm text-center border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
        />
      </td>
    );
  }

  return (
    <td
      className="px-4 py-3 text-sm text-center font-semibold text-gray-900 dark:text-slate-100 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
      onClick={() => setIsEditing(true)}
    >
      {value ?? 5}
    </td>
  );
}

interface ActionStatusCellProps {
  value: 'Not Started' | 'In Progress' | 'Done';
  onSave: (value: 'Not Started' | 'In Progress' | 'Done') => void;
}

function ActionStatusCell({ value, onSave }: ActionStatusCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'In Progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'Not Started':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  if (isEditing) {
    return (
      <td className="px-4 py-3">
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value as 'Not Started' | 'In Progress' | 'Done')}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
        >
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
      </td>
    );
  }

  return (
    <td
      className="px-4 py-3 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20"
      onClick={() => setIsEditing(true)}
    >
      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(value)}`}>
        {value}
      </span>
    </td>
  );
}

// Reuse Modal components from SmartTable.tsx
interface ComponentModalProps {
  onClose: () => void;
  onSave: (data: { name: string; function: string }) => void;
  project: Project;
}

function ComponentModal({ onClose, onSave, project }: ComponentModalProps) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [functionDesc, setFunctionDesc] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleAutoFill = async () => {
    if (!token) {
      toast.error('Unable to auto-fill. Please fill manually.');
      return;
    }

    setIsAutoFilling(true);
    try {
      // Get AI suggestion for component name if empty
      if (!name || name.trim() === '') {
        const nameResponse = await fetch('/api/ai/duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'component',
            originalName: 'New Component',
            context: {
              projectName: project.name,
              projectDescription: project.description || '',
              assetName: project.asset?.name || project.asset,
              assetType: project.asset?.type || '',
              assetContext: project.asset?.context || '',
              criticality: project.asset?.criticality || 'medium',
              standards: Array.isArray(project.asset?.standards)
                ? project.asset.standards
                : [],
            },
          }),
        });

        const nameResult = await nameResponse.json();
        if (nameResult.success && nameResult.data?.name) {
          setName(nameResult.data.name);
        }
      }

      // Get AI suggestion for function if empty
      if (!functionDesc || functionDesc.trim() === '') {
        // Wait for name to be set first if it's being generated
        const componentName = name || 'Component';

        const functionResponse = await fetch('/api/ai/duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'componentFunction',
            originalName: componentName,
            context: {
              projectName: project.name,
              projectDescription: project.description || '',
              assetName: project.asset?.name || project.asset,
              assetType: project.asset?.type || '',
              assetContext: project.asset?.context || '',
              componentName: componentName,
            },
          }),
        });

        const functionResult = await functionResponse.json();
        if (functionResult.success && functionResult.data?.name) {
          setFunctionDesc(functionResult.data.name);
        }
      }

      toast.success('Form auto-filled with AI suggestions!');
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error('Auto-fill failed. Please fill manually.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && functionDesc.trim()) {
      onSave({ name, function: functionDesc });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Add Component</h3>
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isAutoFilling}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {isAutoFilling ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Auto-filling...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Auto-fill
              </>
            )}
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Component Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" placeholder="e.g., Drive Train, Hydraulics" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Function</label>
            <textarea value={functionDesc} onChange={(e) => setFunctionDesc(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" placeholder="Describe what this component does..." rows={3} required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors">Add Component</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FailureModeModalProps {
  onClose: () => void;
  onSave: (data: { name: string; owner: string }) => void;
  project: Project;
  componentId: string | null;
  components: Component[];
}

function FailureModeModal({ onClose, onSave, project, componentId, components }: FailureModeModalProps) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Find the selected component for AI context
  const selectedComponent = components.find((c) => c.id === componentId);

  const handleAutoFill = async () => {
    if (!token || !selectedComponent) {
      toast.error('Unable to auto-fill. Please fill manually.');
      return;
    }

    setIsAutoFilling(true);
    try {
      // Get AI suggestion for failure mode name if empty
      if (!name || name.trim() === '') {
        const nameResponse = await fetch('/api/ai/duplicate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'failureMode',
            originalName: 'Equipment Failure',
            context: {
              componentName: selectedComponent.name,
            },
          }),
        });

        const nameResult = await nameResponse.json();
        if (nameResult.success && nameResult.data?.name) {
          setName(nameResult.data.name);
        }
      }

      // Set default owner if empty
      if (!owner || owner.trim() === '') {
        setOwner('Maintenance Team');
      }

      toast.success('Form auto-filled with AI suggestions!');
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error('Auto-fill failed. Please fill manually.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name, owner });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Add Failure Mode</h3>
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isAutoFilling}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {isAutoFilling ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Auto-filling...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Auto-fill
              </>
            )}
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Failure Mode Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" placeholder="e.g., Seal Leakage, Rod damage" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Owner</label>
            <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" placeholder="e.g., John Smith" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors">Add Failure Mode</button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EffectModalProps {
  onClose: () => void;
  onSave: (data: CreateEffectInput) => void;
  project: Project;
  failureModeId: string | null;
  components: Component[];
}

function EffectModal({ onClose, onSave, project, failureModeId, components }: EffectModalProps) {
  const { token } = useAuth();
  const { scaleType } = useRiskSettings();
  const maxRating = scaleType === '1-5' ? 5 : 10;
  const [effects, setEffects] = useState('');
  const [sev, setSev] = useState(5);
  const [potentialCause, setPotentialCause] = useState('');
  const [occ, setOcc] = useState(5);
  const [currentDesign, setCurrentDesign] = useState('');
  const [det, setDet] = useState(5);
  const [justificationPre, setJustificationPre] = useState('');
  const [recommendedActions, setRecommendedActions] = useState('');
  const [justificationPost, setJustificationPost] = useState('');
  const [responsible, setResponsible] = useState('');
  const [actionStatus, setActionStatus] = useState<'Not Started' | 'In Progress' | 'Done'>('Not Started');
  const [sevPost, setSevPost] = useState(3);
  const [occPost, setOccPost] = useState(3);
  const [detPost, setDetPost] = useState(3);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Find the selected failure mode for AI context
  const selectedFailureMode = components
    .flatMap((c) => c.failureModes)
    .find((fm) => fm.id === failureModeId);

  const handleAutoFill = async () => {
    if (!token || !selectedFailureMode) {
      toast.error('Unable to auto-fill. Please fill manually.');
      return;
    }

    // Debug logging to understand what data we're working with
    console.log('🔍 Auto-fill Debug - Selected Failure Mode:', {
      id: selectedFailureMode?.id,
      name: selectedFailureMode?.name,
      owner: selectedFailureMode?.owner,
      full_object: selectedFailureMode
    });

    setIsAutoFilling(true);
    try {
      // Declare result variables at function scope
      let effectsResult: any = null;
      let causesResult: any = null;
      let controlsResult: any = null;

      // Get AI suggestions for effects
      if (!effects || effects.trim() === '') {
        const effectsResponse = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'effects',
            context: {
              asset: project.asset,
              failureMode: {
                failure_mode: selectedFailureMode.name,
                process_step: 'Operation',
              },
            },
          }),
        });

        effectsResult = await effectsResponse.json();
        if (effectsResult.success && effectsResult.data?.suggestions?.[0]?.text) {
          setEffects(effectsResult.data.suggestions[0].text);
        }
      }

      // Small delay to space out API requests
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get AI suggestions for causes (potential cause field)
      if (!potentialCause || potentialCause.trim() === '') {
        const causesResponse = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'causes',
            context: {
              asset: project.asset,
              failureMode: {
                failure_mode: selectedFailureMode.name,
                process_step: 'Operation',
              },
            },
          }),
        });

        causesResult = await causesResponse.json();
        if (causesResult.success && causesResult.data?.suggestions?.[0]?.text) {
          setPotentialCause(causesResult.data.suggestions[0].text);
        }
      }

      // Small delay to space out API requests
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get AI suggestions for controls (current design field)
      if (!currentDesign || currentDesign.trim() === '') {
        const controlsResponse = await fetch('/api/ai/suggest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'controls',
            context: {
              asset: project.asset,
              failureMode: {
                failure_mode: selectedFailureMode.name,
                process_step: 'Operation',
              },
            },
          }),
        });

        controlsResult = await controlsResponse.json();
        if (controlsResult.success && controlsResult.data?.suggestions?.[0]?.text) {
          setCurrentDesign(controlsResult.data.suggestions[0].text);
        }
      }

      // Small delay to space out API requests
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get AI-suggested risk scores for pre-mitigation
      // Severity score based on effect
      const severityResponse = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'severity',
          context: {
            asset: project.asset,
            failureMode: {
              failure_mode: selectedFailureMode.name,
              process_step: 'Operation',
            },
            effect: {
              description: effects || 'Potential operational impact',
            },
          },
        }),
      });

      const severityResult = await severityResponse.json();
      if (severityResult.success && severityResult.data?.score) {
        setSev(severityResult.data.score);
      }

      // Small delay to space out API requests
      await new Promise(resolve => setTimeout(resolve, 500));

      // Occurrence score based on cause
      const occurrenceResponse = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'occurrence',
          context: {
            asset: project.asset,
            failureMode: {
              failure_mode: selectedFailureMode.name,
              process_step: 'Operation',
            },
            cause: {
              description: potentialCause || 'Typical degradation',
            },
          },
        }),
      });

      const occurrenceResult = await occurrenceResponse.json();
      if (occurrenceResult.success && occurrenceResult.data?.score) {
        setOcc(occurrenceResult.data.score);
      }

      // Small delay to space out API requests
      await new Promise(resolve => setTimeout(resolve, 500));

      // Detection score based on controls
      const detectionResponse = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'detection',
          context: {
            asset: project.asset,
            failureMode: {
              failure_mode: selectedFailureMode.name,
              process_step: 'Operation',
            },
            control: {
              description: currentDesign || 'Standard inspection procedures',
            },
          },
        }),
      });

      const detectionResult = await detectionResponse.json();
      if (detectionResult.success && detectionResult.data?.score) {
        setDet(detectionResult.data.score);
      }

      // Generate Pre-Mitigation Justification
      // Use the fetched values from API results
      const effectText = effectsResult?.data?.suggestions?.[0]?.text || effects || 'Potential operational impact';
      const causeText = causesResult?.data?.suggestions?.[0]?.text || potentialCause || 'Typical degradation';
      const controlText = controlsResult?.data?.suggestions?.[0]?.text || currentDesign || 'Standard procedures';
      const sevScore = severityResult.data?.score || sev;
      const occScore = occurrenceResult.data?.score || occ;
      const detScore = detectionResult.data?.score || det;

      // Small delay to space out API requests
      await new Promise(resolve => setTimeout(resolve, 500));

      const justificationPrePrompt = `Based on this FMEA analysis, provide a brief justification (2-3 sentences) for the pre-mitigation risk ratings:

Effect: ${effectText}
Severity (${sevScore}/10): Risk to safety/operations
Potential Cause: ${causeText}
Occurrence (${occScore}/10): Frequency of cause
Current Controls: ${controlText}
Detection (${detScore}/10): Ability to detect before impact

Explain why these specific ratings are appropriate given the asset type and failure mode. Keep it concise and technical.`;

      const justificationPreResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: justificationPrePrompt,
          context: {
            currentProject: project,
          },
        }),
      });

      const justPreResult = await justificationPreResponse.json();
      if (justPreResult.success && justPreResult.data?.message) {
        setJustificationPre(justPreResult.data.message);
      }

      // Calculate post-mitigation scores
      // Severity typically stays same or slightly reduces (effects don't change much)
      const calculatedSevPost = Math.max(1, Math.round(severityResult.data?.score * 0.9) || 3);
      setSevPost(calculatedSevPost);

      // Occurrence reduces significantly with good actions (30-40% reduction)
      const calculatedOccPost = Math.max(1, Math.round(occurrenceResult.data?.score * 0.6) || 3);
      setOccPost(calculatedOccPost);

      // Detection improves significantly with better controls (40-50% reduction)
      const calculatedDetPost = Math.max(1, Math.round(detectionResult.data?.score * 0.5) || 3);
      setDetPost(calculatedDetPost);

      // Fill recommended actions if empty
      const recommendedActionsText = 'Implement corrective measures and monitoring';
      if (!recommendedActions || recommendedActions.trim() === '') {
        setRecommendedActions(recommendedActionsText);
      }

      // Fill responsible if empty
      if (!responsible || responsible.trim() === '') {
        setResponsible('Maintenance Team');
      }

      // Small delay to space out API requests
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate Post-Mitigation Justification
      const justificationPostPrompt = `Based on the recommended actions, provide a brief justification (2-3 sentences) for the post-mitigation risk ratings:

Recommended Actions: ${recommendedActionsText}
Severity (Post): ${calculatedSevPost}/10 (was ${sevScore}/10)
Occurrence (Post): ${calculatedOccPost}/10 (was ${occScore}/10)
Detection (Post): ${calculatedDetPost}/10 (was ${detScore}/10)

Explain how the recommended actions will reduce these specific risk factors and improve overall safety/reliability. Keep it concise and technical.`;

      const justificationPostResponse = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: justificationPostPrompt,
          context: {
            currentProject: project,
          },
        }),
      });

      const justPostResult = await justificationPostResponse.json();
      if (justPostResult.success && justPostResult.data?.message) {
        setJustificationPost(justPostResult.data.message);
      }

      // Check which API calls succeeded
      const failedCalls = [];
      if (!effectsResult || !effectsResult.success) failedCalls.push('effects');
      if (!causesResult || !causesResult.success) failedCalls.push('causes');
      if (!controlsResult || !controlsResult.success) failedCalls.push('controls');

      if (failedCalls.length > 0) {
        console.warn('⚠️ Some AI suggestions used fallbacks:', failedCalls);
        toast.warning(`Using generic suggestions for ${failedCalls.join(', ')} - AI service limited`);
      } else {
        console.log('✅ All AI suggestions successfully generated');
        toast.success('Form auto-filled with AI suggestions!');
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error('Auto-fill failed. Please fill manually.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effects.trim() && potentialCause.trim() && currentDesign.trim()) {
      onSave({
        effects,
        sev,
        potentialCause,
        occ,
        currentDesign,
        det,
        justificationPre,
        recommendedActions,
        justificationPost,
        responsible,
        actionStatus,
        sevPost,
        occPost,
        detPost,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Add Effect</h3>
          <button
            type="button"
            onClick={handleAutoFill}
            disabled={isAutoFilling}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {isAutoFilling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Auto-filling...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Auto-fill with AI
              </>
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <form onSubmit={handleSubmit} className="space-y-4" id="effect-form">
          <div className="border-b border-gray-200 dark:border-slate-700 pb-4">
            <h4 className="text-md font-semibold text-gray-800 dark:text-slate-200 mb-3">Pre-Mitigation</h4>
            <div className="grid grid-cols-3 gap-4">
              {/* Column 1: Effect Description & Severity */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Effect Description</label>
                <input type="text" value={effects} onChange={(e) => setEffects(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" placeholder="e.g., Safety hazard, Plant downtime" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Severity (1-{maxRating})</label>
                <input type="number" min="1" max={maxRating} value={sev} onChange={(e) => setSev(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" required />
              </div>

              {/* Column 2: Potential Cause & Occurrence */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Potential Cause</label>
                <input type="text" value={potentialCause} onChange={(e) => setPotentialCause(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" placeholder="e.g., Worn seal, Age degradation" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Occurrence (1-{maxRating})</label>
                <input type="number" min="1" max={maxRating} value={occ} onChange={(e) => setOcc(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" required />
              </div>

              {/* Column 3: Current Design Controls & Detection */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Current Design Controls</label>
                <input type="text" value={currentDesign} onChange={(e) => setCurrentDesign(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" placeholder="e.g., Regular inspection, Visual checks" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Detection (1-{maxRating})</label>
                <input type="number" min="1" max={maxRating} value={det} onChange={(e) => setDet(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" required />
              </div>

              {/* Justification (Pre) - Full width */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Justification (Pre-Mitigation)</label>
                <textarea
                  value={justificationPre}
                  onChange={(e) => setJustificationPre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Justification for pre-mitigation ratings..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Post-Mitigation Section */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 dark:text-slate-200 mb-3">Post-Mitigation</h4>
            <div className="grid grid-cols-3 gap-4">
              {/* Recommended Actions - Full width */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Recommended Actions</label>
                <textarea
                  value={recommendedActions}
                  onChange={(e) => setRecommendedActions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Describe recommended corrective actions..."
                  rows={2}
                />
              </div>

              {/* Justification (Post) - Full width */}
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Justification (Post-Mitigation)</label>
                <textarea
                  value={justificationPost}
                  onChange={(e) => setJustificationPost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Justification for post-mitigation ratings..."
                  rows={2}
                />
              </div>

              {/* Responsible Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Responsible</label>
                <input
                  type="text"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Person responsible"
                />
              </div>

              {/* Action Status */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Action Status</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value as 'Not Started' | 'In Progress' | 'Done')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              {/* Post-Mitigation Ratings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">SEV (Post)</label>
                <input type="number" min="1" max={maxRating} value={sevPost} onChange={(e) => setSevPost(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">OCC (Post)</label>
                <input type="number" min="1" max={maxRating} value={occPost} onChange={(e) => setOccPost(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">DET (Post)</label>
                <input type="number" min="1" max={maxRating} value={detPost} onChange={(e) => setDetPost(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100" />
              </div>
            </div>
          </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-slate-700">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors">Cancel</button>
          <button type="submit" form="effect-form" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors">Add Effect</button>
        </div>
      </div>
    </div>
  );
}
