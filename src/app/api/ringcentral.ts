import type { NextApiRequest, NextApiResponse } from 'next';
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
  if (!platform.loggedIn()) {
    await platform.login({ jwt: process.env.RC_USER_JWT! });
  }
}

async function getAllExtensions(): Promise<any[]> {
  const res = await platform.get('/restapi/v1.0/account/~/extension', { perPage: 1000 });
  const { records } = await res.json();
  return records;
}

async function getSmsLogs(extensionId: string, dateFrom: string, dateTo: string) {
  const res = await platform.get(
    `/restapi/v1.0/account/~/extension/${extensionId}/message-store`,
    {
      messageType: ['SMS'],
      dateFrom,
      dateTo,
      perPage: 1000,
    }
  );
  const { records } = await res.json();
  return records || [];
}

async function getCallAggregation(dateFrom: string, dateTo: string) {
  const bodyParams = {
    grouping: {
      groupBy: 'Users',
    },
    timeSettings: {
      timeZone: 'America/Los_Angeles',
      timeRange: {
        timeFrom: dateFrom,
        timeTo: dateTo,
      },
    },
    responseOptions: {
      counters: {
        allCalls: {
          aggregationType: 'Sum',
        },
      },
    },
  };

  const res = await platform.post(
    '/analytics/calls/v1/accounts/~/aggregation/fetch',
    bodyParams,
    { perPage: 100 }
  );
  const data = await res.json();
  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await loginToRingCentral();

    const {
      dateFrom = '2025-03-01T00:00:00.000Z',
      dateTo = '2025-05-15T23:59:59.999Z',
    } = req.query;

    const extensions = await getAllExtensions();
    const callData = await getCallAggregation(dateFrom as string, dateTo as string);
    const smsLogs: any[] = [];
    const smsSummary: Record<string, { name: string; inbound: number; outbound: number; total: number }> = {};

    for (const ext of extensions) {
      const extId = String(ext.id);
      const name = `${ext.contact?.firstName || ''} ${ext.contact?.lastName || ''}`.trim() || `Extension ${extId}`;
      const logs = await getSmsLogs(extId, dateFrom as string, dateTo as string);

      let inbound = 0;
      let outbound = 0;

      for (const msg of logs) {
        if (msg.direction === 'Inbound') inbound++;
        if (msg.direction === 'Outbound') outbound++;
      }

      smsSummary[extId] = {
        name,
        inbound,
        outbound,
        total: logs.length,
      };

      smsLogs.push(...logs.map((msg: any) => ({ ...msg, extensionId: extId, name })));
    }

    // Organize call summary per extension (if data exists)
    const callSummary: Record<string, { name: string; callCount: number }> = {};
    if (callData?.data) {
      for (const record of callData.data) {
        const extId = String(record.group?.extensionId);
        callSummary[extId] = {
          name: record.group?.name || `Extension ${extId}`,
          callCount: record.counters?.allCalls || 0,
        };
      }
    }

    res.status(200).json({
      period: { from: dateFrom, to: dateTo },
      callSummary,
      smsSummary,
      totalSmsMessages: smsLogs.length,
      smsLogs,
    });
  } catch (error: any) {
    console.error('Error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch communication analytics',
      detail: error.message,
    });
  }
}
