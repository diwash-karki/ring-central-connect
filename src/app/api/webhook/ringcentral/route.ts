import { NextResponse } from 'next/server';
import connectDB from '@/app/config/db';

export async function POST(request: Request) {
    try {
        // Connect to MongoDB
        // await connectDB();

        // Parse the incoming request body
        const data = await request.json();

        // Log the received data (you can remove this in production)
        console.log('Received data from RingCentral:', data);

        // Here you can process the data as needed
        // For example, you might want to:
        // - Validate the data
        // - Store it in MongoDB
        // - Trigger other actions

        // Return a success response
        return NextResponse.json({
            success: true,
            message: 'Data received successfully',
            data: data
        }, { status: 200 });

    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({
            success: false,
            message: 'Error processing webhook',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 