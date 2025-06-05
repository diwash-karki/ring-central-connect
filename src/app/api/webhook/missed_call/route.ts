import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());

    console.log('Received data from RingCentral (via GET):', params);

    return NextResponse.json({
      success: true,
      message: 'Data received successfully via GET',
      data: params
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
