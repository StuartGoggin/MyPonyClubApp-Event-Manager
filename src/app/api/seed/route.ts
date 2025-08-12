import { seedData } from '../../../lib/data';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await seedData();
    if (result.success) {
      return NextResponse.json({ message: result.message, status: 200 });
    } else {
      return NextResponse.json({ message: result.message, status: 500 });
    }
  } catch (error) {
    console.error('Error in seed API route:', error);
    return NextResponse.json({ message: 'An error occurred during seeding.', status: 500 });
  }
}