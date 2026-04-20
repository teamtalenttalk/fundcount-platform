import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Activity, BarChart3, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { formatPercent } from '@/lib/format';
import type { PerformanceRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReturnsPage() {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/performance');
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setRecords(data);
      } catch {
        setError('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const avgReturn = records.length > 0 ? records.reduce((s, r) => s + r.mtd_return, 0) / records.length : 0;
  const avgVolatility = records.length > 0 ? records.reduce((s, r) => s + r.volatility, 0) / records.length : 0;
  const avgSharpe = records.length > 0 ? records.reduce((s, r) => s + r.sharpe_ratio, 0) / records.length : 0;
  const worstDrawdown = records.length > 0 ? Math.min(...records.map((r) => r.max_drawdown)) : 0;

  const summaryCards = [
    { label: 'Avg Return', value: formatPercent(avgReturn), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Avg Volatility', value: formatPercent(avgVolatility), icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Avg Sharpe', value: avgSharpe.toFixed(2), icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Worst Drawdown', value: formatPercent(worstDrawdown), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  // Cumulative returns chart data
  let cumulative = 0;
  const chartData = records.map((r) => {
    cumulative += r.mtd_return;
    return { date: r.date, cumulative: parseFloat(cumulative.toFixed(2)), monthly: r.mtd_return };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Returns Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">Portfolio returns and risk metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cumulative Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
              <Legend />
              <Line type="monotone" dataKey="cumulative" name="Cumulative Return" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Returns by Period</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Portfolio</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Daily</TableHead>
                <TableHead className="text-right">MTD</TableHead>
                <TableHead className="text-right">QTD</TableHead>
                <TableHead className="text-right">YTD</TableHead>
                <TableHead className="text-right">ITD</TableHead>
                <TableHead className="text-right">Volatility</TableHead>
                <TableHead className="text-right">Sharpe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.portfolio_name}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="text-right">{formatPercent(r.daily_return)}</TableCell>
                  <TableCell className="text-right">{formatPercent(r.mtd_return)}</TableCell>
                  <TableCell className="text-right">{formatPercent(r.qtd_return)}</TableCell>
                  <TableCell className="text-right">{formatPercent(r.ytd_return)}</TableCell>
                  <TableCell className="text-right">{formatPercent(r.itd_return)}</TableCell>
                  <TableCell className="text-right">{formatPercent(r.volatility)}</TableCell>
                  <TableCell className="text-right">{r.sharpe_ratio.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
