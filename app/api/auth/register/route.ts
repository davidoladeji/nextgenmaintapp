import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, name, and password are required' } as APIResponse,
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' } as APIResponse,
        { status: 400 }
      );
    }

    const user = await AuthService.createUser({ email, name, password, role });
    
    return NextResponse.json(
      { 
        success: true, 
        data: user,
        message: 'User created successfully' 
      } as APIResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      } as APIResponse,
      { status: 400 }
    );
  }
}