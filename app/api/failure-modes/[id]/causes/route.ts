import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { readDatabase, writeDatabase } from '@/lib/database-simple';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const failureModeId = params.id;
    const body = await request.json();
    const { description, occurrence } = body;

    if (!description || !occurrence) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    // Create new cause
    const newCause = {
      id: uuidv4(),
      failure_mode_id: failureModeId,
      description,
      occurrence: parseInt(occurrence),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to database
    db.causes.push(newCause);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: newCause,
      message: 'Cause added successfully'
    });

  } catch (error) {
    console.error('Error adding cause:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add cause' },
      { status: 500 }
    );
  }
}