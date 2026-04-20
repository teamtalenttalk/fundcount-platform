import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import type { CapitalAccount } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function CapitalAccountsPage() {
  const [accounts, setAccounts] = useState<CapitalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/capital-accounts');
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setAccounts(data);
      } catch {
        setError('Failed to load capital accounts');
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

  const totals = accounts.reduce(
    (acc, a) => ({
      beginning: acc.beginning + a.beginning_balance,
      contributions: acc.contributions + a.contributions,
      withdrawals: acc.withdrawals + a.withdrawals,
      mgmtFee: acc.mgmtFee + a.management_fee,
      perfFee: acc.perfFee + a.performance_fee,
      pnl: acc.pnl + a.allocated_pnl,
      ending: acc.ending + a.ending_balance,
    }),
    { beginning: 0, contributions: 0, withdrawals: 0, mgmtFee: 0, perfFee: 0, pnl: 0, ending: 0 }
  );

  // Group by partner for chart
  const partnerMap = new Map<string, { contributions: number; pnl: number; fees: number }>();
  accounts.forEach((a) => {
    const existing = partnerMap.get(a.partner_name) || { contributions: 0, pnl: 0, fees: 0 };
    existing.contributions += a.contributions;
    existing.pnl += a.allocated_pnl;
    existing.fees += a.management_fee + a.performance_fee;
    partnerMap.set(a.partner_name, existing);
  });
  const chartData = Array.from(partnerMap.entries()).map(([name, vals]) => ({
    partner: name,
    contributions: vals.contributions,
    pnl: vals.pnl,
    fees: Math.abs(vals.fees),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Capital Accounts</h1>
        <p className="text-sm text-gray-500 mt-1">Partner capital account statements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capital Composition by Partner</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="partner" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="contributions" name="Contributions" stackId="a" fill="#10b981" />
              <Bar dataKey="pnl" name="Income/Gain" stackId="a" fill="#6366f1" />
              <Bar dataKey="fees" name="Fees" stackId="a" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Capital Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Beginning Balance</TableHead>
                <TableHead className="text-right">Contributions</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Gain/Loss</TableHead>
                <TableHead className="text-right">Mgmt Fee</TableHead>
                <TableHead className="text-right">Perf Fee</TableHead>
                <TableHead className="text-right">Ending Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.partner_name}</TableCell>
                  <TableCell>{a.period_start} - {a.period_end}</TableCell>
                  <TableCell className="text-right">{formatCurrency(a.beginning_balance)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(a.contributions)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(a.allocated_pnl > 0 ? a.allocated_pnl : 0)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(a.withdrawals)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(a.allocated_pnl)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(a.management_fee)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(a.performance_fee)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(a.ending_balance)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-semibold">
                <TableCell>Total</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">{formatCurrency(totals.beginning)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.contributions)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.pnl > 0 ? totals.pnl : 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.withdrawals)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.pnl)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.mgmtFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.perfFee)}</TableCell>
                <TableCell className="text-right">{formatCurrency(totals.ending)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
