import { NextRequest, NextResponse } from 'next/server';
import { AuthService, ensureDefaultUser } from '@/lib/auth';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Ensure default users and migration on first login
    await ensureDefaultUser();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' } as APIResponse,
        { status: 400 }
      );
    }

    const result = await AuthService.loginUser({ email, password });
    
    return NextResponse.json(
      { 
        success: true, 
        data: result,
        message: 'Login successful' 
      } as APIResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      } as APIResponse,
      { status: 401 }
    );
  }
}