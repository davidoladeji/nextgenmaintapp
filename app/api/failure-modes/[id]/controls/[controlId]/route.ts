import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/database-simple';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; controlId: string } }
) {
  try {
    const failureModeId = params.id;
    const controlId = params.controlId;
    const body = await request.json();
    const { type, description, detection, effectiveness } = body;

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

    // Find and update control
    const controlIndex = db.controls.findIndex(c => c.id === controlId);
    if (controlIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Control not found' },
        { status: 404 }
      );
    }

    // Update control
    db.controls[controlIndex] = {
      ...db.controls[controlIndex],
      type: type || db.controls[controlIndex].type,
      description,
      detection: detection ? parseInt(detection) : db.controls[controlIndex].detection,
      effectiveness: effectiveness ? parseInt(effectiveness) : db.controls[controlIndex].effectiveness,
      updated_at: new Date().toISOString(),
    };

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: db.controls[controlIndex],
      message: 'Control updated successfully'
    });

  } catch (error) {
    console.error('Error updating control:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update control' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; controlId: string } }
) {
  try {
    const failureModeId = params.id;
    const controlId = params.controlId;

    const db = readDatabase();

    // Verify failure mode exists
    const failureMode = db.failureModes.find(fm => fm.id === failureModeId);
    if (!failureMode) {
      return NextResponse.json(
        { success: false, error: 'Failure mode not found' },
        { status: 404 }
      );
    }

    // Find control
    const controlIndex = db.controls.findIndex(c => c.id === controlId);
    if (controlIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Control not found' },
        { status: 404 }
      );
    }

    // Delete control
    db.controls.splice(controlIndex, 1);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Control deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting control:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete control' },
      { status: 500 }
    );
  }
}
