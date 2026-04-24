import { useState } from 'react';
import {
  Loader2,
  Search,
  BarChart3,
  CheckCircle2,
  Award,
  TrendingUp,
  Activity,
  Building2,
} from 'lucide-react';
import api from '@/lib/api';
import { formatPercent, formatCurrency, formatNumber } from '@/lib/format';
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

interface MonthlyReturn {
  period: string;
  beginning_nav: number;
  ending_nav: number;
  return: number;
}

interface TimeWeightedReturn {
  cumulative: number;
  annualized: number;
  three_year_annualized: number;
  data_points: number;
  method: string;
}

interface MoneyWeightedReturn {
  irr: number;
  method: string;
}

interface RiskStatistics {
  monthly_return_std_dev: number;
  annualized_std_dev: number;
  sharpe_ratio: number;
  max_drawdown: number;
}

interface CompositeStatistics {
  number_of_portfolios: number;
  composite_assets: number;
  firm_assets: number;
  pct_of_firm_assets: number;
  internal_dispersion: number;
}

interface GIPSResult {
  portfolio_id: number;
  portfolio_name: string;
  composite_name: string;
  inception_date: string;
  currency: string;
  as_of_date: string;
  gips_compliant: boolean;
  time_weighted_return: TimeWeightedReturn;
  money_weighted_return: MoneyWeightedReturn;
  monthly_returns: MonthlyReturn[];
  benchmark_comparison: unknown | null;
  excess_return: unknown | null;
  risk_statistics: RiskStatistics;
  composite_statistics: CompositeStatistics;
}

export default function GIPSCompositePage() {
  const [portfolioId, setPortfolioId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GIPSResult | null>(null);

  const handleFetch = async () => {
    if (!portfolioId.trim()) {
      toast.error('Please enter a portfolio ID');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<GIPSResult>(
        `/compliance/gips/${portfolioId.trim()}`
      );
      setResult(response.data);
    } catch {
      toast.error('Failed to load GIPS composite data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GIPS Performance Composites</h1>
        <p className="text-sm text-gray-500 mt-1">
          Global Investment Performance Standards composite reporting and compliance verification
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
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleFetch}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Load GIPS Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Composite Info + Compliance Badge */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span>
              Composite: <strong className="text-gray-900">{result.composite_name}</strong>
            </span>
            <span>
              Portfolio: <strong className="text-gray-900">{result.portfolio_name}</strong>
            </span>
            <span>
              Inception: <strong className="text-gray-900">{result.inception_date}</strong>
            </span>
            <span>
              Currency: <strong className="text-gray-900">{result.currency}</strong>
            </span>
            <span>
              As of: <strong className="text-gray-900">{result.as_of_date}</strong>
            </span>
            <Badge
              className={
                result.gips_compliant
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {result.gips_compliant ? 'GIPS Compliant' : 'Non-Compliant'}
            </Badge>
          </div>

          {/* Return Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">TWR Cumulative</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatPercent(result.time_weighted_return.cumulative)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{result.time_weighted_return.method}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">TWR Annualized</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatPercent(result.time_weighted_return.annualized)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  3Y Annualized: {formatPercent(result.time_weighted_return.three_year_annualized)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">MWR (IRR)</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatPercent(result.money_weighted_return.irr)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <Activity className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{result.money_weighted_return.method}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatNumber(result.risk_statistics.sharpe_ratio)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-cyan-50">
                    <Award className="w-5 h-5 text-cyan-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Max Drawdown: {formatPercent(result.risk_statistics.max_drawdown)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Composite Statistics + Risk Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-500" />
                  Composite Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Portfolios in Composite</span>
                    <span className="font-semibold">{result.composite_statistics.number_of_portfolios}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Composite Assets</span>
                    <span className="font-semibold">{formatCurrency(result.composite_statistics.composite_assets)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Firm Assets</span>
                    <span className="font-semibold">{formatCurrency(result.composite_statistics.firm_assets)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">% of Firm Assets</span>
                    <span className="font-semibold">{formatNumber(result.composite_statistics.pct_of_firm_assets)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Internal Dispersion</span>
                    <span className="font-semibold">{formatNumber(result.composite_statistics.internal_dispersion)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Risk Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Monthly Std Dev</span>
                    <span className="font-semibold">{formatNumber(result.risk_statistics.monthly_return_std_dev)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Annualized Std Dev</span>
                    <span className="font-semibold">{formatNumber(result.risk_statistics.annualized_std_dev)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Sharpe Ratio</span>
                    <span className="font-semibold">{formatNumber(result.risk_statistics.sharpe_ratio)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Max Drawdown</span>
                    <span className="font-semibold text-red-600">{formatPercent(result.risk_statistics.max_drawdown)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Returns Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Monthly Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Beginning NAV</TableHead>
                    <TableHead className="text-right">Ending NAV</TableHead>
                    <TableHead className="text-right">Return</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.monthly_returns.map((mr, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{mr.period}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(mr.beginning_nav, 4)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatNumber(mr.ending_nav, 4)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-sm font-semibold ${
                          mr.return >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatPercent(mr.return)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {result.monthly_returns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-400 py-4">
                        No monthly return data available
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
