import { getClaudeClient } from '@/mastra/config';

interface EffectContext {
  asset?: {
    name: string;
    type: string;
    context: string;
    criticality: string;
  };
  failureMode?: {
    failureMode: string;
    processStep?: string;
  };
}

export async function suggestEffect(context: EffectContext): Promise<string> {
  const claude = getClaudeClient();

  const prompt = `You are an expert reliability engineer specializing in FMEA (Failure Mode and Effects Analysis).

${context.asset ? `Asset: ${context.asset.name} (${context.asset.type})
Context: ${context.asset.context}
Criticality: ${context.asset.criticality}` : ''}

${context.failureMode ? `Failure Mode: ${context.failureMode.failureMode}` : ''}

Based on this failure mode, suggest ONE specific effect/consequence that could occur.

Consider:
1. Safety implications
2. Environmental impact
3. Production/operational impact
4. Cost implications

Respond with ONLY the effect description (5-15 words), no explanations.`;

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
    console.error('Effect agent error:', error);
    throw new Error('AI agent temporarily unavailable');
  }
}

export async function suggestMultipleEffects(
  context: EffectContext,
  count: number = 3
): Promise<Array<{text: string; severity: number; confidence: number; reasoning: string}>> {
  const claude = getClaudeClient();

  const prompt = `You are an expert reliability engineer specializing in FMEA.

${context.asset ? `Asset: ${context.asset.name} (${context.asset.type})
Criticality: ${context.asset.criticality}` : ''}

${context.failureMode ? `Failure Mode: ${context.failureMode.failureMode}` : ''}

Suggest ${count} potential effects/consequences of this failure mode.

Consider:
1. Safety implications
2. Environmental impact
3. Production/operational impact
4. Cost implications
5. Regulatory compliance

Format as JSON:
{
  "suggestions": [
    {
      "text": "Effect description",
      "severity": 7,
      "confidence": 0.85,
      "reasoning": "Why this effect would occur"
    }
  ]
}

Severity scale (1-10):
- 1-3: Minor, no safety/environmental impact
- 4-6: Moderate impact
- 7-8: Serious impact, safety concerns
- 9-10: Critical/catastrophic`;

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
    console.error('Multiple effects agent error:', error);
    return [
      {
        text: 'Unplanned downtime',
        severity: 6,
        confidence: 0.8,
        reasoning: 'Direct operational impact'
      }
    ];
  }
}

// Helper for suggesting individual effect fields
export async function suggestEffectField(
  fieldType: 'potentialCause' | 'currentDesign' | 'justificationPre' | 'justificationPost' | 'recommendedActions' | 'responsible' | 'actionTaken',
  context: EffectContext & { effectDescription?: string }
): Promise<string> {
  const claude = getClaudeClient();

  const fieldPrompts = {
    potentialCause: 'Suggest a specific potential cause that could lead to this effect.',
    currentDesign: 'Describe the current design control or mitigation in place.',
    justificationPre: 'Provide justification for the pre-mitigation severity, occurrence, and detection ratings.',
    justificationPost: 'Provide justification for the post-mitigation ratings after controls are applied.',
    recommendedActions: 'Suggest a specific recommended action to prevent or mitigate this effect.',
    responsible: 'Suggest who should be responsible for implementing actions (e.g., "Maintenance Team", "Design Engineer").',
    actionTaken: 'Describe what action was taken to address this effect.'
  };

  const prompt = `You are an expert reliability engineer.

${context.asset ? `Asset: ${context.asset.name}` : ''}
${context.failureMode ? `Failure Mode: ${context.failureMode.failureMode}` : ''}
${context.effectDescription ? `Effect: ${context.effectDescription}` : ''}

${fieldPrompts[fieldType]}

Respond with ONLY the suggested text (5-20 words), no explanations.`;

  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
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
    console.error(`Effect field (${fieldType}) agent error:`, error);
    throw new Error('AI agent temporarily unavailable');
  }
}
