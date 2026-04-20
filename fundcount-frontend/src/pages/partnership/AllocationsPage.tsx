import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { formatPercent, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Allocation {
  id: number;
  partner_id: number;
  partner_name: string;
  portfolio_id: number;
  portfolio_name: string;
  allocation_pct: number;
  class_type: string;
  effective_date: string;
  status: string;
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/partner-allocations');
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setAllocations(data);
      } catch {
        setError('Failed to load allocations');
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

  // Aggregate by partner for pie chart
  const partnerAlloc = new Map<string, number>();
  allocations.forEach((a) => {
    partnerAlloc.set(a.partner_name, (partnerAlloc.get(a.partner_name) || 0) + a.allocation_pct);
  });
  const pieData = Array.from(partnerAlloc.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Partner Allocations</h1>
        <p className="text-sm text-gray-500 mt-1">Portfolio ownership allocation by partner</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Ownership</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Allocation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Portfolio</TableHead>
                <TableHead className="text-right">Allocation%</TableHead>
                <TableHead>Class Type</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.partner_name}</TableCell>
                  <TableCell>{a.portfolio_name}</TableCell>
                  <TableCell className="text-right">{formatPercent(a.allocation_pct)}</TableCell>
                  <TableCell>{a.class_type}</TableCell>
                  <TableCell>{formatDate(a.effective_date)}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === 'active' ? 'default' : 'secondary'}>
                      {a.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
