import { NextRequest, NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/database-simple';
import { getUserFromToken } from '@/lib/auth';
import { UserPreferences } from '@/types';

// GET /api/user/preferences - Get current user preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = readDatabase();

    // Find user in database
    const dbUser = db.users.find((u: any) => u.id === user.id);
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return preferences with defaults if not set
    const preferences = dbUser.preferences || getDefaultPreferences();

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/user/preferences - Update current user preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const db = readDatabase();

    // Find user in database
    const userIndex = db.users.findIndex((u: any) => u.id === user.id);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Merge preferences (deep merge to preserve existing values)
    const currentPreferences = db.users[userIndex].preferences || getDefaultPreferences();
    const updatedPreferences = { ...currentPreferences, ...body };

    // Update user
    db.users[userIndex] = {
      ...db.users[userIndex],
      preferences: updatedPreferences,
    };

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      message: 'User preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
}

// Helper: Get default preferences
function getDefaultPreferences(): UserPreferences {
  return {
    onboarding_completed: false,
    theme: 'system',
  };
}
