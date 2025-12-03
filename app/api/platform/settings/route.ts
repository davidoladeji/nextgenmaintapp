import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUserFromToken } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/permissions';
import { PlatformSettings, APIResponse } from '@/types';

const settingsPath = path.join(process.cwd(), 'data', 'platform-settings.json');

// Helper functions for deep merging
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

/**
 * GET /api/platform/settings
 * Read platform settings
 * Public endpoint (no auth required for now, will add superadmin check later)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if settings file exists
    if (!fs.existsSync(settingsPath)) {
      return NextResponse.json(
        { success: false, error: 'Platform settings not found' } as APIResponse,
        { status: 404 }
      );
    }

    // Read settings from file
    const settingsData = fs.readFileSync(settingsPath, 'utf-8');
    const settings: PlatformSettings = JSON.parse(settingsData);

    return NextResponse.json(
      { success: true, data: settings } as APIResponse<PlatformSettings>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error reading platform settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read platform settings' } as APIResponse,
      { status: 500 }
    );
  }
}

/**
 * PUT /api/platform/settings
 * Update platform settings
 * Requires Authorization header with Bearer token
 * Only superadmin can update settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse,
        { status: 401 }
      );
    }

    // Check if user is superadmin
    if (!isSuperAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Superadmin access required' } as APIResponse,
        { status: 403 }
      );
    }

    // Parse request body
    const updates = await request.json();

    // Validate updates object
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' } as APIResponse,
        { status: 400 }
      );
    }

    // Read existing settings
    let existingSettings: PlatformSettings;
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf-8');
      existingSettings = JSON.parse(settingsData);
    } else {
      return NextResponse.json(
        { success: false, error: 'Platform settings not found' } as APIResponse,
        { status: 404 }
      );
    }

    // Merge updates with existing settings
    const updatedSettings = deepMerge(existingSettings, updates);

    // Basic validation
    const validationErrors = validateSettings(updatedSettings);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid settings',
          message: validationErrors.join(', ')
        } as APIResponse,
        { status: 400 }
      );
    }

    // Write updated settings back to file
    fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2), 'utf-8');

    return NextResponse.json(
      {
        success: true,
        data: updatedSettings,
        message: 'Platform settings updated successfully'
      } as APIResponse<PlatformSettings>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating platform settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update platform settings' } as APIResponse,
      { status: 500 }
    );
  }
}

/**
 * Basic validation for platform settings
 */
function validateSettings(settings: any): string[] {
  const errors: string[] = [];

  // Validate branding
  if (settings.branding) {
    if (settings.branding.accentColor && !isValidColor(settings.branding.accentColor)) {
      errors.push('Invalid accent color format');
    }
    if (settings.branding.accentColorDark && !isValidColor(settings.branding.accentColorDark)) {
      errors.push('Invalid accent color dark format');
    }
    if (settings.branding.platformName && typeof settings.branding.platformName !== 'string') {
      errors.push('Platform name must be a string');
    }
  }

  // Validate security settings
  if (settings.security) {
    if (settings.security.sessionTimeout && typeof settings.security.sessionTimeout !== 'number') {
      errors.push('Session timeout must be a number');
    }
    if (settings.security.passwordMinLength &&
        (typeof settings.security.passwordMinLength !== 'number' || settings.security.passwordMinLength < 6)) {
      errors.push('Password minimum length must be at least 6');
    }
    if (settings.security.maxLoginAttempts &&
        (typeof settings.security.maxLoginAttempts !== 'number' || settings.security.maxLoginAttempts < 1)) {
      errors.push('Max login attempts must be at least 1');
    }
  }

  // Validate AI settings
  if (settings.ai) {
    if (settings.ai.provider && !['openai', 'anthropic', 'azure'].includes(settings.ai.provider)) {
      errors.push('Invalid AI provider');
    }
    if (settings.ai.maxTokens &&
        (typeof settings.ai.maxTokens !== 'number' || settings.ai.maxTokens < 1)) {
      errors.push('Max tokens must be a positive number');
    }
    if (settings.ai.temperature !== undefined &&
        (typeof settings.ai.temperature !== 'number' || settings.ai.temperature < 0 || settings.ai.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }
  }

  // Validate storage settings
  if (settings.storage) {
    if (settings.storage.maxFileSize &&
        (typeof settings.storage.maxFileSize !== 'number' || settings.storage.maxFileSize < 1)) {
      errors.push('Max file size must be a positive number');
    }
    if (settings.storage.dataRetention &&
        (typeof settings.storage.dataRetention !== 'number' || settings.storage.dataRetention < 1)) {
      errors.push('Data retention must be a positive number');
    }
  }

  // Validate plan limits
  if (settings.planLimits) {
    const plans = ['free', 'starter', 'professional', 'enterprise'];
    plans.forEach((plan) => {
      if (settings.planLimits[plan]) {
        const planConfig = settings.planLimits[plan];
        if (planConfig.maxUsers !== undefined && planConfig.maxUsers !== -1 &&
            (typeof planConfig.maxUsers !== 'number' || planConfig.maxUsers < 1)) {
          errors.push(`${plan} plan: maxUsers must be a positive number or -1 for unlimited`);
        }
        if (planConfig.maxProjects !== undefined && planConfig.maxProjects !== -1 &&
            (typeof planConfig.maxProjects !== 'number' || planConfig.maxProjects < 1)) {
          errors.push(`${plan} plan: maxProjects must be a positive number or -1 for unlimited`);
        }
        if (planConfig.price !== undefined &&
            (typeof planConfig.price !== 'number' || planConfig.price < 0)) {
          errors.push(`${plan} plan: price must be a non-negative number`);
        }
      }
    });
  }

  return errors;
}

/**
 * Validate color format (hex color)
 */
function isValidColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}
