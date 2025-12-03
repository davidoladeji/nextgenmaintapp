import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { AIService } from '@/lib/ai';
import { APIResponse, AIPromptContext } from '@/types';
import { queries } from '@/lib/database';

export async function POST(request: NextRequest) {
  return withAuth(async (req, user) => {
    try {
      const body = await req.json();
      const { type, context } = body;

      if (!type || !context) {
        return NextResponse.json(
          {
            success: false,
            error: 'Type and context are required',
          } as APIResponse,
          { status: 400 }
        );
      }

      // Parse asset.standards if it's a JSON string
      if (context.asset && context.asset.standards) {
        if (typeof context.asset.standards === 'string') {
          try {
            context.asset.standards = JSON.parse(context.asset.standards);
          } catch (e) {
            // If parsing fails, leave as string - AI service will handle it
            console.warn('Failed to parse asset.standards:', e);
          }
        }
      }

      let suggestion;

      switch (type) {
        case 'failure-modes':
          suggestion = await AIService.suggestFailureModes(context);
          break;
        case 'causes':
          suggestion = await AIService.suggestCauses(context);
          break;
        case 'effects':
          suggestion = await AIService.suggestEffects(context);
          break;
        case 'controls':
          suggestion = await AIService.suggestControls(context);
          break;
        case 'severity':
          suggestion = await AIService.suggestRiskScoring(context, 'severity');
          break;
        case 'occurrence':
          suggestion = await AIService.suggestRiskScoring(context, 'occurrence');
          break;
        case 'detection':
          suggestion = await AIService.suggestRiskScoring(context, 'detection');
          break;
        default:
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid suggestion type',
            } as APIResponse,
            { status: 400 }
          );
      }

      return NextResponse.json(
        {
          success: true,
          data: suggestion,
        } as APIResponse,
        { status: 200 }
      );
    } catch (error) {
      console.error('AI suggestion error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'AI suggestion failed',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}