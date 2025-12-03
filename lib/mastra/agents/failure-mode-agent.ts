import { Agent } from '@mastra/core';
import { getClaudeClient } from '@/mastra/config';

interface FailureModeContext {
  asset?: {
    name: string;
    type: string;
    context: string;
    criticality: string;
  };
  processStep?: string;
  componentName?: string;
  componentFunction?: string;
}

export async function suggestFailureMode(context: FailureModeContext): Promise<string> {
  const claude = getClaudeClient();

  const prompt = `You are an expert reliability engineer specializing in FMEA (Failure Mode and Effects Analysis).

${context.asset ? `Asset Details:
- Name: ${context.asset.name}
- Type: ${context.asset.type}
- Context: ${context.asset.context}
- Criticality: ${context.asset.criticality}` : ''}

${context.componentName ? `Component: ${context.componentName}` : ''}
${context.componentFunction ? `Component Function: ${context.componentFunction}` : ''}
${context.processStep ? `Process Step: ${context.processStep}` : ''}

Based on this context, suggest ONE specific, realistic failure mode that could occur.

Requirements:
1. Be specific and technically accurate
2. Use proper engineering terminology
3. Keep it concise (5-10 words)
4. Focus on actual failure mechanisms, not consequences

Respond with ONLY the failure mode description, no explanations or additional text.`;

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
    console.error('Failure mode agent error:', error);
    throw new Error('AI agent temporarily unavailable');
  }
}

export async function suggestMultipleFailureModes(
  context: FailureModeContext,
  count: number = 3
): Promise<Array<{text: string; confidence: number; reasoning: string}>> {
  const claude = getClaudeClient();

  const prompt = `You are an expert reliability engineer specializing in FMEA (Failure Mode and Effects Analysis).

${context.asset ? `Asset Details:
- Name: ${context.asset.name}
- Type: ${context.asset.type}
- Context: ${context.asset.context}
- Criticality: ${context.asset.criticality}` : ''}

${context.componentName ? `Component: ${context.componentName}` : ''}
${context.componentFunction ? `Component Function: ${context.componentFunction}` : ''}

Suggest ${count} potential failure modes for this asset/component.

Requirements:
1. Specific to this asset type and context
2. Realistic and relevant
3. Technically accurate
4. Different from each other

Format your response as JSON with this structure:
{
  "suggestions": [
    {
      "text": "Specific failure mode description",
      "confidence": 0.85,
      "reasoning": "Why this failure mode is relevant"
    }
  ]
}`;

  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
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
    console.error('Multiple failure modes agent error:', error);
    // Return fallback suggestions
    return [
      {
        text: 'Mechanical wear or fatigue',
        confidence: 0.7,
        reasoning: 'Common failure mode for mechanical assets'
      }
    ];
  }
}
