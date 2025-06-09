import { NextRequest } from 'next/server';
import { SDK } from '@ringcentral/sdk';
import dotenv from 'dotenv';

dotenv.config();

const rcsdk = new SDK({
  server: process.env.RC_SERVER_URL!,
  clientId: process.env.RC_APP_CLIENT_ID!,
  clientSecret: process.env.RC_APP_CLIENT_SECRET!,
});
const platform = rcsdk.platform();

async function loginToRingCentral() {
  await platform.login({ jwt: process.env.RC_USER_JWT! });
}

async function getCallAggregation(dateFrom: string, dateTo: string) {
  const bodyParams = {
    grouping: { groupBy: 'Users' },
    timeSettings: {
      timeZone: 'America/Los_Angeles',
      timeRange: {
        timeFrom: dateFrom,
        timeTo: dateTo,
      },
    },
    responseOptions: {
      counters: {
        allCalls: { aggregationType: 'Sum' },
      },
    },
  };

  const res = await platform.post(
    '/analytics/calls/v1/accounts/~/aggregation/fetch',
    bodyParams,
    { perPage: 100 }
  );

  const jsonb = await res.json();

  if (!jsonb?.data?.records) {
    console.warn('No valid call aggregation records returned.');
    return [];
  }

  return jsonb.data.records;
}

export async function GET(req: NextRequest) {
  try {
    await loginToRingCentral();

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom') || '2025-03-01T00:00:00.000Z';
    const dateTo = searchParams.get('dateTo') || '2025-05-15T23:59:59.999Z';

    const records = await getCallAggregation(dateFrom, dateTo);

    return Response.json({
      period: { from: dateFrom, to: dateTo },
      records,
    });
  } catch (error: any) {
    console.error('Call Analytics Error:', error.message);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch call analytics',
        detail: error.message,
      }),
      { status: 500 }
    );
  }
}
