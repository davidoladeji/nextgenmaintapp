import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import { getActiveTools, initializeToolsSystem } from '@/lib/tools';
import { APIResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse,
        { status: 401 }
      );
    }

    // Initialize tools system (seeds tools and migrates projects if needed)
    // Safe to call on every request - it's idempotent
    initializeToolsSystem();

    // Get all active tools
    const tools = getActiveTools();

    return NextResponse.json(
      { success: true, data: tools } as APIResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tools' } as APIResponse,
      { status: 500 }
    );
  }
}
