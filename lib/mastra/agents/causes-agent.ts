import { getClaudeClient } from '@/mastra/config';

interface CauseContext {
  asset?: {
    name: string;
    type: string;
    context: string;
  };
  failureMode?: {
    failureMode: string;
    processStep?: string;
  };
}

export async function suggestCause(context: CauseContext): Promise<string> {
  const claude = getClaudeClient();

  const prompt = `You are an expert reliability engineer specializing in root cause analysis.

${context.asset ? `Asset: ${context.asset.name} (${context.asset.type})` : ''}
${context.failureMode ? `Failure Mode: ${context.failureMode.failureMode}` : ''}
${context.failureMode?.processStep ? `Process Step: ${context.failureMode.processStep}` : ''}

Suggest ONE specific root cause for this failure mode.

Requirements:
1. Root cause, not a symptom
2. Specific and actionable
3. Technically accurate
4. Realistic based on common failure patterns

Respond with ONLY the cause description (5-12 words), no explanations.`;

  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text.trim();
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Cause agent error:', error);
    throw new Error('AI agent temporarily unavailable');
  }
}

export async function suggestMultipleCauses(
  context: CauseContext,
  count: number = 3
): Promise<Array<{text: string; occurrence: number; confidence: number; reasoning: string}>> {
  const claude = getClaudeClient();

  const prompt = `You are an expert reliability engineer specializing in root cause analysis.

${context.asset ? `Asset: ${context.asset.name} (${context.asset.type})
Context: ${context.asset.context}` : ''}

${context.failureMode ? `Failure Mode: ${context.failureMode.failureMode}` : ''}
${context.failureMode?.processStep ? `Process Step: ${context.failureMode.processStep}` : ''}

Suggest ${count} potential root causes for this failure mode.

Requirements:
1. Root causes, not symptoms
2. Specific and actionable
3. Technically accurate
4. Realistic based on common failure patterns

Format as JSON:
{
  "suggestions": [
    {
      "text": "Specific cause description",
      "occurrence": 5,
      "confidence": 0.85,
      "reasoning": "Why this is a likely root cause"
    }
  ]
}

Occurrence rating (1-10):
- 1-3: Remote probability
- 4-6: Low to moderate probability
- 7-8: High probability
- 9-10: Very high probability/certain

Focus on causes that can be prevented or mitigated.`;

  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      return parsed.suggestions || [];
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    console.error('Multiple causes agent error:', error);
    return [
      {
        text: 'Inadequate maintenance',
        occurrence: 6,
        confidence: 0.8,
        reasoning: 'Common root cause across asset types'
      }
    ];
  }
}
