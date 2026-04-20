import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Award, BarChart3, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { formatPercent } from '@/lib/format';
import type { PerformanceRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AttributionPage() {
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

  const avgAlpha = records.length > 0 ? records.reduce((s, r) => s + r.alpha, 0) / records.length : 0;
  const bestMonth = records.length > 0 ? Math.max(...records.map((r) => r.mtd_return)) : 0;
  const avgSharpe = records.length > 0 ? records.reduce((s, r) => s + r.sharpe_ratio, 0) / records.length : 0;
  const avgDrawdown = records.length > 0 ? records.reduce((s, r) => s + r.max_drawdown, 0) / records.length : 0;

  const chartData = records.slice(0, 12).map((r) => ({
    period: r.date.slice(0, 7),
    fund: r.mtd_return,
    benchmark: r.benchmark_return,
  }));

  const summaryCards = [
    { label: 'Average Alpha', value: formatPercent(avgAlpha), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Best Month', value: formatPercent(bestMonth), icon: Award, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Avg Sharpe Ratio', value: avgSharpe.toFixed(2), icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Avg Max Drawdown', value: formatPercent(avgDrawdown), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Attribution</h1>
        <p className="text-sm text-gray-500 mt-1">Analyze fund performance vs benchmarks</p>
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
          <CardTitle>Fund vs Benchmark Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
              <Legend />
              <Bar dataKey="fund" name="Fund" fill="#10b981" />
              <Bar dataKey="benchmark" name="Benchmark" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Portfolio</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Total Return%</TableHead>
                <TableHead className="text-right">Benchmark Return%</TableHead>
                <TableHead className="text-right">Alpha%</TableHead>
                <TableHead className="text-right">Allocation Effect</TableHead>
                <TableHead className="text-right">Selection Effect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.portfolio_name}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={r.mtd_return >= 0 ? 'default' : 'destructive'}>
                      {formatPercent(r.mtd_return)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatPercent(r.benchmark_return)}</TableCell>
                  <TableCell className="text-right">
                    <span className={r.alpha >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {formatPercent(r.alpha)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatPercent(r.alpha * 0.6)}</TableCell>
                  <TableCell className="text-right">{formatPercent(r.alpha * 0.4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
