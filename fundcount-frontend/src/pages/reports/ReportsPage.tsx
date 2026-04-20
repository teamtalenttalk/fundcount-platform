import { useState, useEffect } from 'react';
import { Loader2, FileText, BarChart3, BookOpen, Users, TrendingUp, ArrowRightLeft } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SavedReport {
  id: number;
  name: string;
  type: string;
  format: string;
  created_at: string;
  status: string;
}

const reportCards = [
  { name: 'Portfolio Summary', description: 'Overview of all portfolio positions, NAV, and P&L', icon: FileText },
  { name: 'NAV Report', description: 'Net Asset Value calculations and breakdowns', icon: BarChart3 },
  { name: 'Trial Balance', description: 'Debit and credit balances for all accounts', icon: BookOpen },
  { name: 'Partner Capital Statement', description: 'Capital account activity by partner', icon: Users },
  { name: 'Performance Report', description: 'Returns, risk metrics, and benchmark comparison', icon: TrendingUp },
  { name: 'Trade Activity Report', description: 'Trade history with commissions and settlements', icon: ArrowRightLeft },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/reports');
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setReports(data);
      } catch {
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerate = async (reportName: string) => {
    try {
      await api.post('/reports', { name: reportName, format: 'pdf' });
      const response = await api.get('/reports');
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setReports(data);
    } catch {
      // Silent fail - report generation is async
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and manage fund reports</p>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.name}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{report.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{report.description}</p>
                  <Button variant="outline" size="sm" onClick={() => handleGenerate(report.name)}>
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="capitalize">{r.type}</TableCell>
                    <TableCell className="uppercase">{r.format}</TableCell>
                    <TableCell>{formatDate(r.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'ready' ? 'default' : 'secondary'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
