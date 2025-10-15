import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { APIResponse } from '@/types';

export async function GET(request: NextRequest) {
  return withAuth(async (req, user) => {
    return NextResponse.json(
      {
        success: true,
        data: { user },
        message: 'Token is valid',
      } as APIResponse,
      { status: 200 }
    );
  })(request);
}