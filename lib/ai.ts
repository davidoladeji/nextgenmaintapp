import Anthropic from '@anthropic-ai/sdk';
import { AIPromptContext, AISuggestion, Asset, FailureMode } from '@/types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export class AIService {
  private static isConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  private static async callClaude(prompt: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your .env.local file.');
    }

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return content.text;
      }
      
      throw new Error('Unexpected response format from Claude');
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error('AI service temporarily unavailable. Please try again later.');
    }
  }

  static async suggestFailureModes(context: AIPromptContext): Promise<AISuggestion> {
    const { asset, existingData } = context;

    const existingModes = existingData?.failureModes?.map(fm => fm.failureMode).join(', ') || 'None';

    // Safely handle standards - ensure it's an array
    const standards = Array.isArray(asset.standards)
      ? asset.standards.join(', ')
      : (typeof asset.standards === 'string' ? asset.standards : 'None specified');

    const prompt = `
You are an expert reliability engineer. Based on the following asset information, suggest 3-5 potential failure modes.

Asset Details:
- Name: ${asset.name}
- Type: ${asset.type}
- Context: ${asset.context}
- Criticality: ${asset.criticality}
- Standards: ${standards}
- History: ${asset.history || 'No history provided'}
- Configuration: ${asset.configuration || 'No configuration details'}

Existing Failure Modes: ${existingModes}

Please provide failure modes that are:
1. Specific to this asset type and context
2. Different from existing ones
3. Realistic and relevant
4. Technically accurate

Format your response as JSON with this structure:
{
  "suggestions": [
    {
      "text": "Specific failure mode description",
      "confidence": 0.85,
      "reasoning": "Why this failure mode is relevant for this asset"
    }
  ]
}

Focus on practical, actionable failure modes that a reliability engineer would encounter.
    `;

    try {
      const response = await this.callClaude(prompt);
      const parsed = JSON.parse(response);
      
      return {
        type: 'failure-mode',
        suggestions: parsed.suggestions || [],
        context: `Failure modes for ${asset.name} (${asset.type})`,
      };
    } catch (error) {
      return this.getLocalFallback('failure-mode', context);
    }
  }

  static async suggestCauses(context: AIPromptContext): Promise<AISuggestion> {
    const { asset, failureMode } = context;
    
    if (!failureMode?.failureMode) {
      throw new Error('Failure mode is required for cause suggestions');
    }

    const prompt = `
You are an expert reliability engineer. For the following failure mode, suggest 3-5 potential root causes.

Asset: ${asset.name} (${asset.type})
Context: ${asset.context}
Failure Mode: ${failureMode.failureMode}
Process Step: ${failureMode.processStep || 'Not specified'}

Please provide causes that are:
1. Root causes, not symptoms
2. Specific and actionable
3. Technically accurate for this asset type
4. Realistic based on common failure patterns

Format your response as JSON:
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

For each cause, provide an occurrence rating (1-10):
- 1-3: Remote probability
- 4-6: Low to moderate probability
- 7-8: High probability
- 9-10: Very high probability / certain to occur

Focus on causes that can be prevented or mitigated through proper maintenance or controls.
    `;

    try {
      const response = await this.callClaude(prompt);
      const parsed = JSON.parse(response);
      
      return {
        type: 'cause',
        suggestions: parsed.suggestions || [],
        context: `Causes for "${failureMode.failureMode}"`,
      };
    } catch (error) {
      return this.getLocalFallback('cause', context);
    }
  }

  static async suggestEffects(context: AIPromptContext): Promise<AISuggestion> {
    const { asset, failureMode } = context;
    
    if (!failureMode?.failureMode) {
      throw new Error('Failure mode is required for effect suggestions');
    }

    const prompt = `
You are an expert reliability engineer. For the following failure mode, suggest 3-5 potential effects/consequences.

Asset: ${asset.name} (${asset.type})
Context: ${asset.context}
Criticality: ${asset.criticality}
Failure Mode: ${failureMode.failureMode}

Please provide effects that consider:
1. Safety implications
2. Environmental impact
3. Production/operational impact
4. Cost implications
5. Regulatory compliance

Format your response as JSON:
{
  "suggestions": [
    {
      "text": "Specific effect description",
      "severity": 7,
      "confidence": 0.85,
      "reasoning": "Why this effect would occur and its significance"
    }
  ]
}

For each effect, provide a severity rating (1-10):
- 1-3: Minor inconvenience, no safety/environmental impact
- 4-6: Moderate impact, reduced performance or efficiency
- 7-8: Serious impact, significant safety/environmental concerns
- 9-10: Critical/catastrophic, severe safety hazard or major environmental damage

Consider the asset criticality (${asset.criticality}) when determining severity of effects.
    `;

    try {
      const response = await this.callClaude(prompt);
      const parsed = JSON.parse(response);
      
      return {
        type: 'effect',
        suggestions: parsed.suggestions || [],
        context: `Effects of "${failureMode.failureMode}"`,
      };
    } catch (error) {
      return this.getLocalFallback('effect', context);
    }
  }

  static async suggestControls(context: AIPromptContext): Promise<AISuggestion> {
    const { asset, failureMode, cause } = context;
    
    const prompt = `
You are an expert reliability engineer. Suggest preventive and detective controls for the following:

Asset: ${asset.name} (${asset.type})
Failure Mode: ${failureMode?.failureMode || 'Not specified'}
Cause: ${cause?.description || 'General controls'}

Please provide controls that are:
1. Practical and implementable
2. Cost-effective
3. Technically sound
4. Include both prevention and detection methods

Format your response as JSON:
{
  "suggestions": [
    {
      "text": "Control description",
      "type": "prevention",
      "detection": 5,
      "effectiveness": 7,
      "confidence": 0.85,
      "reasoning": "How this control addresses the cause/failure mode"
    }
  ]
}

For each control:
- type: "prevention" or "detection"
- detection rating (1-10): How well it detects the failure before it causes harm
  - 1-3: Almost certain to detect
  - 4-6: Moderate chance of detection
  - 7-8: Low chance of detection
  - 9-10: Almost impossible to detect
- effectiveness rating (1-10): How effective the control is at preventing/detecting the failure

Focus on standard industry practices and proven control methods.
    `;

    try {
      const response = await this.callClaude(prompt);
      const parsed = JSON.parse(response);
      
      return {
        type: 'control',
        suggestions: parsed.suggestions || [],
        context: `Controls for ${failureMode?.failureMode || 'failure mode'}`,
      };
    } catch (error) {
      return this.getLocalFallback('control', context);
    }
  }

  static async explainRisk(context: AIPromptContext): Promise<string> {
    const { asset, failureMode } = context;
    
    const prompt = `
You are an expert reliability engineer. Provide a clear explanation of the risk associated with this failure mode.

Asset: ${asset.name} (${asset.type})
Context: ${asset.context}
Failure Mode: ${failureMode?.failureMode || 'Not specified'}

Please explain:
1. Why this failure mode is significant
2. What factors contribute to its risk level
3. Key considerations for risk assessment
4. Recommended risk mitigation approach

Provide a concise, professional explanation that would help a reliability engineer understand the risk profile.
    `;

    try {
      const response = await this.callClaude(prompt);
      return response;
    } catch (error) {
      return `Risk analysis temporarily unavailable. This failure mode for ${asset.name} should be evaluated based on its potential impact on safety, operations, and business continuity. Consider the asset's criticality (${asset.criticality}) and implement appropriate risk mitigation measures.`;
    }
  }

  static async suggestRiskScoring(
    context: AIPromptContext,
    type: 'severity' | 'occurrence' | 'detection'
  ): Promise<{ score: number; reasoning: string }> {
    const { asset, failureMode, cause, effect } = context;
    
    const prompt = `
You are an expert reliability engineer. Suggest a ${type} rating (1-10 scale) for the following:

Asset: ${asset.name} (${asset.type})
Context: ${asset.context}
${failureMode?.failureMode ? `Failure Mode: ${failureMode.failureMode}` : ''}
${cause?.description ? `Cause: ${cause.description}` : ''}
${effect?.description ? `Effect: ${effect.description}` : ''}

${type === 'severity' ? 'Severity Scale (1=no effect, 10=hazardous without warning)' : ''}
${type === 'occurrence' ? 'Occurrence Scale (1=remote, 10=very high)' : ''}
${type === 'detection' ? 'Detection Scale (1=certain detection, 10=cannot detect)' : ''}

Provide your assessment as JSON:
{
  "score": 6,
  "reasoning": "Clear explanation of why this score is appropriate"
}

Base your assessment on industry standards and best practices.
    `;

    try {
      const response = await this.callClaude(prompt);
      const parsed = JSON.parse(response);
      
      return {
        score: Math.max(1, Math.min(10, parsed.score || 5)),
        reasoning: parsed.reasoning || `${type} assessment based on asset characteristics`,
      };
    } catch (error) {
      // Provide reasonable defaults based on asset criticality
      const defaultScores = {
        critical: { severity: 8, occurrence: 6, detection: 7 },
        high: { severity: 7, occurrence: 5, detection: 6 },
        medium: { severity: 5, occurrence: 4, detection: 5 },
        low: { severity: 3, occurrence: 3, detection: 4 },
      };
      
      const score = defaultScores[asset.criticality]?.[type] || 5;
      
      return {
        score,
        reasoning: `Default ${type} rating based on asset criticality (${asset.criticality}). AI analysis temporarily unavailable.`,
      };
    }
  }

  private static getLocalFallback(type: string, context: AIPromptContext): AISuggestion {
    const fallbacks = {
      'failure-mode': [
        { text: 'Mechanical wear or fatigue', confidence: 0.7, reasoning: 'Common failure mode for mechanical assets' },
        { text: 'Electrical component failure', confidence: 0.7, reasoning: 'Common in electrical systems' },
        { text: 'Software malfunction', confidence: 0.6, reasoning: 'Relevant for automated systems' },
      ],
      'cause': [
        { text: 'Inadequate maintenance', confidence: 0.8, reasoning: 'Common root cause across asset types' },
        { text: 'Normal wear and tear', confidence: 0.7, reasoning: 'Expected degradation over time' },
        { text: 'Operating beyond design limits', confidence: 0.7, reasoning: 'Common operational issue' },
      ],
      'effect': [
        { text: 'Unplanned downtime', confidence: 0.8, reasoning: 'Direct operational impact' },
        { text: 'Reduced performance', confidence: 0.7, reasoning: 'Degraded operational capability' },
        { text: 'Safety risk', confidence: 0.8, reasoning: 'Potential safety implications' },
      ],
      'control': [
        { text: 'Regular inspection (Detection)', confidence: 0.8, reasoning: 'Standard detection method' },
        { text: 'Preventive maintenance (Prevention)', confidence: 0.8, reasoning: 'Proactive prevention approach' },
        { text: 'Condition monitoring (Detection)', confidence: 0.7, reasoning: 'Continuous monitoring capability' },
      ],
    };

    return {
      type: type as any,
      suggestions: fallbacks[type as keyof typeof fallbacks] || [],
      context: `Fallback suggestions for ${context.asset.name} (AI temporarily unavailable)`,
    };
  }

  static getStatus(): { configured: boolean; message: string } {
    const configured = this.isConfigured();
    return {
      configured,
      message: configured 
        ? 'AI assistance is ready'
        : 'AI assistance unavailable - Please configure ANTHROPIC_API_KEY in .env.local',
    };
  }
}