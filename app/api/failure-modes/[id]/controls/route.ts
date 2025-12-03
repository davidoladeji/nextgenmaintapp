import { FailureMode, Cause, Effect, Control } from "@/types";
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
    const { type, description, detection, effectiveness } = body;

    if (!type || !description || !detection || !effectiveness) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    // Create new control
    const newControl = {
      id: uuidv4(),
      failure_mode_id: failureModeId,
      type,
      description,
      detection: parseInt(detection),
      effectiveness: parseInt(effectiveness),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to database
    db.controls.push(newControl);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: newControl,
      message: 'Control added successfully'
    });

  } catch (error) {
    console.error('Error adding control:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add control' },
      { status: 500 }
    );
  }
}