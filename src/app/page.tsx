"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsData {
  userId: string;
  userName: string;
  calls: {
    total: number;
    answered: number;
    missed: number;
    totalDuration: number;
  };
  sms: {
    total: number;
    sent: number;
    received: number;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('2024-01-01');
  const [toDate, setToDate] = useState('2024-01-31');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics?fromDate=${fromDate}T00:00:00.000Z&toDate=${toDate}T23:59:59.999Z`
      );
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = selectedUser
    ? data.filter(item => item.userId === selectedUser)
    : data;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }
  if (!data) {
    return <div className="text-center py-8">No analytics data available for the selected date range.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">RingCentral Analytics Dashboard</h1>

      {/* Date Range Selector */}
      <div className="mb-8 flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded p-2"
          />
        </div>
      </div>

      {/* User Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-1">Select User</label>
        <select
          value={selectedUser || ''}
          onChange={(e) => setSelectedUser(e.target.value || null)}
          className="border rounded p-2 w-64"
        >
          <option value="">All Users</option>
          {data.map((user) => (
            <option key={user.userId} value={user.userId}>
              {user.userName}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Calls Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Calls Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-blue-600">Total Calls</div>
                <div className="text-2xl font-bold">
                  {filteredData.reduce((sum, item) => sum + item.calls.total, 0)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-green-600">Answered Calls</div>
                <div className="text-2xl font-bold">
                  {filteredData.reduce((sum, item) => sum + item.calls.answered, 0)}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded">
                <div className="text-sm text-red-600">Missed Calls</div>
                <div className="text-2xl font-bold">
                  {filteredData.reduce((sum, item) => sum + item.calls.missed, 0)}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <div className="text-sm text-purple-600">Total Duration</div>
                <div className="text-2xl font-bold">
                  {formatDuration(filteredData.reduce((sum, item) => sum + item.calls.totalDuration, 0))}
                </div>
              </div>
            </div>
          </div>

          {/* SMS Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">SMS Overview</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-blue-600">Total SMS</div>
                <div className="text-2xl font-bold">
                  {filteredData.reduce((sum, item) => sum + item.sms.total, 0)}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-green-600">Sent SMS</div>
                <div className="text-2xl font-bold">
                  {filteredData.reduce((sum, item) => sum + item.sms.sent, 0)}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <div className="text-sm text-yellow-600">Received SMS</div>
                <div className="text-2xl font-bold">
                  {filteredData.reduce((sum, item) => sum + item.sms.received, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Calls by User Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Calls by User</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calls.answered" name="Answered" fill="#10B981" />
                  <Bar dataKey="calls.missed" name="Missed" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SMS by User Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">SMS by User</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sms.sent" name="Sent" fill="#3B82F6" />
                  <Bar dataKey="sms.received" name="Received" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
