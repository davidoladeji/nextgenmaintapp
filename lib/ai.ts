import Anthropic from '@anthropic-ai/sdk';
import { AIPromptContext, AISuggestion, Asset, FailureMode } from '@/types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export class AIService {
  private static isConfigured(): boolean {
    const configured = !!process.env.ANTHROPIC_API_KEY;
    if (!configured) {
      console.error('⚠️ ANTHROPIC_API_KEY not configured - AI suggestions will use fallbacks');
      console.info('💡 To enable AI suggestions, add ANTHROPIC_API_KEY to your .env.local file');
    }
    return configured;
  }

  private static async callClaude(prompt: string, retries = 3, baseDelay = 1000): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your .env.local file.');
    }

    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
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
      } catch (error: any) {
        lastError = error;

        // Check if this is a retryable error (529 Overloaded or 429 Rate Limit)
        const isOverloadedError = error?.status === 529 || error?.error?.type === 'overloaded_error';
        const isRateLimitError = error?.status === 429;
        const shouldRetry = isOverloadedError || isRateLimitError;

        console.error('Claude API Error:', error);

        // If not retryable or no retries left, throw immediately
        if (!shouldRetry || attempt === retries) {
          console.error(`❌ Claude API failed after ${attempt + 1} attempt(s)`);
          throw new Error('AI service temporarily unavailable. Please try again later.');
        }

        // Calculate exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.warn(`⚠️ Claude API overloaded (attempt ${attempt + 1}/${retries + 1}), retrying in ${Math.round(delay)}ms...`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('AI service temporarily unavailable. Please try again later.');
  }

  /**
   * Parse AI response and strip markdown code blocks if present
   */
  private static parseAIResponse(response: string): any {
    let cleanResponse = response.trim();

    // Strip markdown code blocks (```json ... ``` or ``` ... ```)
    if (cleanResponse.startsWith('```')) {
      // Remove opening ```json or ```
      cleanResponse = cleanResponse.replace(/^```(?:json)?\n?/, '');
      // Remove closing ```
      cleanResponse = cleanResponse.replace(/\n?```$/, '');
      cleanResponse = cleanResponse.trim();
    }

    try {
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Failed to parse AI response:', cleanResponse.substring(0, 200));
      throw error;
    }
  }

  static async suggestFailureModes(context: AIPromptContext): Promise<AISuggestion> {
    const { asset, existingData } = context;

    const existingModes = existingData?.failureModes?.map(fm => fm.failure_mode).join(', ') || 'None';

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
      const parsed = this.parseAIResponse(response);

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

    // Use fallback if failure mode not specified (match suggestControls pattern)
    const failureModeDesc = failureMode?.failure_mode || 'General component failure';

    const prompt = `
You are an expert reliability engineer. For the following failure mode, suggest 3-5 potential root causes.

Asset: ${asset.name} (${asset.type})
Context: ${asset.context}
Failure Mode: ${failureModeDesc}
Process Step: ${failureMode?.process_step || 'Not specified'}

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
      const parsed = this.parseAIResponse(response);

      return {
        type: 'cause',
        suggestions: parsed.suggestions || [],
        context: `Causes for "${failureMode.failure_mode}"`,
      };
    } catch (error) {
      return this.getLocalFallback('cause', context);
    }
  }

  static async suggestEffects(context: AIPromptContext): Promise<AISuggestion> {
    const { asset, failureMode } = context;

    // Use fallback if failure mode not specified (match suggestControls pattern)
    const failureModeDesc = failureMode?.failure_mode || 'General component failure';

    const prompt = `
You are an expert reliability engineer. For the following failure mode, suggest 3-5 potential effects/consequences.

Asset: ${asset.name} (${asset.type})
Context: ${asset.context}
Criticality: ${asset.criticality}
Failure Mode: ${failureModeDesc}

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
      const parsed = this.parseAIResponse(response);

      return {
        type: 'effect',
        suggestions: parsed.suggestions || [],
        context: `Effects of "${failureMode.failure_mode}"`,
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
Failure Mode: ${failureMode?.failure_mode || 'Not specified'}
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
      const parsed = this.parseAIResponse(response);

      return {
        type: 'control',
        suggestions: parsed.suggestions || [],
        context: `Controls for ${failureMode?.failure_mode || 'failure mode'}`,
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
Failure Mode: ${failureMode?.failure_mode || 'Not specified'}

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
${failureMode?.failure_mode ? `Failure Mode: ${failureMode.failure_mode}` : ''}
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
      const parsed = this.parseAIResponse(response);

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
    // Log fallback usage for debugging
    console.warn(`🔄 Using fallback suggestions for type: ${type}`, {
      asset: context.asset?.name,
      assetType: context.asset?.type,
      failureMode: context.failureMode?.failure_mode,
      reason: 'AI service unavailable or failed'
    });

    // Expanded fallback pools for variety
    const allFallbacks = {
      'failure-mode': [
        { text: 'Mechanical wear or fatigue', confidence: 0.7, reasoning: 'Common failure mode for mechanical assets' },
        { text: 'Electrical component failure', confidence: 0.7, reasoning: 'Common in electrical systems' },
        { text: 'Software malfunction', confidence: 0.6, reasoning: 'Relevant for automated systems' },
        { text: 'Corrosion or material degradation', confidence: 0.7, reasoning: 'Common in exposed environments' },
        { text: 'Seal or gasket failure', confidence: 0.7, reasoning: 'Common in fluid systems' },
        { text: 'Bearing failure', confidence: 0.7, reasoning: 'Common in rotating equipment' },
      ],
      'cause': [
        { text: 'Inadequate maintenance', confidence: 0.8, reasoning: 'Common root cause across asset types' },
        { text: 'Normal wear and tear', confidence: 0.7, reasoning: 'Expected degradation over time' },
        { text: 'Operating beyond design limits', confidence: 0.7, reasoning: 'Common operational issue' },
        { text: 'Contamination or fouling', confidence: 0.7, reasoning: 'Common in process systems' },
        { text: 'Improper installation', confidence: 0.6, reasoning: 'Setup-related issues' },
        { text: 'Environmental factors', confidence: 0.7, reasoning: 'Temperature, humidity, vibration' },
        { text: 'Material defects', confidence: 0.6, reasoning: 'Manufacturing quality issues' },
        { text: 'Lubrication inadequacy', confidence: 0.7, reasoning: 'Common in mechanical systems' },
      ],
      'effect': [
        { text: 'Unplanned downtime', confidence: 0.8, reasoning: 'Direct operational impact' },
        { text: 'Reduced performance or efficiency', confidence: 0.7, reasoning: 'Degraded operational capability' },
        { text: 'Safety risk to personnel', confidence: 0.8, reasoning: 'Potential safety implications' },
        { text: 'Product quality degradation', confidence: 0.7, reasoning: 'Output quality affected' },
        { text: 'Environmental impact', confidence: 0.7, reasoning: 'Potential leaks or emissions' },
        { text: 'Increased maintenance costs', confidence: 0.7, reasoning: 'Financial impact' },
        { text: 'Secondary equipment damage', confidence: 0.7, reasoning: 'Cascading failures' },
        { text: 'Regulatory non-compliance', confidence: 0.6, reasoning: 'Compliance issues' },
      ],
      'control': [
        { text: 'Regular visual inspection (Detection)', confidence: 0.8, reasoning: 'Standard detection method' },
        { text: 'Preventive maintenance schedule (Prevention)', confidence: 0.8, reasoning: 'Proactive prevention approach' },
        { text: 'Condition monitoring (Detection)', confidence: 0.7, reasoning: 'Continuous monitoring capability' },
        { text: 'Vibration analysis (Detection)', confidence: 0.7, reasoning: 'For rotating equipment' },
        { text: 'Temperature monitoring (Detection)', confidence: 0.7, reasoning: 'For thermal issues' },
        { text: 'Periodic testing (Detection)', confidence: 0.7, reasoning: 'Functional verification' },
        { text: 'Operator training (Prevention)', confidence: 0.7, reasoning: 'Prevent operational errors' },
      ],
    };

    // Get all suggestions for this type
    const pool = allFallbacks[type as keyof typeof allFallbacks] || [];

    // Randomize selection - pick 3-4 suggestions
    const count = Math.min(pool.length, Math.floor(Math.random() * 2) + 3); // 3 or 4 items
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    return {
      type: type as any,
      suggestions: selected,
      context: `Fallback suggestions for ${context.asset.name} (${selected.length} generic suggestions - AI unavailable)`,
    };
  }

  static async suggestDuplicateName(
    type: 'component' | 'failureMode' | 'effect' | 'componentFunction',
    originalName: string,
    context: any
  ): Promise<{ name: string; reasoning: string }> {
    let prompt = '';

    switch (type) {
      case 'component':
        prompt = `You are an expert reliability engineer. Suggest a realistic component name for project "${context.projectName || 'system'}" analyzing asset "${context.assetName || context.componentName}".

Project Context:
- Project: ${context.projectName || 'N/A'}
- Description: ${context.projectDescription || 'N/A'}
- Asset: ${context.assetName || context.componentName} (${context.assetType || 'N/A'})
- Asset Context: ${context.assetContext || 'N/A'}
- Criticality: ${context.criticality || 'N/A'}

The component name should be:
1. Realistic for this specific asset type
2. Different from just "${originalName}"
3. Professional and technically accurate
4. Specific to the system context (${context.assetContext || 'this system'})
5. Brief (2-5 words maximum)

Examples of good component names for a pump system:
- "Discharge Valve Assembly"
- "Suction Line Filter"
- "Mechanical Seal Unit"
- "Impeller Housing"

Format your response as JSON:
{
  "name": "The suggested component name",
  "reasoning": "Brief explanation of why this component exists in this system"
}

Do NOT just add "(Copy)" or "Variant". Provide a real component that would exist in this ${context.assetType || 'asset'}.`;
        break;

      case 'failureMode':
        prompt = `You are an expert reliability engineer. Suggest a related but distinct failure mode to "${originalName}" for component "${context.componentName || 'the component'}".

The new failure mode should be:
1. Different from the original but related
2. Technically plausible for the same component
3. Specific and actionable
4. Professional terminology

Format your response as JSON:
{
  "name": "The suggested failure mode",
  "reasoning": "Brief explanation of why this failure mode is relevant"
}

Do NOT just add "(Copy)" or numbers. Provide a distinct but related failure mode.`;
        break;

      case 'effect':
        prompt = `You are an expert reliability engineer. Suggest a similar effect to "${originalName}" that could result from failure mode "${context.failureModeName || 'the failure mode'}".

The new effect should be:
1. Similar but distinct from the original
2. Realistic consequence of the same failure mode
3. Specific and measurable
4. Technically accurate

Format your response as JSON:
{
  "name": "The suggested effect description",
  "reasoning": "Brief explanation of why this effect is relevant"
}

Do NOT just add "(Copy)" or numbers. Provide a distinct but related effect.`;
        break;

      case 'componentFunction':
        prompt = `You are an expert reliability engineer. Describe the function of component "${originalName}" in the context of project "${context.projectName || 'system'}".

Project Details:
- Project: ${context.projectName || 'N/A'}
- Asset: ${context.assetName || 'N/A'} (${context.assetType || 'N/A'})
- Asset Context: ${context.assetContext || 'N/A'}
- Component: ${originalName}

The function description should:
1. Be specific to this component in this system
2. Describe what the component does (not what can go wrong)
3. Be 1-2 sentences maximum
4. Use professional engineering terminology
5. Be practical and realistic

Format your response as JSON:
{
  "name": "Brief function description (1-2 sentences)",
  "reasoning": "Why this function is relevant to this component"
}

Example good descriptions:
- "Transfers hydraulic fluid from reservoir to system under pressure"
- "Regulates flow rate to maintain constant pressure in cooling circuit"
- "Provides backup power during main supply failure"

Do NOT provide control descriptions (like "Regular inspection"). Focus on FUNCTION.`;
        break;
    }

    try {
      const response = await this.callClaude(prompt);
      const parsed = this.parseAIResponse(response);

      return {
        name: parsed.name || `${originalName} (Copy)`,
        reasoning: parsed.reasoning || 'AI-generated variant',
      };
    } catch (error) {
      console.error('AI duplicate name generation error:', error);
      // Return fallback with descriptive variant
      return {
        name: type === 'component'
          ? `${originalName} - Variant`
          : type === 'failureMode'
          ? `${originalName} - Related Mode`
          : type === 'effect'
          ? `${originalName} - Similar Effect`
          : `Performs critical operation in ${context.assetType || 'system'}`,
        reasoning: 'AI temporarily unavailable, using fallback pattern',
      };
    }
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