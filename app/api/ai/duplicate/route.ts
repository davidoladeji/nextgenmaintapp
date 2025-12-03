import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { AIService } from '@/lib/ai';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  return withAuth(async (req, user) => {
    try {
      const body = await req.json();
      const { type, originalName, context } = body;

      if (!type || !originalName) {
        return NextResponse.json(
          {
            success: false,
            error: 'Type and originalName are required',
          } as APIResponse,
          { status: 400 }
        );
      }

      if (!['component', 'failureMode', 'effect', 'componentFunction'].includes(type)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid type. Must be component, failureMode, effect, or componentFunction',
          } as APIResponse,
          { status: 400 }
        );
      }

      // Generate AI suggestion with 10-second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), 10000)
      );

      const suggestionPromise = AIService.suggestDuplicateName(
        type as 'component' | 'failureMode' | 'effect' | 'componentFunction',
        originalName,
        context || {}
      );

      let suggestion;
      try {
        suggestion = await Promise.race([suggestionPromise, timeoutPromise]);
      } catch (error) {
        // Timeout or AI error - use fallback
        const fallbackName =
          type === 'component'
            ? `${originalName} - Variant`
            : type === 'failureMode'
            ? `${originalName} - Related Mode`
            : `${originalName} - Similar Effect`;

        suggestion = {
          name: fallbackName,
          reasoning: 'AI timeout - using fallback pattern',
        };
      }

      return NextResponse.json(
        {
          success: true,
          data: suggestion,
        } as APIResponse,
        { status: 200 }
      );
    } catch (error) {
      console.error('AI duplicate error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'AI duplication failed',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}
