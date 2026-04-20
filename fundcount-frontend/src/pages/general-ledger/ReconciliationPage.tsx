import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  discrepancy: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  discrepancy: 'Discrepancy',
};

interface Reconciliation {
  id: number;
  account_name: string;
  account_code: string;
  period_start: string;
  period_end: string;
  book_balance: number;
  bank_balance: number;
  difference: number;
  status: string;
  reconciled_date: string | null;
}

const PLACEHOLDER_DATA: Reconciliation[] = [
  {
    id: 1,
    account_name: 'Operating Cash Account',
    account_code: '1010',
    period_start: '2026-03-01',
    period_end: '2026-03-31',
    book_balance: 1250000,
    bank_balance: 1250000,
    difference: 0,
    status: 'completed',
    reconciled_date: '2026-04-05',
  },
  {
    id: 2,
    account_name: 'Investment Cash Account',
    account_code: '1020',
    period_start: '2026-03-01',
    period_end: '2026-03-31',
    book_balance: 5430000,
    bank_balance: 5428500,
    difference: 1500,
    status: 'discrepancy',
    reconciled_date: null,
  },
  {
    id: 3,
    account_name: 'Margin Account',
    account_code: '1030',
    period_start: '2026-04-01',
    period_end: '2026-04-30',
    book_balance: 890000,
    bank_balance: 890000,
    difference: 0,
    status: 'in_progress',
    reconciled_date: null,
  },
  {
    id: 4,
    account_name: 'Payroll Account',
    account_code: '1040',
    period_start: '2026-04-01',
    period_end: '2026-04-30',
    book_balance: 320000,
    bank_balance: 0,
    difference: 320000,
    status: 'pending',
    reconciled_date: null,
  },
];

export default function ReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [usePlaceholder, setUsePlaceholder] = useState(false);

  useEffect(() => {
    const fetchReconciliations = async () => {
      try {
        const response = await api.get('/reconciliations');
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setReconciliations(data);
      } catch {
        // Endpoint may not exist; use placeholder data
        setReconciliations(PLACEHOLDER_DATA);
        setUsePlaceholder(true);
      } finally {
        setLoading(false);
      }
    };
    fetchReconciliations();
  }, []);

  const statusCounts = reconciliations.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reconciliation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Account reconciliation status and details
          {usePlaceholder && (
            <span className="ml-2 text-xs text-amber-600">(showing sample data)</span>
          )}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{statusCounts[status] || 0}</p>
                </div>
                <div className={`p-3 rounded-xl ${
                  status === 'pending' ? 'bg-yellow-50' :
                  status === 'in_progress' ? 'bg-blue-50' :
                  status === 'completed' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'pending' ? 'bg-yellow-500' :
                    status === 'in_progress' ? 'bg-blue-500' :
                    status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Period Start</TableHead>
                <TableHead>Period End</TableHead>
                <TableHead className="text-right">Book Balance</TableHead>
                <TableHead className="text-right">Bank Balance</TableHead>
                <TableHead className="text-right">Difference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reconciled Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No reconciliation records found
                  </TableCell>
                </TableRow>
              ) : (
                reconciliations.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rec.account_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{rec.account_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(rec.period_start)}</TableCell>
                    <TableCell>{formatDate(rec.period_end)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(rec.book_balance)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(rec.bank_balance)}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${rec.difference !== 0 ? 'text-red-600 font-medium' : ''}`}>
                      {formatCurrency(rec.difference)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_COLORS[rec.status] || 'bg-gray-100 text-gray-800'}>
                        {STATUS_LABELS[rec.status] || rec.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rec.reconciled_date ? formatDate(rec.reconciled_date) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
