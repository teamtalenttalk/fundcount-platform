import { useState } from 'react';
import {
  Loader2,
  Search,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  Target,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '@/lib/api';
import { formatPercent } from '@/lib/format';
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

interface SectorConcentration {
  sector: string;
  market_value: number;
  weight: number;
  position_count: number;
}

interface VolatilityMetrics {
  daily_volatility: number;
  annualized_volatility: number;
  avg_daily_return: number;
  data_points: number;
}

interface RebalanceSuggestion {
  asset_class: string;
  current_weight: number;
  target_weight: number;
  action: string;
  reason: string;
}

interface AnalysisResult {
  portfolio_id: number;
  portfolio_name: string;
  analysis_date: string;
  risk_score: number;
  risk_level: string;
  sector_concentration: SectorConcentration[];
  volatility_metrics: VolatilityMetrics;
  sharpe_ratio: number;
  max_drawdown: number;
  diversification_score: number;
  rebalancing_suggestions: RebalanceSuggestion[];
  anomalies: Array<{ type: string; message: string; severity: string }>;
}

const PIE_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
  '#6366f1',
];

function getActionBadgeClass(action: string) {
  switch (action) {
    case 'INCREASE':
      return 'bg-emerald-100 text-emerald-700';
    case 'REDUCE':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getRiskColor(score: number) {
  if (score <= 30) return '#10b981';
  if (score <= 60) return '#f59e0b';
  return '#ef4444';
}

export default function PortfolioAnalysisPage() {
  const [portfolioId, setPortfolioId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!portfolioId.trim()) {
      toast.error('Please enter a portfolio ID');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post<AnalysisResult>('/ai/portfolio-analysis', {
        portfolio_id: portfolioId.trim(),
      });
      setResult(response.data);
    } catch {
      toast.error('Failed to analyze portfolio');
    } finally {
      setLoading(false);
    }
  };

  const riskScore = result?.risk_score ?? 0;
  const riskAngle = (riskScore / 100) * 180;
  const riskColor = getRiskColor(riskScore);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Portfolio Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">
          Deep AI-driven risk analysis, concentration checks, and rebalancing suggestions
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
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Risk Gauge + Risk Metrics + Diversification */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Gauge */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  Risk Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <svg viewBox="0 0 200 120" className="w-48 h-28">
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke={riskColor}
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={`${(riskAngle / 180) * 251.2} 251.2`}
                    />
                    <line
                      x1="100"
                      y1="100"
                      x2={100 + 60 * Math.cos(Math.PI - (riskAngle * Math.PI) / 180)}
                      y2={100 - 60 * Math.sin(Math.PI - (riskAngle * Math.PI) / 180)}
                      stroke="#374151"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="100" cy="100" r="4" fill="#374151" />
                    <text
                      x="100"
                      y="90"
                      textAnchor="middle"
                      className="text-2xl font-bold"
                      fill="#111827"
                      fontSize="24"
                    >
                      {riskScore}
                    </text>
                  </svg>
                  <p className="text-sm font-medium mt-2" style={{ color: riskColor }}>
                    {result.risk_level} Risk
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Risk Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Risk Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Daily Volatility', value: formatPercent(result.volatility_metrics.daily_volatility) },
                    { label: 'Annualized Volatility', value: formatPercent(result.volatility_metrics.annualized_volatility) },
                    { label: 'Sharpe Ratio', value: result.sharpe_ratio.toFixed(2) },
                    { label: 'Max Drawdown', value: formatPercent(result.max_drawdown) },
                    { label: 'Avg Daily Return', value: formatPercent(result.volatility_metrics.avg_daily_return) },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-sm text-gray-600">{metric.label}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Diversification Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Diversification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(result.diversification_score / 100) * 251.2} 251.2`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {result.diversification_score.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">Diversification Score</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sector Concentration Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sector Concentration</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={result.sector_concentration}
                    dataKey="weight"
                    nameKey="sector"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ sector, weight }: { sector: string; weight: number }) =>
                      `${sector}: ${weight.toFixed(1)}%`
                    }
                  >
                    {result.sector_concentration.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rebalancing Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Rebalancing Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Class</TableHead>
                    <TableHead className="text-right">Current Weight</TableHead>
                    <TableHead className="text-right">Target Weight</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rebalancing_suggestions.map((s) => (
                    <TableRow key={s.asset_class}>
                      <TableCell className="font-medium">{s.asset_class}</TableCell>
                      <TableCell className="text-right">
                        {formatPercent(s.current_weight)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(s.target_weight)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getActionBadgeClass(s.action)}>
                          {s.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs">
                        {s.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Anomalies */}
          {result.anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Detected Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.anomalies.map((a, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border border-gray-100"
                    >
                      <Badge className="bg-yellow-100 text-yellow-700">
                        {a.type}
                      </Badge>
                      <p className="text-sm text-gray-700">{a.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
