import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/database-simple';
import { FailureMode, Action } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string } }
) {
  try {
    const failureModeId = params.id;
    const actionId = params.actionId;
    const body = await request.json();
    const { description, owner, dueDate, status } = body;

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    const db = readDatabase();

    // Verify failure mode exists
    const failureMode = db.failureModes.find((fm: FailureMode) => fm.id === failureModeId);
    if (!failureMode) {
      return NextResponse.json(
        { success: false, error: 'Failure mode not found' },
        { status: 404 }
      );
    }

    // Find and update action
    const actionIndex = db.actions.findIndex((a: Action) => a.id === actionId);
    if (actionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    // Update action
    db.actions[actionIndex] = {
      ...db.actions[actionIndex],
      description,
      owner: owner !== undefined ? owner : db.actions[actionIndex].owner,
      dueDate: dueDate !== undefined ? dueDate : db.actions[actionIndex].dueDate,
      status: status || db.actions[actionIndex].status,
      updated_at: new Date().toISOString(),
    };

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: db.actions[actionIndex],
      message: 'Action updated successfully'
    });

  } catch (error) {
    console.error('Error updating action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update action' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; actionId: string } }
) {
  try {
    const failureModeId = params.id;
    const actionId = params.actionId;

    const db = readDatabase();

    // Verify failure mode exists
    const failureMode = db.failureModes.find((fm: FailureMode) => fm.id === failureModeId);
    if (!failureMode) {
      return NextResponse.json(
        { success: false, error: 'Failure mode not found' },
        { status: 404 }
      );
    }

    // Find action
    const actionIndex = db.actions.findIndex((a: Action) => a.id === actionId);
    if (actionIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    // Delete action
    db.actions.splice(actionIndex, 1);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Action deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete action' },
      { status: 500 }
    );
  }
}
