import { useState } from 'react';
import {
  Loader2,
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ListChecks,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ComplianceResult {
  rule: string;
  category: string;
  limit: string;
  actual: string;
  status: string;
  severity: string;
  detail: string;
  asset: string | null;
  checked_at: string;
}

interface CheckResponse {
  portfolio_id: number;
  portfolio_name: string;
  check_date: string;
  total_market_value: number;
  nav: number;
  summary: {
    total_checks: number;
    passed: number;
    failed: number;
    compliance_status: string;
  };
  results: ComplianceResult[];
}

function getStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case 'PASS':
      return {
        className: 'bg-emerald-100 text-emerald-700',
        icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
      };
    case 'FAIL':
      return {
        className: 'bg-red-100 text-red-700',
        icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-700',
        icon: null,
      };
  }
}

function getSeverityBadge(severity: string) {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-700';
    case 'WARNING':
      return 'bg-yellow-100 text-yellow-700';
    case 'INFO':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getCategoryBadge(category: string) {
  switch (category.toUpperCase()) {
    case 'CONCENTRATION':
      return 'bg-purple-100 text-purple-700';
    case 'SECTOR_EXPOSURE':
      return 'bg-indigo-100 text-indigo-700';
    case 'LEVERAGE':
      return 'bg-blue-100 text-blue-700';
    case 'LIQUIDITY':
      return 'bg-cyan-100 text-cyan-700';
    case 'DIVERSIFICATION':
      return 'bg-teal-100 text-teal-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export default function RegulatoryCheckPage() {
  const [portfolioId, setPortfolioId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);

  const handleRunChecks = async () => {
    if (!portfolioId.trim()) {
      toast.error('Please enter a portfolio ID');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post<CheckResponse>('/compliance/regulatory-check', {
        portfolio_id: Number(portfolioId.trim()),
      });
      setResult(response.data);
    } catch {
      toast.error('Failed to run compliance checks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Regulatory Compliance Checks</h1>
        <p className="text-sm text-gray-500 mt-1">
          Run compliance rule checks against portfolio holdings and limits
        </p>
      </div>

      {/* Portfolio Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter Portfolio ID (e.g. 1, 2, 3)..."
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunChecks()}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleRunChecks}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Run Checks
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Checks</p>
                    <p className="text-2xl font-bold mt-1">
                      {result.summary.total_checks}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <ListChecks className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Passed</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-600">
                      {result.summary.passed}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      {result.summary.failed}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-bold mt-1">
                      <Badge
                        className={
                          result.summary.compliance_status === 'COMPLIANT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {result.summary.compliance_status}
                      </Badge>
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${result.summary.compliance_status === 'COMPLIANT' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {result.summary.compliance_status === 'COMPLIANT' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>
              Portfolio: <strong className="text-gray-900">{result.portfolio_name}</strong>
            </span>
            <span>
              Check Date: <strong className="text-gray-900">{result.check_date}</strong>
            </span>
            <span>
              Market Value: <strong className="text-gray-900">{formatCurrency(result.total_market_value)}</strong>
            </span>
            <span>
              NAV: <strong className="text-gray-900">{formatCurrency(result.nav)}</strong>
            </span>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Severity</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.results.map((r, idx) => {
                    const badge = getStatusBadge(r.status);
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{r.rule}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryBadge(r.category)}>
                            {r.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {r.asset || '--'}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {r.actual}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {r.limit}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${badge.className} flex items-center justify-center w-fit mx-auto`}>
                            {badge.icon}
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getSeverityBadge(r.severity)}>
                            {r.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs">
                          {r.detail}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {result.results.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-400 py-4">
                        No compliance results found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
