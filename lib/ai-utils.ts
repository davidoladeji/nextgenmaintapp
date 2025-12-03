import toast from 'react-hot-toast';

interface DuplicateNameResult {
  name: string;
  reasoning: string;
}

/**
 * Generate an AI-powered duplicate name for Components, Failure Modes, or Effects
 * Falls back to "(Copy)" pattern if AI fails or times out
 */
export async function generateAIDuplicateName(
  type: 'component' | 'failureMode' | 'effect',
  originalName: string,
  context: {
    componentName?: string;
    failureModeName?: string;
  },
  token: string
): Promise<string> {
  // Fallback names
  const fallbackName =
    type === 'component'
      ? `${originalName} (Copy)`
      : type === 'failureMode'
      ? `${originalName} (Copy)`
      : `${originalName} (Copy)`;

  try {
    const response = await fetch('/api/ai/duplicate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type,
        originalName,
        context,
      }),
    });

    if (!response.ok) {
      console.warn('AI duplicate name generation failed, using fallback');
      return fallbackName;
    }

    const result = await response.json();

    if (result.success && result.data?.name) {
      return result.data.name;
    }

    return fallbackName;
  } catch (error) {
    console.error('Error generating AI duplicate name:', error);
    return fallbackName;
  }
}

/**
 * Generate AI duplicate name with loading toast feedback
 */
export async function generateAIDuplicateNameWithToast(
  type: 'component' | 'failureMode' | 'effect',
  originalName: string,
  context: {
    componentName?: string;
    failureModeName?: string;
  },
  token: string
): Promise<string> {
  const toastId = toast.loading('AI generating name...');

  try {
    const name = await generateAIDuplicateName(type, originalName, context, token);

    // Check if it's a fallback (contains "Copy" or "Variant")
    const isFallback =
      name.includes('(Copy)') ||
      name.includes('Variant') ||
      name.includes('Related Mode') ||
      name.includes('Similar Effect');

    if (isFallback) {
      toast.dismiss(toastId);
      // Don't show error toast, just use the fallback silently
    } else {
      toast.success('AI name generated!', { id: toastId });
    }

    return name;
  } catch (error) {
    toast.dismiss(toastId);
    const fallbackName = `${originalName} (Copy)`;
    return fallbackName;
  }
}
