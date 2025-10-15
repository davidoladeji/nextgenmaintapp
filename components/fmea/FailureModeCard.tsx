'use client';

import { useState } from 'react';
import { X, Edit, Save, Plus, AlertTriangle, Clock, User, Trash2, Sparkles } from 'lucide-react';
import { FailureMode, Project } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/store';
import AISuggestionModal from '../ai/AISuggestionModal';
import AIInputField from '../common/AIInputField';
import DynamicContextToolbar from './DynamicContextToolbar';

interface FailureModeCardProps {
  failureMode: FailureMode;
  project: Project;
  onClose: () => void;
  onUpdate: (updatedFailureMode: FailureMode) => void;
  onDelete?: (failureModeId: string) => void;
}

export default function FailureModeCard({
  failureMode,
  project,
  onClose,
  onUpdate,
  onDelete
}: FailureModeCardProps) {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    processStep: failureMode.process_step,
    failureMode: failureMode.failure_mode,
    status: failureMode.status,
  });

  // Add form states
  const [showAddCause, setShowAddCause] = useState(false);
  const [showAddEffect, setShowAddEffect] = useState(false);
  const [showAddControl, setShowAddControl] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [newCause, setNewCause] = useState({ description: '', occurrence: 5 });
  const [newEffect, setNewEffect] = useState({ description: '', severity: 5 });
  const [newControl, setNewControl] = useState({ type: 'prevention' as 'prevention' | 'detection', description: '', detection: 5, effectiveness: 5 });
  const [newAction, setNewAction] = useState({ description: '', owner: '', dueDate: '', status: 'open' as 'open' | 'in-progress' | 'completed' | 'cancelled' });

  // AI Suggestion states
  const [showAISuggestCauses, setShowAISuggestCauses] = useState(false);
  const [showAISuggestEffects, setShowAISuggestEffects] = useState(false);
  const [showAISuggestControls, setShowAISuggestControls] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<any[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Monday.com-style inline editing states
  const [selectedCauseId, setSelectedCauseId] = useState<string | null>(null);
  const [editingCauseId, setEditingCauseId] = useState<string | null>(null);
  const [editCauseData, setEditCauseData] = useState({ description: '', occurrence: 5 });

  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [editingEffectId, setEditingEffectId] = useState<string | null>(null);
  const [editEffectData, setEditEffectData] = useState({ description: '', severity: 5 });

  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [editingControlId, setEditingControlId] = useState<string | null>(null);
  const [editControlData, setEditControlData] = useState({ type: 'prevention' as 'prevention' | 'detection', description: '', detection: 5, effectiveness: 5 });

  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editActionData, setEditActionData] = useState({ description: '', owner: '', dueDate: '', status: 'open' as 'open' | 'in-progress' | 'completed' | 'cancelled' });

  // Calculate RPN for display
  const calculateRPN = () => {
    if (failureMode.causes.length === 0 || failureMode.effects.length === 0) {
      return { rpn: 0, severity: 0, occurrence: 0, detection: 10 };
    }

    let maxRPN = 0;
    let maxSeverity = 0;
    let maxOccurrence = 0;
    let maxDetection = 10;

    for (const cause of failureMode.causes) {
      for (const effect of failureMode.effects) {
        const detectionScore = failureMode.controls.length > 0 
          ? Math.min(...failureMode.controls.map(c => c.detection))
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

    return {
      rpn: maxRPN,
      severity: maxSeverity,
      occurrence: maxOccurrence,
      detection: maxDetection,
    };
  };

  const risk = calculateRPN();

  const getRiskColor = (rpn: number) => {
    if (rpn >= 200) return 'text-red-600 bg-red-50';
    if (rpn >= 100) return 'text-orange-600 bg-orange-50';
    if (rpn >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not available';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Add handlers for new items
  const handleAddCause = async () => {
    if (!newCause.description.trim()) {
      toast.error('Please enter a cause description');
      return;
    }

    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/causes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCause),
      });

      if (response.ok) {
        const cause = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          causes: [...(failureMode.causes || []), cause.data],
        };
        onUpdate(updatedFailureMode);
        setNewCause({ description: '', occurrence: 5 });
        setShowAddCause(false);
        toast.success('Cause added successfully');
      } else {
        toast.error('Failed to add cause');
      }
    } catch (error) {
      toast.error('Error adding cause');
    }
  };

  const handleUpdateCause = async (causeId: string) => {
    if (!editCauseData.description.trim()) {
      toast.error('Please enter a cause description');
      return;
    }

    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/causes/${causeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editCauseData),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          causes: failureMode.causes.map(c => c.id === causeId ? result.data : c),
        };
        onUpdate(updatedFailureMode);
        setEditingCauseId(null);
        setSelectedCauseId(null);
        toast.success('Cause updated successfully');
      } else {
        toast.error('Failed to update cause');
      }
    } catch (error) {
      toast.error('Error updating cause');
    }
  };

  const handleDeleteCause = async (causeId: string) => {
    if (!confirm('Are you sure you want to delete this cause?')) return;

    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/causes/${causeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const updatedFailureMode = {
          ...failureMode,
          causes: failureMode.causes.filter(c => c.id !== causeId),
        };
        onUpdate(updatedFailureMode);
        setSelectedCauseId(null);
        toast.success('Cause deleted successfully');
      } else {
        toast.error('Failed to delete cause');
      }
    } catch (error) {
      toast.error('Error deleting cause');
    }
  };

  const handleDuplicateCause = async (causeId: string) => {
    const cause = failureMode.causes.find(c => c.id === causeId);
    if (!cause) return;

    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/causes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          description: `${cause.description} (Copy)`,
          occurrence: cause.occurrence,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          causes: [...failureMode.causes, result.data],
        };
        onUpdate(updatedFailureMode);
        setSelectedCauseId(null);
        toast.success('Cause duplicated successfully');
      } else {
        toast.error('Failed to duplicate cause');
      }
    } catch (error) {
      toast.error('Error duplicating cause');
    }
  };

  const handleAddEffect = async () => {
    if (!newEffect.description.trim()) {
      toast.error('Please enter an effect description');
      return;
    }

    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/effects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEffect),
      });

      if (response.ok) {
        const effect = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          effects: [...(failureMode.effects || []), effect.data],
        };
        onUpdate(updatedFailureMode);
        setNewEffect({ description: '', severity: 5 });
        setShowAddEffect(false);
        toast.success('Effect added successfully');
      } else {
        toast.error('Failed to add effect');
      }
    } catch (error) {
      toast.error('Error adding effect');
    }
  };

  const handleUpdateEffect = async (effectId: string) => {
    if (!editEffectData.description.trim()) {
      toast.error('Please enter an effect description');
      return;
    }
    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/effects/${effectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editEffectData),
      });
      if (response.ok) {
        const result = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          effects: failureMode.effects.map(e => e.id === effectId ? result.data : e),
        };
        onUpdate(updatedFailureMode);
        setEditingEffectId(null);
        setSelectedEffectId(null);
        toast.success('Effect updated successfully');
      }
    } catch (error) {
      toast.error('Error updating effect');
    }
  };

  const handleDeleteEffect = async (effectId: string) => {
    if (!confirm('Are you sure you want to delete this effect?')) return;
    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/effects/${effectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const updatedFailureMode = {
          ...failureMode,
          effects: failureMode.effects.filter(e => e.id !== effectId),
        };
        onUpdate(updatedFailureMode);
        setSelectedEffectId(null);
        toast.success('Effect deleted successfully');
      }
    } catch (error) {
      toast.error('Error deleting effect');
    }
  };

  const handleDuplicateEffect = async (effectId: string) => {
    const effect = failureMode.effects.find(e => e.id === effectId);
    if (!effect) return;
    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/effects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          description: `${effect.description} (Copy)`,
          severity: effect.severity,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          effects: [...failureMode.effects, result.data],
        };
        onUpdate(updatedFailureMode);
        setSelectedEffectId(null);
        toast.success('Effect duplicated successfully');
      }
    } catch (error) {
      toast.error('Error duplicating effect');
    }
  };

  const handleAddControl = async () => {
    if (!newControl.description.trim()) {
      toast.error('Please enter a control description');
      return;
    }

    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/controls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newControl),
      });

      if (response.ok) {
        const control = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          controls: [...(failureMode.controls || []), control.data],
        };
        onUpdate(updatedFailureMode);
        setNewControl({ type: 'prevention', description: '', detection: 5, effectiveness: 5 });
        setShowAddControl(false);
        toast.success('Control added successfully');
      } else {
        toast.error('Failed to add control');
      }
    } catch (error) {
      toast.error('Error adding control');
    }
  };

  const handleUpdateControl = async (controlId: string) => {
    if (!editControlData.description.trim()) {
      toast.error('Please enter a control description');
      return;
    }
    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/controls/${controlId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editControlData),
      });
      if (response.ok) {
        const result = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          controls: failureMode.controls.map(c => c.id === controlId ? result.data : c),
        };
        onUpdate(updatedFailureMode);
        setEditingControlId(null);
        setSelectedControlId(null);
        toast.success('Control updated successfully');
      }
    } catch (error) {
      toast.error('Error updating control');
    }
  };

  const handleDeleteControl = async (controlId: string) => {
    if (!confirm('Are you sure you want to delete this control?')) return;
    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/controls/${controlId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const updatedFailureMode = {
          ...failureMode,
          controls: failureMode.controls.filter(c => c.id !== controlId),
        };
        onUpdate(updatedFailureMode);
        setSelectedControlId(null);
        toast.success('Control deleted successfully');
      }
    } catch (error) {
      toast.error('Error deleting control');
    }
  };

  const handleDuplicateControl = async (controlId: string) => {
    const control = failureMode.controls.find(c => c.id === controlId);
    if (!control) return;
    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/controls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          type: control.type,
          description: `${control.description} (Copy)`,
          detection: control.detection,
          effectiveness: control.effectiveness,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          controls: [...failureMode.controls, result.data],
        };
        onUpdate(updatedFailureMode);
        setSelectedControlId(null);
        toast.success('Control duplicated successfully');
      }
    } catch (error) {
      toast.error('Error duplicating control');
    }
  };

  const handleAddAction = async () => {
    if (!newAction.description.trim()) {
      toast.error('Please enter an action description');
      return;
    }

    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAction),
      });

      if (response.ok) {
        const action = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          actions: [...(failureMode.actions || []), action.data],
        };
        onUpdate(updatedFailureMode);
        setNewAction({ description: '', owner: '', dueDate: '', status: 'open' });
        setShowAddAction(false);
        toast.success('Action added successfully');
      } else {
        toast.error('Failed to add action');
      }
    } catch (error) {
      toast.error('Error adding action');
    }
  };

  const handleUpdateAction = async (actionId: string) => {
    if (!editActionData.description.trim()) {
      toast.error('Please enter an action description');
      return;
    }
    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/actions/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editActionData),
      });
      if (response.ok) {
        const result = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          actions: failureMode.actions.map(a => a.id === actionId ? result.data : a),
        };
        onUpdate(updatedFailureMode);
        setEditingActionId(null);
        setSelectedActionId(null);
        toast.success('Action updated successfully');
      }
    } catch (error) {
      toast.error('Error updating action');
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Are you sure you want to delete this action?')) return;
    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/actions/${actionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const updatedFailureMode = {
          ...failureMode,
          actions: failureMode.actions.filter(a => a.id !== actionId),
        };
        onUpdate(updatedFailureMode);
        setSelectedActionId(null);
        toast.success('Action deleted successfully');
      }
    } catch (error) {
      toast.error('Error deleting action');
    }
  };

  const handleDuplicateAction = async (actionId: string) => {
    const action = failureMode.actions.find(a => a.id === actionId);
    if (!action) return;
    try {
      const response = await fetch(`/api/failure-modes/${failureMode.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          description: `${action.description} (Copy)`,
          owner: action.owner,
          dueDate: action.dueDate,
          status: action.status,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        const updatedFailureMode = {
          ...failureMode,
          actions: [...failureMode.actions, result.data],
        };
        onUpdate(updatedFailureMode);
        setSelectedActionId(null);
        toast.success('Action duplicated successfully');
      }
    } catch (error) {
      toast.error('Error duplicating action');
    }
  };

  const handleSave = async () => {
    // In a real implementation, this would make an API call to update the failure mode
    const updatedFailureMode = {
      ...failureMode,
      ...editData,
      updatedAt: new Date(),
    };

    onUpdate(updatedFailureMode);
    setIsEditing(false);
    toast.success('Failure mode updated');
  };

  // AI Suggestion Handlers
  const handleAISuggestCauses = async () => {
    setIsLoadingAI(true);
    setShowAISuggestCauses(true);

    try {
      const response = await fetch('/api/ai/suggest', {
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
              failureMode: failureMode.failure_mode,
              processStep: failureMode.process_step,
            },
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAISuggestions(result.data.suggestions || []);
      } else {
        toast.error('Failed to get AI suggestions');
        setShowAISuggestCauses(false);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast.error('AI suggestions temporarily unavailable');
      setShowAISuggestCauses(false);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAISuggestEffects = async () => {
    setIsLoadingAI(true);
    setShowAISuggestEffects(true);

    try {
      const response = await fetch('/api/ai/suggest', {
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
              failureMode: failureMode.failure_mode,
              processStep: failureMode.process_step,
            },
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAISuggestions(result.data.suggestions || []);
      } else {
        toast.error('Failed to get AI suggestions');
        setShowAISuggestEffects(false);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast.error('AI suggestions temporarily unavailable');
      setShowAISuggestEffects(false);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAISuggestControls = async () => {
    setIsLoadingAI(true);
    setShowAISuggestControls(true);

    try {
      const response = await fetch('/api/ai/suggest', {
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
              failureMode: failureMode.failure_mode,
              processStep: failureMode.process_step,
            },
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setAISuggestions(result.data.suggestions || []);
      } else {
        toast.error('Failed to get AI suggestions');
        setShowAISuggestControls(false);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast.error('AI suggestions temporarily unavailable');
      setShowAISuggestControls(false);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAcceptCauses = async (selectedSuggestions: any[]) => {
    try {
      // Create causes from selections
      const createPromises = selectedSuggestions.map((suggestion) =>
        fetch(`/api/failure-modes/${failureMode.id}/causes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: suggestion.text,
            occurrence: suggestion.occurrence || 5,
          }),
        })
      );

      await Promise.all(createPromises);
      toast.success(`Added ${selectedSuggestions.length} causes`);
      setShowAISuggestCauses(false);

      // Refresh data (call parent callback or refetch)
      window.location.reload();
    } catch (error) {
      console.error('Error creating causes:', error);
      toast.error('Failed to create causes');
    }
  };

  const handleAcceptEffects = async (selectedSuggestions: any[]) => {
    try {
      const createPromises = selectedSuggestions.map((suggestion) =>
        fetch(`/api/failure-modes/${failureMode.id}/effects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: suggestion.text,
            severity: suggestion.severity || 5,
          }),
        })
      );

      await Promise.all(createPromises);
      toast.success(`Added ${selectedSuggestions.length} effects`);
      setShowAISuggestEffects(false);
      window.location.reload();
    } catch (error) {
      console.error('Error creating effects:', error);
      toast.error('Failed to create effects');
    }
  };

  const handleAcceptControls = async (selectedSuggestions: any[]) => {
    try {
      const createPromises = selectedSuggestions.map((suggestion) =>
        fetch(`/api/failure-modes/${failureMode.id}/controls`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: suggestion.type || 'prevention',
            description: suggestion.text,
            detection: suggestion.detection || 5,
            effectiveness: suggestion.effectiveness || 5,
          }),
        })
      );

      await Promise.all(createPromises);
      toast.success(`Added ${selectedSuggestions.length} controls`);
      setShowAISuggestControls(false);
      window.location.reload();
    } catch (error) {
      console.error('Error creating controls:', error);
      toast.error('Failed to create controls');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900">Failure Mode Details</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            failureMode.status === 'active' ? 'bg-green-100 text-green-800' :
            failureMode.status === 'closed' ? 'bg-gray-100 text-gray-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {failureMode.status}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={isEditing ? 'Cancel editing' : 'Edit failure mode'}
          >
            <Edit className="w-4 h-4 text-gray-500" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(failureMode.id)}
              className="p-2 hover:bg-red-50 rounded-md transition-colors"
              title="Delete failure mode"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Close details"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Basic Information */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Basic Information</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Process Step
              </label>
              {isEditing ? (
                <AIInputField
                  value={editData.processStep}
                  onChange={(value) => setEditData({...editData, processStep: value})}
                  type="text"
                  className="text-sm"
                  token={token}
                  aiContext={{
                    type: 'processStep',
                    asset: project.asset,
                  }}
                />
              ) : (
                <p className="text-sm text-gray-900">{failureMode.process_step}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Failure Mode
              </label>
              {isEditing ? (
                <AIInputField
                  value={editData.failureMode}
                  onChange={(value) => setEditData({...editData, failureMode: value})}
                  type="textarea"
                  className="text-sm min-h-[60px]"
                  rows={3}
                  token={token}
                  aiContext={{
                    type: 'failureMode',
                    asset: project.asset,
                    processStep: editData.processStep,
                  }}
                />
              ) : (
                <p className="text-sm text-gray-900">{failureMode.failure_mode}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              {isEditing ? (
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({...editData, status: e.target.value as any})}
                  className="input text-sm"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900 capitalize">{failureMode.status}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="mt-4 flex space-x-2">
              <button onClick={handleSave} className="btn-primary btn-sm">
                <Save className="w-4 h-4 mr-1" />
                Save
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Risk Assessment */}
        <div>
          <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Risk Assessment</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Severity</div>
                <div className="text-lg font-bold text-gray-900">{risk.severity}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Occurrence</div>
                <div className="text-lg font-bold text-gray-900">{risk.occurrence}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Detection</div>
                <div className="text-lg font-bold text-gray-900">{risk.detection}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">RPN</div>
                <div className={`text-xl font-bold px-2 py-1 rounded ${getRiskColor(risk.rpn)}`}>
                  {risk.rpn}
                </div>
              </div>
            </div>
            
            {risk.rpn >= 200 && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4 mr-2" />
                High risk - immediate action required
              </div>
            )}
          </div>
        </div>

        {/* Causes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Causes ({failureMode.causes?.length || 0})
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleAISuggestCauses}
                className="btn-secondary btn-sm"
              >
                <Sparkles className="w-3 h-3 mr-1 text-purple-600" />
                AI Suggest
              </button>
              <button
                onClick={() => setShowAddCause(true)}
                className="btn-secondary btn-sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {failureMode.causes.map((cause) => {
              const isSelected = selectedCauseId === cause.id;
              const isEditMode = editingCauseId === cause.id;

              if (isEditMode) {
                // Edit Mode: Inline form with Save/Cancel
                return (
                  <div key={cause.id} className="bg-blue-50 rounded-lg p-3 border-2 border-blue-400">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cause Description
                        </label>
                        <AIInputField
                          value={editCauseData.description}
                          onChange={(value) => setEditCauseData({...editCauseData, description: value})}
                          type="textarea"
                          className="text-sm min-h-[60px] text-gray-900"
                          placeholder="Describe the potential cause..."
                          rows={3}
                          token={token}
                          aiContext={{
                            type: 'cause',
                            asset: project.asset,
                            failureMode: {
                              failureMode: failureMode.failure_mode,
                              processStep: failureMode.process_step,
                            },
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Occurrence (1-10)
                        </label>
                        <select
                          value={editCauseData.occurrence}
                          onChange={(e) => setEditCauseData({...editCauseData, occurrence: parseInt(e.target.value)})}
                          className="input text-sm text-gray-900"
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateCause(cause.id)}
                          className="btn-primary btn-sm"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCauseId(null);
                            setSelectedCauseId(null);
                          }}
                          className="btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Read/Selected Mode: Monday.com style clickable card
              return (
                <div
                  key={cause.id}
                  onClick={() => setSelectedCauseId(isSelected ? null : cause.id)}
                  className={`rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-100 border-2 border-blue-500 shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-900 flex-1">{cause.description}</p>
                    <div className="ml-3 text-center">
                      <div className="text-xs text-gray-500">OCC</div>
                      <div className="text-sm font-medium">{cause.occurrence}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {failureMode.causes.length === 0 && (
              <p className="text-sm text-gray-500 italic">No causes defined</p>
            )}

            {/* Add Cause Form */}
            {showAddCause && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cause Description
                    </label>
                    <AIInputField
                      value={newCause.description}
                      onChange={(value) => setNewCause({...newCause, description: value})}
                      type="textarea"
                      className="text-sm min-h-[60px] text-gray-900"
                      placeholder="Describe the potential cause..."
                      rows={3}
                      token={token}
                      aiContext={{
                        type: 'cause',
                        asset: project.asset,
                        failureMode: {
                          failureMode: failureMode.failure_mode,
                          processStep: failureMode.process_step,
                        },
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Occurrence (1-10)
                    </label>
                    <select
                      value={newCause.occurrence}
                      onChange={(e) => setNewCause({...newCause, occurrence: parseInt(e.target.value)})}
                      className="input text-sm text-gray-900"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={handleAddCause} className="btn-primary btn-sm">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Cause
                    </button>
                    <button 
                      onClick={() => {
                        setShowAddCause(false);
                        setNewCause({ description: '', occurrence: 5 });
                      }}
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Context Toolbar for Causes */}
          {selectedCauseId && !editingCauseId && (
            <DynamicContextToolbar
              type="cause"
              onEdit={() => {
                const cause = failureMode.causes.find(c => c.id === selectedCauseId);
                if (cause) {
                  setEditCauseData({
                    description: cause.description,
                    occurrence: cause.occurrence,
                  });
                  setEditingCauseId(selectedCauseId);
                }
              }}
              onDuplicate={() => handleDuplicateCause(selectedCauseId)}
              onDelete={() => handleDeleteCause(selectedCauseId)}
              onAISuggest={() => {
                // TODO: Implement AI suggest for existing cause
                toast.info('AI suggestions for existing items coming soon');
              }}
            />
          )}
        </div>

        {/* Effects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Effects ({failureMode.effects.length})
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleAISuggestEffects}
                className="btn-secondary btn-sm"
              >
                <Sparkles className="w-3 h-3 mr-1 text-purple-600" />
                AI Suggest
              </button>
              <button
                onClick={() => setShowAddEffect(true)}
                className="btn-secondary btn-sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {failureMode.effects.map((effect) => {
              const isSelected = selectedEffectId === effect.id;
              const isEditMode = editingEffectId === effect.id;

              if (isEditMode) {
                return (
                  <div key={effect.id} className="bg-blue-50 rounded-lg p-3 border-2 border-blue-400">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Effect Description
                        </label>
                        <AIInputField
                          value={editEffectData.description}
                          onChange={(value) => setEditEffectData({...editEffectData, description: value})}
                          type="textarea"
                          className="text-sm min-h-[60px] text-gray-900"
                          placeholder="Describe the potential effect..."
                          rows={3}
                          token={token}
                          aiContext={{
                            type: 'effect',
                            asset: project.asset,
                            failureMode: {
                              failureMode: failureMode.failure_mode,
                              processStep: failureMode.process_step,
                            },
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Severity (1-10)
                        </label>
                        <select
                          value={editEffectData.severity}
                          onChange={(e) => setEditEffectData({...editEffectData, severity: parseInt(e.target.value)})}
                          className="input text-sm text-gray-900"
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateEffect(effect.id)}
                          className="btn-primary btn-sm"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingEffectId(null);
                            setSelectedEffectId(null);
                          }}
                          className="btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={effect.id}
                  onClick={() => setSelectedEffectId(isSelected ? null : effect.id)}
                  className={`rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-100 border-2 border-blue-500 shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-gray-900 flex-1">{effect.description}</p>
                    <div className="ml-3 text-center">
                      <div className="text-xs text-gray-500">SEV</div>
                      <div className="text-sm font-medium">{effect.severity}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {failureMode.effects.length === 0 && (
              <p className="text-sm text-gray-500 italic">No effects defined</p>
            )}

            {/* Add Effect Form */}
            {showAddEffect && (
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Effect Description
                    </label>
                    <AIInputField
                      value={newEffect.description}
                      onChange={(value) => setNewEffect({...newEffect, description: value})}
                      type="textarea"
                      className="text-sm min-h-[60px] text-gray-900"
                      placeholder="Describe the potential effect..."
                      rows={3}
                      token={token}
                      aiContext={{
                        type: 'effect',
                        asset: project.asset,
                        failureMode: {
                          failureMode: failureMode.failure_mode,
                          processStep: failureMode.process_step,
                        },
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Severity (1-10)
                    </label>
                    <select
                      value={newEffect.severity}
                      onChange={(e) => setNewEffect({...newEffect, severity: parseInt(e.target.value)})}
                      className="input text-sm text-gray-900"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={handleAddEffect} className="btn-primary btn-sm">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Effect
                    </button>
                    <button 
                      onClick={() => {
                        setShowAddEffect(false);
                        setNewEffect({ description: '', severity: 5 });
                      }}
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Context Toolbar for Effects */}
          {selectedEffectId && !editingEffectId && (
            <DynamicContextToolbar
              type="effect"
              onEdit={() => {
                const effect = failureMode.effects.find(e => e.id === selectedEffectId);
                if (effect) {
                  setEditEffectData({
                    description: effect.description,
                    severity: effect.severity,
                  });
                  setEditingEffectId(selectedEffectId);
                }
              }}
              onDuplicate={() => handleDuplicateEffect(selectedEffectId)}
              onDelete={() => handleDeleteEffect(selectedEffectId)}
              onAISuggest={() => {
                toast.info('AI suggestions for existing items coming soon');
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Controls ({failureMode.controls.length})
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handleAISuggestControls}
                className="btn-secondary btn-sm"
              >
                <Sparkles className="w-3 h-3 mr-1 text-purple-600" />
                AI Suggest
              </button>
              <button
                onClick={() => setShowAddControl(true)}
                className="btn-secondary btn-sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {failureMode.controls.map((control) => {
              const isSelected = selectedControlId === control.id;
              const isEditMode = editingControlId === control.id;

              if (isEditMode) {
                return (
                  <div key={control.id} className="bg-blue-50 rounded-lg p-3 border-2 border-blue-400">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Control Type
                        </label>
                        <select
                          value={editControlData.type}
                          onChange={(e) => setEditControlData({...editControlData, type: e.target.value as 'prevention' | 'detection'})}
                          className="input text-sm text-gray-900"
                        >
                          <option value="prevention">Prevention</option>
                          <option value="detection">Detection</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Control Description
                        </label>
                        <AIInputField
                          value={editControlData.description}
                          onChange={(value) => setEditControlData({...editControlData, description: value})}
                          type="textarea"
                          className="text-sm min-h-[60px] text-gray-900"
                          placeholder="Describe the control measure..."
                          rows={3}
                          token={token}
                          aiContext={{
                            type: 'control',
                            asset: project.asset,
                            failureMode: {
                              failureMode: failureMode.failure_mode,
                              processStep: failureMode.process_step,
                            },
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Detection (1-10)
                          </label>
                          <select
                            value={editControlData.detection}
                            onChange={(e) => setEditControlData({...editControlData, detection: parseInt(e.target.value)})}
                            className="input text-sm text-gray-900"
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Effectiveness (1-10)
                          </label>
                          <select
                            value={editControlData.effectiveness}
                            onChange={(e) => setEditControlData({...editControlData, effectiveness: parseInt(e.target.value)})}
                            className="input text-sm text-gray-900"
                          >
                            {[1,2,3,4,5,6,7,8,9,10].map(num => (
                              <option key={num} value={num}>{num}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateControl(control.id)}
                          className="btn-primary btn-sm"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingControlId(null);
                            setSelectedControlId(null);
                          }}
                          className="btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={control.id}
                  onClick={() => setSelectedControlId(isSelected ? null : control.id)}
                  className={`rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-100 border-2 border-blue-500 shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          control.type === 'prevention'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {control.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{control.description}</p>
                    </div>
                    <div className="ml-3 text-center">
                      <div className="text-xs text-gray-500">DET</div>
                      <div className="text-sm font-medium">{control.detection}</div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {failureMode.controls.length === 0 && (
              <p className="text-sm text-gray-500 italic">No controls defined</p>
            )}

            {/* Add Control Form */}
            {showAddControl && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Control Type
                    </label>
                    <select
                      value={newControl.type}
                      onChange={(e) => setNewControl({...newControl, type: e.target.value as 'prevention' | 'detection'})}
                      className="input text-sm text-gray-900"
                    >
                      <option value="prevention">Prevention</option>
                      <option value="detection">Detection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Control Description
                    </label>
                    <AIInputField
                      value={newControl.description}
                      onChange={(value) => setNewControl({...newControl, description: value})}
                      type="textarea"
                      className="text-sm min-h-[60px] text-gray-900"
                      placeholder="Describe the control measure..."
                      rows={3}
                      token={token}
                      aiContext={{
                        type: 'control',
                        asset: project.asset,
                        failureMode: {
                          failureMode: failureMode.failure_mode,
                          processStep: failureMode.process_step,
                        },
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Detection (1-10)
                      </label>
                      <select
                        value={newControl.detection}
                        onChange={(e) => setNewControl({...newControl, detection: parseInt(e.target.value)})}
                        className="input text-sm text-gray-900"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Effectiveness (1-10)
                      </label>
                      <select
                        value={newControl.effectiveness}
                        onChange={(e) => setNewControl({...newControl, effectiveness: parseInt(e.target.value)})}
                        className="input text-sm text-gray-900"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={handleAddControl} className="btn-primary btn-sm">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Control
                    </button>
                    <button 
                      onClick={() => {
                        setShowAddControl(false);
                        setNewControl({ type: 'prevention', description: '', detection: 5, effectiveness: 5 });
                      }}
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Context Toolbar for Controls */}
          {selectedControlId && !editingControlId && (
            <DynamicContextToolbar
              type="control"
              onEdit={() => {
                const control = failureMode.controls.find(c => c.id === selectedControlId);
                if (control) {
                  setEditControlData({
                    type: control.type,
                    description: control.description,
                    detection: control.detection,
                    effectiveness: control.effectiveness,
                  });
                  setEditingControlId(selectedControlId);
                }
              }}
              onDuplicate={() => handleDuplicateControl(selectedControlId)}
              onDelete={() => handleDeleteControl(selectedControlId)}
              onAISuggest={() => {
                toast.info('AI suggestions for existing items coming soon');
              }}
            />
          )}
        </div>

        {/* Actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Actions ({failureMode.actions.length})
            </h4>
            <button 
              onClick={() => setShowAddAction(true)}
              className="btn-secondary btn-sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </button>
          </div>
          
          <div className="space-y-2">
            {failureMode.actions.map((action) => {
              const isSelected = selectedActionId === action.id;
              const isEditMode = editingActionId === action.id;

              if (isEditMode) {
                return (
                  <div key={action.id} className="bg-blue-50 rounded-lg p-3 border-2 border-blue-400">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Action Description
                        </label>
                        <AIInputField
                          value={editActionData.description}
                          onChange={(value) => setEditActionData({...editActionData, description: value})}
                          type="textarea"
                          className="text-sm min-h-[60px] text-gray-900"
                          placeholder="Describe the action..."
                          rows={3}
                          token={token}
                          aiContext={{
                            type: 'action',
                            asset: project.asset,
                            failureMode: {
                              failureMode: failureMode.failure_mode,
                              processStep: failureMode.process_step,
                            },
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Owner
                          </label>
                          <input
                            type="text"
                            value={editActionData.owner}
                            onChange={(e) => setEditActionData({...editActionData, owner: e.target.value})}
                            className="input text-sm text-gray-900"
                            placeholder="Action owner..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={editActionData.dueDate}
                            onChange={(e) => setEditActionData({...editActionData, dueDate: e.target.value})}
                            className="input text-sm text-gray-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={editActionData.status}
                          onChange={(e) => setEditActionData({...editActionData, status: e.target.value as any})}
                          className="input text-sm text-gray-900"
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateAction(action.id)}
                          className="btn-primary btn-sm"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingActionId(null);
                            setSelectedActionId(null);
                          }}
                          className="btn-secondary btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={action.id}
                  onClick={() => setSelectedActionId(isSelected ? null : action.id)}
                  className={`rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-100 border-2 border-blue-500 shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-900 flex-1">{action.description}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      action.status === 'completed' ? 'bg-green-100 text-green-800' :
                      action.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      action.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {action.status}
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {action.owner}
                    </div>
                    {action.dueDate && (
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(action.dueDate)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {failureMode.actions.length === 0 && (
              <p className="text-sm text-gray-500 italic">No actions defined</p>
            )}

            {/* Add Action Form */}
            {showAddAction && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Action Description
                    </label>
                    <AIInputField
                      value={newAction.description}
                      onChange={(value) => setNewAction({...newAction, description: value})}
                      type="textarea"
                      className="text-sm min-h-[60px] text-gray-900"
                      placeholder="Describe the corrective action..."
                      rows={3}
                      token={token}
                      aiContext={{
                        type: 'action',
                        asset: project.asset,
                        failureMode: {
                          failureMode: failureMode.failure_mode,
                          processStep: failureMode.process_step,
                        },
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Owner
                      </label>
                      <AIInputField
                        value={newAction.owner}
                        onChange={(value) => setNewAction({...newAction, owner: value})}
                        type="text"
                        className="text-sm text-gray-900"
                        placeholder="Responsible person..."
                        token={token}
                        aiContext={{
                          type: 'action',
                          asset: project.asset,
                          failureMode: {
                            failureMode: failureMode.failure_mode,
                            processStep: failureMode.process_step,
                          },
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newAction.dueDate}
                        onChange={(e) => setNewAction({...newAction, dueDate: e.target.value})}
                        className="input text-sm text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newAction.status}
                      onChange={(e) => setNewAction({...newAction, status: e.target.value as 'open' | 'in-progress' | 'completed' | 'cancelled'})}
                      className="input text-sm text-gray-900"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={handleAddAction} className="btn-primary btn-sm">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Action
                    </button>
                    <button 
                      onClick={() => {
                        setShowAddAction(false);
                        setNewAction({ description: '', owner: '', dueDate: '', status: 'open' });
                      }}
                      className="btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Context Toolbar for Actions */}
          {selectedActionId && !editingActionId && (
            <DynamicContextToolbar
              type="action"
              onEdit={() => {
                const action = failureMode.actions.find(a => a.id === selectedActionId);
                if (action) {
                  setEditActionData({
                    description: action.description,
                    owner: action.owner,
                    dueDate: action.dueDate,
                    status: action.status,
                  });
                  setEditingActionId(selectedActionId);
                }
              }}
              onDuplicate={() => handleDuplicateAction(selectedActionId)}
              onDelete={() => handleDeleteAction(selectedActionId)}
              onAISuggest={() => {
                toast.info('AI suggestions for existing items coming soon');
              }}
            />
          )}
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
          <div>Created: {formatDate(failureMode.created_at)}</div>
          <div>Last updated: {formatDate(failureMode.updated_at)}</div>
        </div>
      </div>

      {/* AI Suggestion Modals */}
      <AISuggestionModal
        isOpen={showAISuggestCauses}
        onClose={() => setShowAISuggestCauses(false)}
        onAccept={handleAcceptCauses}
        suggestions={aiSuggestions}
        title="AI Suggested Causes"
        type="causes"
        isLoading={isLoadingAI}
      />

      <AISuggestionModal
        isOpen={showAISuggestEffects}
        onClose={() => setShowAISuggestEffects(false)}
        onAccept={handleAcceptEffects}
        suggestions={aiSuggestions}
        title="AI Suggested Effects"
        type="effects"
        isLoading={isLoadingAI}
      />

      <AISuggestionModal
        isOpen={showAISuggestControls}
        onClose={() => setShowAISuggestControls(false)}
        onAccept={handleAcceptControls}
        suggestions={aiSuggestions}
        title="AI Suggested Controls"
        type="controls"
        isLoading={isLoadingAI}
      />
    </div>
  );
}