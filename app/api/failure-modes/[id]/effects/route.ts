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
    const {
      description,
      severity,
      potential_cause,
      current_design,
      justification_pre,
      justification_post,
      responsible,
      action_taken,
      completion_date,
      severity_post,
      occurrence_post,
      detection_post
    } = body;

    if (!description || !severity) {
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

    // Create new effect with all fields
    const newEffect = {
      id: uuidv4(),
      failure_mode_id: failureModeId,
      description,
      severity: parseInt(severity),
      potential_cause: potential_cause || null,
      current_design: current_design || null,
      justification_pre: justification_pre || null,
      justification_post: justification_post || null,
      responsible: responsible || null,
      action_taken: action_taken || null,
      completion_date: completion_date || null,
      severity_post: severity_post ? parseInt(severity_post) : null,
      occurrence_post: occurrence_post ? parseInt(occurrence_post) : null,
      detection_post: detection_post ? parseInt(detection_post) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to database
    db.effects.push(newEffect);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: newEffect,
      message: 'Effect added successfully'
    });

  } catch (error) {
    console.error('Error adding effect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add effect' },
      { status: 500 }
    );
  }
}