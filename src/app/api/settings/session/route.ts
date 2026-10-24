import { NextResponse } from 'next/server';
import { sessionStateExists, clearSessionState } from '@/lib/dataProviders/browserUtils';

export async function GET() {
  return NextResponse.json({ exists: sessionStateExists() });
}

export async function DELETE() {
  clearSessionState();
  return NextResponse.json({ exists: false });
}
