import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { AIService } from '@/lib/ai';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  return withAuth(async (req, user) => {
    try {
      const body = await req.json();
      const { context } = body;

      if (!context) {
        return NextResponse.json(
          {
            success: false,
            error: 'Context is required',
          } as APIResponse,
          { status: 400 }
        );
      }

      const explanation = await AIService.explainRisk(context);

      return NextResponse.json(
        {
          success: true,
          data: { explanation },
        } as APIResponse,
        { status: 200 }
      );
    } catch (error) {
      console.error('AI explanation error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'AI explanation failed',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}