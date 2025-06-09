import { NextResponse } from 'next/server';
import { SDK } from '@ringcentral/sdk';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get('fromDate') || '2024-01-01T00:00:00.000Z';
  const toDate = searchParams.get('toDate') || '2024-01-31T23:59:59.999Z';

  const rcsdk = new SDK({
    server: process.env.RC_SERVER_URL!,
    clientId: process.env.RC_APP_CLIENT_ID!,
    clientSecret: process.env.RC_APP_CLIENT_SECRET!,
  });

  console.table({
    server: process.env.RC_SERVER_URL!,
    clientId: process.env.RC_APP_CLIENT_ID!,
    clientSecret: process.env.RC_APP_CLIENT_SECRET!,
  });

  const platform = rcsdk.platform();
  
  try {
    await platform.login({ jwt: process.env.RC_USER_JWT! });
    console.log('Logged in to RingCentral platform');

    // Fetch calls analytics
    const callsResponse = await platform.post('/analytics/calls/v1/accounts/~/aggregation/fetch', {
      grouping: { groupBy: 'Users' },
      timeSettings: {
        timeZone: 'America/Los_Angeles',
        timeRange: {
          timeFrom: fromDate,
          timeTo: toDate
        }
      },
      responseOptions: {
        counters: {
          allCalls: { aggregationType: "Sum" },
          answeredCalls: { aggregationType: "Sum" },
          missedCalls: { aggregationType: "Sum" },
          
          totalDuration: { aggregationType: "Sum" }
        }
      }
    });

    // Fetch SMS analytics
    const smsResponse = await platform.post('/analytics/sms/v1/accounts/~/aggregation/fetch', {
      grouping: { groupBy: 'Users' },
      timeSettings: {
        timeZone: 'America/Los_Angeles',
        timeRange: {
          timeFrom: fromDate,
          timeTo: toDate
        }
      },
      responseOptions: {
        counters: {
          allSms: { aggregationType: "Sum" },
          sentSms: { aggregationType: "Sum" },
          receivedSms: { aggregationType: "Sum" }
        }
      }
    });

    const callsData = await callsResponse.json();
    const smsData = await smsResponse.json();

    // Combine and format the data
    const combinedData = callsData.data.map((callItem: any) => {
      const smsItem = smsData.data.find((s: any) => s.grouping.id === callItem.grouping.id);
      return {
        userId: callItem.grouping.id,
        userName: callItem.grouping.name,
        calls: {
          total: callItem.counters.allCalls,
          answered: callItem.counters.answeredCalls,
          missed: callItem.counters.missedCalls,
          totalDuration: callItem.counters.totalDuration
        },
        sms: {
          total: smsItem?.counters.allSms || 0,
          sent: smsItem?.counters.sentSms || 0,
          received: smsItem?.counters.receivedSms || 0
        }
      };
    });

    return NextResponse.json({
      data: combinedData,
      timeRange: {
        from: fromDate,
        to: toDate
      }
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}


