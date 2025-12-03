# Selection Toolbar Integration Guide

## ✅ Completed Steps

1. **Created** [SelectionToolbar.tsx](components/fmea/v2/SelectionToolbar.tsx) - Monday.com-style floating bottom toolbar
2. **Created** [EditOwnerModal.tsx](components/fmea/v2/EditOwnerModal.tsx) - Modal for assigning owners
3. **Added** imports to SmartTableIntegrated.tsx (line 10-12)
4. **Added** selection state variables (line 33-39)
5. **Added** click outside and ESC handlers (line 119-145)

## 🔄 Remaining Integration Steps

### Step 1: Add Action Handlers

After the `handleUpdateEffect` function (around line 270), add these handler functions:

```typescript
// Selection Action Handlers
const handleEdit = () => {
  if (!selectedItem) return;

  switch (selectedItem.type) {
    case 'component':
      // TODO: Implement edit component modal with pre-filled data
      toast.info('Edit component - Coming soon');
      break;
    case 'failureMode':
      // TODO: Implement edit failure mode modal with pre-filled data
      toast.info('Edit failure mode - Coming soon');
      break;
    case 'effect':
      // TODO: Implement edit effect modal with pre-filled data
      toast.info('Edit effect - Coming soon');
      break;
  }
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

const handleDuplicate = async () => {
  if (!selectedItem) return;

  if (!confirm(`Duplicate this ${selectedItem.type}? This will create a copy with all nested data.`)) {
    return;
  }

  try {
    // TODO: Implement duplicate API endpoints
    toast.info(`Duplicate ${selectedItem.type} - API endpoint needs to be created`);
    setSelectedItem(null);
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
        endpoint = `/api/projects/${project.id}/components/${selectedItem.id}`;
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
      window.location.reload(); // Simple reload for now
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  } catch (error) {
    console.error('Error deleting:', error);
    toast.error('Failed to delete');
  }
};
```

### Step 2: Add Selection Handlers for Row Components

Find the `ComponentRowIntegrated` component (around line 460) and modify it to accept and handle selection:

```typescript
// Add to ComponentRowIntegratedProps interface:
onSelect?: (component: Component) => void;
isSelected?: boolean;

// In the component's onClick handler, add:
onClick={(e) => {
  if (!e.defaultPrevented) {
    props.onToggleExpand();
    props.onSelect?.(props.component);
  }
}}

// Add selection styling to className:
className={`
  ... existing classes ...
  smart-table-row
  ${props.isSelected ? 'ring-2 ring-accent bg-accent/10 dark:bg-accent/20' : ''}
`}
```

Do the same for `FailureModeRowIntegrated` (around line 560) and `EffectRowIntegrated` (around line 660).

### Step 3: Pass Selection Handlers to Row Components

In the main render section (around line 380), update the ComponentRowIntegrated calls:

```typescript
<ComponentRowIntegrated
  key={component.id}
  component={component}
  isExpanded={expandedComponents.has(component.id)}
  isSelected={selectedItem?.type === 'component' && selectedItem.id === component.id}
  expandedFailureModes={expandedFailureModes}
  onToggleExpand={() => {
    // existing code
  }}
  onToggleFailureModeExpand={(fmId) => {
    // existing code
  }}
  onAddFailureMode={() => {
    // existing code
  }}
  onAddEffect={(fmId) => {
    // existing code
  }}
  onUpdateEffect={handleUpdateEffect}
  getComponentViewModel={getComponentViewModel}
  getFailureModeViewModel={getFailureModeViewModel}
  onSelect={(comp) => {
    setSelectedItem({
      type: 'component',
      id: comp.id,
      data: comp,
    });
  }}
/>
```

### Step 4: Integrate SelectionToolbar and EditOwnerModal in Render

At the end of the return statement (around line 420, before the closing `</div>`), add:

```typescript
{/* Selection Toolbar */}
<SelectionToolbar
  selectedItem={selectedItem}
  onClear={() => setSelectedItem(null)}
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
```

## Testing Checklist

After integration:

1. ✅ Click a Component row → Toolbar appears at bottom
2. ✅ Click "Edit Owner" → Modal opens
3. ✅ Enter owner name → Saves successfully
4. ✅ Click outside row → Toolbar disappears
5. ✅ Press ESC → Toolbar disappears
6. ✅ Click "Delete" → Confirmation appears, deletes on confirm
7. ✅ Toolbar uses theme accent color (not Monday.com blue)
8. ✅ Light mode styling works
9. ✅ Dark mode styling works

## API Endpoints to Implement

You may need to create these duplicate endpoints:

1. `POST /api/components/{id}/duplicate` - Duplicate component with all failure modes
2. `POST /api/failure-modes/{id}/duplicate` - Duplicate failure mode with all effects
3. `POST /api/failure-modes/{fmId}/effects/{effectId}/duplicate` - Duplicate effect

## Notes

- The `handleEdit` functions currently show "Coming soon" toasts. You'll need to implement full edit modals with pre-filled data.
- The duplicate functionality shows a toast as the API endpoints may need to be created.
- Owner field may need to be added to the Component model if you want to assign owners at the component level.
- All selection toolbar actions use your app's theme colors (accent color) automatically.

## File Locations

- **SelectionToolbar**: `components/fmea/v2/SelectionToolbar.tsx` ✅ Created
- **EditOwnerModal**: `components/fmea/v2/EditOwnerModal.tsx` ✅ Created
- **Main Integration**: `components/fmea/v2/SmartTableIntegrated.tsx` ⚠️ Partially Complete

## Summary

**Completed**:
- ✅ Core components created
- ✅ Imports added
- ✅ State management added
- ✅ Click outside/ESC handlers added

**Remaining**:
- ⚠️ Action handlers need to be added
- ⚠️ Selection props need to be passed to row components
- ⚠️ Toolbar and modal need to be rendered
- ⚠️ Row components need selection styling

The foundation is complete! The remaining steps are straightforward additions to the existing file structure.
