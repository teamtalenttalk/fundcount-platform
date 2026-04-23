import { useState } from 'react';
import {
  Loader2,
  TrendingUp,
  Activity,
  DollarSign,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
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

interface NavPrediction {
  date: string;
  predicted_nav: number;
  upper_bound: number;
  lower_bound: number;
}

interface MarketSignal {
  indicator: string;
  signal: string;
  strength: number;
}

interface CashFlowForecast {
  avg_monthly_volume: number;
  projected_inflows: number;
  projected_outflows: number;
  net_flow: number;
}

interface PredictionResult {
  portfolio_id: number;
  portfolio_name: string;
  period: string;
  period_days: number;
  generated_at: string;
  predicted_return: number;
  confidence_interval: {
    low: number;
    high: number;
    confidence_level: string;
  };
  predicted_nav_series: NavPrediction[];
  market_signals: MarketSignal[];
  cash_flow_forecast: CashFlowForecast;
  risk_trend: string;
}

const PERIODS = [
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
];

function getSignalColor(signal: string) {
  const s = signal.toUpperCase();
  if (s.includes('UP') || s.includes('BULL')) return 'bg-emerald-100 text-emerald-700';
  if (s.includes('DOWN') || s.includes('BEAR')) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

export default function PredictionsPage() {
  const [portfolioId, setPortfolioId] = useState('');
  const [period, setPeriod] = useState('90d');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handlePredict = async () => {
    if (!portfolioId.trim()) {
      toast.error('Please enter a portfolio ID');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post<PredictionResult>('/ai/predictions', {
        portfolio_id: portfolioId.trim(),
        period,
      });
      setResult(response.data);
    } catch {
      toast.error('Failed to generate predictions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Predictive Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered NAV forecasts, return predictions, and market signals
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Enter Portfolio ID (e.g. 1, 2, 3)..."
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePredict()}
              />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    period === p.value
                      ? 'bg-white text-gray-900 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button
              onClick={handlePredict}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Predict
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Predicted Return Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Predicted Return ({result.period})
                  </p>
                  <p
                    className={`text-3xl font-bold mt-1 ${
                      result.predicted_return >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatPercent(result.predicted_return)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {result.confidence_interval.confidence_level} Confidence:{' '}
                    {formatPercent(result.confidence_interval.low)} to{' '}
                    {formatPercent(result.confidence_interval.high)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50">
                  <Activity className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NAV Prediction Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Predicted NAV Trajectory</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={result.predicted_nav_series}>
                  <defs>
                    <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="predictedFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    tickFormatter={(v) =>
                      `$${(v / 1_000_000).toFixed(0)}M`
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="upper_bound"
                    name="Upper Bound"
                    stroke="#10b981"
                    strokeWidth={0}
                    fill="url(#confidenceBand)"
                    strokeDasharray="4 4"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower_bound"
                    name="Lower Bound"
                    stroke="#10b981"
                    strokeWidth={0}
                    fill="transparent"
                    strokeDasharray="4 4"
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted_nav"
                    name="Predicted NAV"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#predictedFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Signals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Market Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Indicator</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead className="text-right">Strength</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.market_signals.map((s) => (
                      <TableRow key={s.indicator}>
                        <TableCell className="font-medium text-sm">
                          {s.indicator}
                        </TableCell>
                        <TableCell>
                          <Badge className={getSignalColor(s.signal)}>
                            {s.signal}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-mono">
                          {s.strength.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Cash Flow Forecast */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  Cash Flow Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600">Avg Monthly Volume</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(result.cash_flow_forecast.avg_monthly_volume)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600">Projected Inflows</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(result.cash_flow_forecast.projected_inflows)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600">Projected Outflows</span>
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(result.cash_flow_forecast.projected_outflows)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-900">Net Flow</span>
                    <span
                      className={`text-lg font-bold ${
                        result.cash_flow_forecast.net_flow >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(result.cash_flow_forecast.net_flow)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Risk Trend</span>
                    <Badge
                      className={
                        result.risk_trend === 'improving'
                          ? 'bg-emerald-100 text-emerald-700'
                          : result.risk_trend === 'declining'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }
                    >
                      {result.risk_trend}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
