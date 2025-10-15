import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai';
import { APIResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const status = AIService.getStatus();

    return NextResponse.json(
      {
        success: true,
        data: status,
      } as APIResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('AI status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get AI status',
      } as APIResponse,
      { status: 500 }
    );
  }
}