import { NextResponse } from 'next/server';
import connectDB from '@/app/config/db';
import SMSMessage from '@/app/models/SMSMessage';

export async function GET() {
    try {
        await connectDB();
        const smsMessages = await SMSMessage.find();
        return NextResponse.json({
            success: true,
            message: 'Data received successfully via GET',
            data: smsMessages
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
        console.log('Received data from RingCentral (via POST):', data);

        await SMSMessage.create({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return NextResponse.json({
            success: true,
            message: 'Data received successfully via POST',
            data: data
        }, { status: 200 });

    } catch (error) {
        console.error('Error processing POST webhook:', error);
        return NextResponse.json({
            success: false,
            message: 'Error processing webhook',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
