import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/database-simple';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; causeId: string } }
) {
  try {
    const failureModeId = params.id;
    const causeId = params.causeId;
    const body = await request.json();
    const { description, occurrence } = body;

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    const db = readDatabase();

    // Verify failure mode exists
    const failureMode = db.failureModes.find(fm => fm.id === failureModeId);
    if (!failureMode) {
      return NextResponse.json(
        { success: false, error: 'Failure mode not found' },
        { status: 404 }
      );
    }

    // Find and update cause
    const causeIndex = db.causes.findIndex(c => c.id === causeId);
    if (causeIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Cause not found' },
        { status: 404 }
      );
    }

    // Update cause
    db.causes[causeIndex] = {
      ...db.causes[causeIndex],
      description,
      occurrence: occurrence ? parseInt(occurrence) : db.causes[causeIndex].occurrence,
      updated_at: new Date().toISOString(),
    };

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: db.causes[causeIndex],
      message: 'Cause updated successfully'
    });

  } catch (error) {
    console.error('Error updating cause:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cause' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; causeId: string } }
) {
  try {
    const failureModeId = params.id;
    const causeId = params.causeId;

    const db = readDatabase();

    // Verify failure mode exists
    const failureMode = db.failureModes.find(fm => fm.id === failureModeId);
    if (!failureMode) {
      return NextResponse.json(
        { success: false, error: 'Failure mode not found' },
        { status: 404 }
      );
    }

    // Find cause
    const causeIndex = db.causes.findIndex(c => c.id === causeId);
    if (causeIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Cause not found' },
        { status: 404 }
      );
    }

    // Delete cause
    db.causes.splice(causeIndex, 1);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Cause deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting cause:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete cause' },
      { status: 500 }
    );
  }
}
