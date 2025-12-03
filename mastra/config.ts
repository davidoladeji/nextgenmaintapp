import { Mastra } from '@mastra/core';
import { Anthropic } from '@anthropic-ai/sdk';

// Initialize Anthropic client for Mastra agents
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Create Mastra instance with configuration
export const mastra = new Mastra({
  agents: {
    // Agents will be added dynamically
  },
  llm: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
  },
});

// Helper function to check if Mastra is configured
export function isMastraConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// Helper to get Claude client for direct API calls if needed
export function getClaudeClient() {
  return anthropic;
}
