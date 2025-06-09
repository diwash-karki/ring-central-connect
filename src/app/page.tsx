"use client";

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface CallRecord {
  key: string;
  info: {
    extensionNumber: string;
    name: string;
  };
  counters: {
    allCalls: {
      valueType: string;
      values: number;
    };
  };
}

type ChartType = 'bar' | 'line' | 'daily' | 'dailyBar' | 'pie';
type SortField = 'name' | 'calls';
type SortOrder = 'asc' | 'desc';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function CallDashboard() {
  const [data, setData] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [sortField, setSortField] = useState<SortField>('calls');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    validateAndFetchData();
  }, [fromDate, toDate]);

  const validateAndFetchData = () => {
    const today = dayjs().format('YYYY-MM-DD');
    if (fromDate > today || toDate > today) {
      setError("Date range cannot include future dates.");
      setData([]);
      return;
    }
    if (fromDate > toDate) {
      setError("From date cannot be after To date.");
      setData([]);
      return;
    }
    setError(null);
    fetchData();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString(); // full timestamp in UTC
      const response = await fetch(
        `/api/analytics?dateFrom=${fromDate}T00:00:00.000Z&dateTo=${now}`
      );
      const result = await response.json();
      setData(result.records || []);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load data from the server.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const applyQuickFilter = (range: 'today' | 'week' | 'month') => {
    const today = dayjs();
    if (range === 'today') {
      const date = today.format('YYYY-MM-DD');
      setFromDate(date);
      setToDate(date);
    } else if (range === 'week') {
      setFromDate(today.startOf('week').format('YYYY-MM-DD'));
      setToDate(today.format('YYYY-MM-DD'));
    } else if (range === 'month') {
      setFromDate(today.startOf('month').format('YYYY-MM-DD'));
      setToDate(today.format('YYYY-MM-DD'));
    }
  };

  const filteredData = selectedUser
    ? data.filter((item) => item.info.extensionNumber === selectedUser)
    : data;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = sortField === 'name' 
      ? a.info.name 
      : a.counters.allCalls.values;
    const bValue = sortField === 'name' 
      ? b.info.name 
      : b.counters.allCalls.values;
    
    return sortOrder === 'asc' 
      ? aValue > bValue ? 1 : -1
      : aValue < bValue ? 1 : -1;
  });

  const chartData = sortedData.map((item) => ({
    name: `${item.info.name} (${item.info.extensionNumber})`,
    calls: item.counters.allCalls.values,
  }));

  const getDailyCallData = () => {
    const days = dayjs(toDate).diff(dayjs(fromDate), 'day') + 1;
    const dailyData = Array.from({ length: days }, (_, i) => {
      const date = dayjs(fromDate).add(i, 'day');
      return {
        date: date.format('MMM D'),
        calls: Math.floor(Math.random() * 50) + 10, // Replace with actual API data
      };
    });
    return dailyData;
  };

  const renderChart = () => {
    if (chartType === 'pie') {
      const nonZeroData = chartData.filter(item => item.calls > 0);
      return (
        <PieChart width={800} height={400}>
          <Pie
            data={nonZeroData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={150}
            fill="#8884d8"
            dataKey="calls"
          >
            {nonZeroData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );
    }

    if (chartType === 'daily' || chartType === 'dailyBar') {
      const dailyData = getDailyCallData().filter(d => d.calls > 0);
      const interval = Math.max(1, Math.ceil(dailyData.length / 10));
      const filteredData = dailyData.filter((_, index) => index % interval === 0);

      return (
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'daily' ? (
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={interval - 1}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="calls" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={interval - 1}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="calls" 
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      );
    }

    const nonZeroData = chartData.filter(item => item.calls > 0);
    return (
      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'bar' ? (
          <BarChart data={nonZeroData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="calls" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        ) : (
          <LineChart data={nonZeroData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="calls" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    );
  };

  const downloadReport = (format: 'csv' | 'xlsx' | 'pdf') => {
    const reportData = sortedData.map(item => ({
      'User Name': item.info.name,
      'Extension': item.info.extensionNumber,
      'Total Calls': item.counters.allCalls.values,
    }));

    const timeRange = `Report Period: ${dayjs(fromDate).format('MMM D, YYYY')} - ${dayjs(toDate).format('MMM D, YYYY')}`;
    const companyName = 'DKC Lending LLC';
    const dailyData = getDailyCallData().filter(d => d.calls > 0);

    if (format === 'csv') {
      const csvContent = [
        [companyName],
        [timeRange],
        [],
        ['Daily Call Summary'],
        ['Date', 'Calls'],
        ...dailyData.map(row => [row.date, row.calls]),
        [],
        ['User Call Summary'],
        Object.keys(reportData[0]).join(','),
        ...reportData.map(row => Object.values(row).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `DKC-Lending-Call-Analytics-${dayjs().format('YYYY-MM-DD')}.csv`);
    } else if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(reportData);
      // Add header rows
      XLSX.utils.sheet_add_aoa(ws, [[companyName]], { origin: 'A1' });
      XLSX.utils.sheet_add_aoa(ws, [[timeRange]], { origin: 'A2' });
      XLSX.utils.sheet_add_aoa(ws, [['Daily Call Summary']], { origin: 'A4' });
      XLSX.utils.sheet_add_aoa(ws, [['Date', 'Calls']], { origin: 'A5' });
      XLSX.utils.sheet_add_aoa(ws, dailyData.map(row => [row.date, row.calls]), { origin: 'A6' });
      XLSX.utils.sheet_add_aoa(ws, [['User Call Summary']], { origin: 'A7' });
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Call Analytics');
      XLSX.writeFile(wb, `DKC-Lending-Call-Analytics-${dayjs().format('YYYY-MM-DD')}.xlsx`);
    } else if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw bar chart
          const barWidth = 25;
          const spacing = 30;
          const maxCalls = Math.max(...dailyData.map(d => d.calls));
          const scale = 350 / maxCalls;

          // Draw bars
          dailyData.forEach((d, i) => {
            const x = i * spacing;
            const height = d.calls * scale;
            const y = 350 - height;

            // Draw bar
            ctx.fillStyle = '#3B82F6';
            ctx.fillRect(x, y, barWidth, height);

            // Draw date label
            ctx.save();
            ctx.translate(x + barWidth/2, 380);
            ctx.rotate(-Math.PI/4);
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(d.date, 0, 0);
            ctx.restore();
          });

          // Draw axes
          ctx.strokeStyle = '#000';
          ctx.beginPath();
          ctx.moveTo(0, 350);
          ctx.lineTo(800, 350);
          ctx.stroke();

          // Draw y-axis labels
          for (let i = 0; i <= maxCalls; i += Math.ceil(maxCalls/5)) {
            const y = 350 - (i * scale);
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(i.toString(), -5, y + 3);
          }
        }

        const chartImage = canvas.toDataURL('image/png');

        const content = `
          <html>
            <head>
              <title>Call Analytics Report - DKC Lending LLC</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .time-range { font-size: 16px; color: #666; margin-bottom: 20px; }
                .section { margin: 30px 0; }
                .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; }
                .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
                .chart-container { margin: 20px 0; text-align: center; }
                .chart-container img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="company-name">DKC Lending LLC</div>
                <div class="time-range">${timeRange}</div>
              </div>

              <div class="section">
                <div class="section-title">Daily Call Volume</div>
                <div class="chart-container">
                  <img src="${chartImage}" alt="Daily Call Volume Chart" />
                </div>
              </div>

              <div class="section">
                <div class="section-title">User Call Summary</div>
                <table>
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Extension</th>
                      <th>Total Calls</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reportData.map(row => `
                      <tr>
                        <td>${row['User Name']}</td>
                        <td>${row['Extension']}</td>
                        <td>${row['Total Calls']}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div class="footer">
                Generated on: ${dayjs().format('MMMM D, YYYY h:mm A')}
              </div>
            </body>
          </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">RingCentral Call Analytics</h1>
          <p className="text-gray-600 mt-1">DKC Lending LLC</p>
          <p className="text-sm text-gray-500">
            Period: {dayjs(fromDate).format('MMM D, YYYY')} - {dayjs(toDate).format('MMM D, YYYY')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadReport('csv')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Download CSV
          </button>
          <button
            onClick={() => downloadReport('xlsx')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Download Excel
          </button>
          <button
            onClick={() => downloadReport('pdf')}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => applyQuickFilter('today')}
          className="px-4 py-2 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => applyQuickFilter('week')}
          className="px-4 py-2 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
        >
          This Week
        </button>
        <button
          onClick={() => applyQuickFilter('month')}
          className="px-4 py-2 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
        >
          This Month
        </button>
      </div>

      {/* Date Picker and Chart Type */}
      <div className="mb-6 flex gap-6 items-center">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Chart Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded transition-colors ${
                chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-4 py-2 rounded transition-colors ${
                chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Line Chart
            </button>
            <button
              onClick={() => setChartType('daily')}
              className={`px-4 py-2 rounded transition-colors ${
                chartType === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Daily Line
            </button>
            <button
              onClick={() => setChartType('dailyBar')}
              className={`px-4 py-2 rounded transition-colors ${
                chartType === 'dailyBar' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Daily Bar
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-4 py-2 rounded transition-colors ${
                chartType === 'pie' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Pie Chart
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          ⚠️ {error}
        </div>
      )}

      {/* User Filter */}
      {data && data.length > 0 ? (
        <div className="mb-8">
          <label className="block text-sm font-medium mb-1">Select User</label>
          <select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(e.target.value || null)}
            className="border rounded p-2 w-64"
          >
            <option value="">All Users</option>
            {data.map((user) => (
              <option key={user.key} value={user.info.extensionNumber}>
                {user.info.name} ({user.info.extensionNumber})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-6 text-gray-600 italic">No users found in this range.</div>
      )}

      {/* Total Call Count */}
      {!error && !loading && data.length > 0 && (
        <div className="mb-8 text-xl font-semibold">
          📊 Total Calls:{' '}
          {filteredData.reduce((sum, item) => sum + item.counters.allCalls.values, 0)}
        </div>
      )}

      {/* Chart */}
      {!loading && !error && chartData.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {chartType === 'daily' ? 'Daily Call Volume' : 'Calls by User'}
          </h2>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && sortedData.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    User Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('calls')}
                  >
                    Total Calls {sortField === 'calls' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Extension
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((item) => (
                  <tr key={item.key} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.info.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.counters.allCalls.values}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.info.extensionNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-500">Loading analytics...</div>
      )}
    </div>
  );
}
