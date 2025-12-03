import { FailureMode, Cause, Effect, Control } from "@/types";
import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/database-simple';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; effectId: string } }
) {
  try {
    const failureModeId = params.id;
    const effectId = params.effectId;
    const body = await request.json();
    const {
      description,
      severity,
      potential_cause,
      current_design,
      justification_pre,
      recommended_actions,
      justification_post,
      responsible,
      action_taken,
      action_status,
      completion_date,
      severity_post,
      occurrence_post,
      detection_post
    } = body;

    // Only validate description if it's explicitly provided and empty
    if (description !== undefined && !description) {
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

    // Find and update effect
    const effectIndex = db.effects.findIndex((e: Effect) => e.id === effectId);
    if (effectIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Effect not found' },
        { status: 404 }
      );
    }

    // Update effect with all fields
    db.effects[effectIndex] = {
      ...db.effects[effectIndex],
      description,
      severity: severity !== undefined ? parseInt(severity) : db.effects[effectIndex].severity,
      potential_cause: potential_cause !== undefined ? potential_cause : db.effects[effectIndex].potential_cause,
      current_design: current_design !== undefined ? current_design : db.effects[effectIndex].current_design,
      justification_pre: justification_pre !== undefined ? justification_pre : db.effects[effectIndex].justification_pre,
      recommended_actions: recommended_actions !== undefined ? recommended_actions : db.effects[effectIndex].recommended_actions,
      justification_post: justification_post !== undefined ? justification_post : db.effects[effectIndex].justification_post,
      responsible: responsible !== undefined ? responsible : db.effects[effectIndex].responsible,
      action_taken: action_taken !== undefined ? action_taken : db.effects[effectIndex].action_taken,
      action_status: action_status !== undefined ? action_status : db.effects[effectIndex].action_status,
      completion_date: completion_date !== undefined ? completion_date : db.effects[effectIndex].completion_date,
      severity_post: severity_post !== undefined ? parseInt(severity_post) : db.effects[effectIndex].severity_post,
      occurrence_post: occurrence_post !== undefined ? parseInt(occurrence_post) : db.effects[effectIndex].occurrence_post,
      detection_post: detection_post !== undefined ? parseInt(detection_post) : db.effects[effectIndex].detection_post,
      updated_at: new Date().toISOString(),
    };

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: db.effects[effectIndex],
      message: 'Effect updated successfully'
    });

  } catch (error) {
    console.error('Error updating effect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update effect' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; effectId: string } }
) {
  try {
    const failureModeId = params.id;
    const effectId = params.effectId;

    const db = readDatabase();

    // Verify failure mode exists
    const failureMode = db.failureModes.find((fm: FailureMode) => fm.id === failureModeId);
    if (!failureMode) {
      return NextResponse.json(
        { success: false, error: 'Failure mode not found' },
        { status: 404 }
      );
    }

    // Find effect
    const effectIndex = db.effects.findIndex((e: Effect) => e.id === effectId);
    if (effectIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Effect not found' },
        { status: 404 }
      );
    }

    // Delete effect
    db.effects.splice(effectIndex, 1);
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: 'Effect deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting effect:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete effect' },
      { status: 500 }
    );
  }
}
