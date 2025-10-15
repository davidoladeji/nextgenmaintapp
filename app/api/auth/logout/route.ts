import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await AuthService.logout(token);
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Logged out successfully' 
      } as APIResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Logout failed' 
      } as APIResponse,
      { status: 500 }
    );
  }
}