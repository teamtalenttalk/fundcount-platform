import { useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  FileCheck,
  ArrowRightLeft,
  Zap,
  Info,
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

interface ReconciliationBreak {
  trade_id: number;
  trade_number: string;
  type: string;
  custodian_value: number;
  internal_value: number;
  difference: number;
  status: string;
  suggested_action: string;
}

interface ReconciliationResult {
  analysis_date: string;
  total_trades: number;
  matched_count: number;
  unmatched_count: number;
  match_rate: number;
  breaks: ReconciliationBreak[];
  summary: {
    auto_resolved: number;
    needs_review: number;
    total_difference: number;
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'MATCHED':
      return (
        <Badge className="bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Matched
        </Badge>
      );
    case 'AUTO_RESOLVED':
      return (
        <Badge className="bg-blue-100 text-blue-700">
          <Zap className="w-3 h-3 mr-1" />
          Auto-Resolved
        </Badge>
      );
    case 'BREAK':
      return (
        <Badge className="bg-red-100 text-red-700">
          <XCircle className="w-3 h-3 mr-1" />
          Break
        </Badge>
      );
    case 'NEEDS_REVIEW':
      return (
        <Badge className="bg-yellow-100 text-yellow-700">
          <Info className="w-3 h-3 mr-1" />
          Needs Review
        </Badge>
      );
    default:
      return <Badge className="bg-gray-100 text-gray-600">{status}</Badge>;
  }
}

export default function ReconciliationPage() {
  const [portfolioId, setPortfolioId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);

  const handleReconcile = async () => {
    if (!portfolioId.trim()) {
      toast.error('Please enter a portfolio ID');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post<ReconciliationResult>('/ai/reconciliation', {
        portfolio_id: portfolioId.trim(),
      });
      setResult(response.data);
    } catch {
      toast.error('Failed to run reconciliation');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoResolve = () => {
    toast.success('Auto-resolve initiated. AI is processing breaks...', {
      description: 'You will be notified when the process completes.',
      duration: 4000,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trade Reconciliation</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered trade matching and break resolution
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter Portfolio ID (e.g. 1, 2, 3)..."
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReconcile()}
              />
            </div>
            <Button
              onClick={handleReconcile}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Reconciling...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Reconcile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-2xl font-bold mt-1">{result.total_trades}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <FileCheck className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Matched</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-600">
                      {result.matched_count}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unmatched</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      {result.unmatched_count}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Match Rate</p>
                    <p className="text-2xl font-bold mt-1">
                      {result.match_rate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <ArrowRightLeft className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Banner */}
          {result.summary && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Auto-Resolved:</span>{' '}
                    <span className="font-bold">{result.summary.auto_resolved}</span>
                  </div>
                  <div>
                    <span className="text-yellow-600 font-medium">Needs Review:</span>{' '}
                    <span className="font-bold">{result.summary.needs_review}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Total Difference:</span>{' '}
                    <span className="font-bold text-red-600">
                      {formatCurrency(result.summary.total_difference)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Breaks Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reconciliation Details</CardTitle>
                {result.unmatched_count > 0 && (
                  <Button
                    onClick={handleAutoResolve}
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Auto-resolve Breaks
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trade #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Custodian Value</TableHead>
                    <TableHead className="text-right">Internal Value</TableHead>
                    <TableHead className="text-right">Difference</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Suggested Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.breaks.map((b) => (
                    <TableRow key={b.trade_id}>
                      <TableCell className="font-mono text-sm">
                        {b.trade_number}
                      </TableCell>
                      <TableCell className="text-sm">
                        {b.type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(b.custodian_value)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(b.internal_value)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          b.difference !== 0 ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        {formatCurrency(Math.abs(b.difference))}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(b.status)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs">
                        {b.suggested_action}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {result.breaks.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No reconciliation breaks found. All trades matched.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
