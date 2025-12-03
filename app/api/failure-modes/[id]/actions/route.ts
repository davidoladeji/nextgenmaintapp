import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { readDatabase, writeDatabase } from '@/lib/database-simple';
import { FailureMode } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const failureModeId = params.id;
    const body = await request.json();
    const { description, owner, dueDate, status } = body;

    if (!description || !owner || !status) {
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

    // Create new action
    const newAction = {
      id: uuidv4(),
      failure_mode_id: failureModeId,
      description,
      owner,
      dueDate: dueDate || null,
      status,
      actionTaken: null,
      postActionSeverity: null,
      postActionOccurrence: null,
      postActionDetection: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to database
    db.actions.push(newAction);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: newAction,
      message: 'Action added successfully'
    });

  } catch (error) {
    console.error('Error adding action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add action' },
      { status: 500 }
    );
  }
}