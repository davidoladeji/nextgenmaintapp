import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { APIResponse } from '@/types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  return withAuth(async (req, user) => {
    try {
      const body = await req.json();
      const { message, context } = body;

      if (!message?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Message is required',
          } as APIResponse,
          { status: 400 }
        );
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI service is not configured. Please add ANTHROPIC_API_KEY to environment variables.',
          } as APIResponse,
          { status: 503 }
        );
      }

      // Build context-aware prompt
      let systemPrompt = `You are NextGenMint AI, an expert reliability engineering assistant specializing in FMEA (Failure Mode and Effects Analysis). Always identify yourself as NextGenMint AI when asked about your identity. You help engineers with:

- Identifying and analyzing failure modes
- Assessing risks and calculating RPN (Risk Priority Numbers)
- Suggesting preventive and detective controls
- Root cause analysis
- FMEA best practices and industry standards
- Risk mitigation strategies

Be concise, practical, and technically accurate. Focus on actionable insights.`;

      // Add project context if available
      if (context?.currentProject) {
        systemPrompt += `\n\nCurrent project context:
- Project: ${context.currentProject.name}
- Asset: ${context.currentProject.asset?.name} (${context.currentProject.asset?.type})
- Criticality: ${context.currentProject.asset?.criticality}
- Context: ${context.currentProject.asset?.context}`;
      }

      const response = await anthropic.messages.create({
        model: 'claude-4-sonnet-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response format from Claude');
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            message: content.text,
            usage: response.usage,
          },
        } as APIResponse,
        { status: 200 }
      );
    } catch (error) {
      console.error('AI chat error:', error);
      
      // Handle specific API errors
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          return NextResponse.json(
            {
              success: false,
              error: 'AI service authentication failed. Please check API key configuration.',
            } as APIResponse,
            { status: 401 }
          );
        }
        if (error.message.includes('rate_limit')) {
          return NextResponse.json(
            {
              success: false,
              error: 'AI service rate limit exceeded. Please try again later.',
            } as APIResponse,
            { status: 429 }
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'AI service temporarily unavailable. Please try again later.',
        } as APIResponse,
        { status: 500 }
      );
    }
  })(request);
}