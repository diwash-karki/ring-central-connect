import { NextResponse } from 'next/server';
import connectDB from '@/app/config/db';
import MissedCall from '@/app/models/MissedCall';

export async function GET() {
  try {
    await connectDB();
    const missedCalls = await MissedCall.find();
    return NextResponse.json({
      success: true,
      message: 'Data received successfully via GET',
      data: missedCalls
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing GET webhook:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();

    console.log('Received data from RingCentral (via GET):', data);

    await MissedCall.create({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Data received successfully via GET',
      data: data
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing GET webhook:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
