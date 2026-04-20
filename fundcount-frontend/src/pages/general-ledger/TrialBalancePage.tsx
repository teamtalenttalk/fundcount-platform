import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const TYPE_COLORS: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-800',
  liability: 'bg-red-100 text-red-800',
  equity: 'bg-purple-100 text-purple-800',
  revenue: 'bg-green-100 text-green-800',
  expense: 'bg-orange-100 text-orange-800',
};

interface TrialBalanceRow {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  debit_total: number;
  credit_total: number;
}

export default function TrialBalancePage() {
  const [rows, setRows] = useState<TrialBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrialBalance = async () => {
      try {
        const response = await api.get('/trial-balance');
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setRows(data);
      } catch {
        setError('Failed to load trial balance');
      } finally {
        setLoading(false);
      }
    };
    fetchTrialBalance();
  }, []);

  const totalDebits = rows.reduce((sum, r) => sum + (r.debit_total || 0), 0);
  const totalCredits = rows.reduce((sum, r) => sum + (r.credit_total || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
          <p className="text-sm text-gray-500 mt-1">Summary of all account balances</p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isBalanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {isBalanced ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium text-sm">
            {isBalanced ? 'Balanced' : 'Unbalanced'}
          </span>
          {!isBalanced && (
            <span className="text-xs ml-1">
              (Diff: {formatCurrency(Math.abs(totalDebits - totalCredits))})
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Debits</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalDebits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Credits</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalCredits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Accounts</p>
            <p className="text-2xl font-bold mt-1">{rows.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Debit Total</TableHead>
                <TableHead className="text-right">Credit Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No trial balance data available
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.account_id}>
                    <TableCell className="font-mono text-sm">{row.account_code}</TableCell>
                    <TableCell className="font-medium">{row.account_name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[row.account_type] || 'bg-gray-100 text-gray-800'}`}>
                        {row.account_type?.toUpperCase() || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.debit_total > 0 ? formatCurrency(row.debit_total) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.credit_total > 0 ? formatCurrency(row.credit_total) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {rows.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="font-bold">Totals</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatCurrency(totalDebits)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatCurrency(totalCredits)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
