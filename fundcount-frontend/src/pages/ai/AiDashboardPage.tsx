import { useState, useEffect } from 'react';
import {
  Brain,
  AlertTriangle,
  FileCheck,
  FileText,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface InsightItem {
  type: string;
  severity: string;
  portfolio: string;
  message: string;
  date: string;
}

interface PortfolioHealthScore {
  portfolio_id: number;
  name: string;
  score: number;
  trend: string;
  total_value: number;
}

interface MarketPulse {
  sentiment: string;
  vix: number;
  trend: string;
  avg_recent_return: number;
}

interface AiDashboardData {
  overview: {
    total_insights: number;
    risk_alerts: number;
    pending_reconciliations: number;
    documents_processed: number;
  };
  recent_insights: InsightItem[];
  risk_alerts: InsightItem[];
  portfolio_health_scores: PortfolioHealthScore[];
  market_pulse: MarketPulse;
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'warning':
      return 'bg-yellow-100 text-yellow-700';
    case 'info':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getHealthColor(score: number) {
  if (score > 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getHealthTextColor(score: number) {
  if (score > 75) return 'text-emerald-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    case 'declining':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-yellow-500" />;
  }
}

function getSentimentIcon(sentiment: string) {
  switch (sentiment) {
    case 'bullish':
      return <TrendingUp className="w-6 h-6 text-emerald-500" />;
    case 'bearish':
      return <TrendingDown className="w-6 h-6 text-red-500" />;
    default:
      return <Minus className="w-6 h-6 text-yellow-500" />;
  }
}

function getSentimentColor(sentiment: string) {
  switch (sentiment) {
    case 'bullish':
      return 'text-emerald-600';
    case 'bearish':
      return 'text-red-600';
    default:
      return 'text-yellow-600';
  }
}

function formatValue(val: number) {
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val}`;
}

export default function AiDashboardPage() {
  const [data, setData] = useState<AiDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<AiDashboardData>('/ai/dashboard');
        setData(response.data);
      } catch {
        toast.error('Failed to load AI dashboard data');
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

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">No data available</p>
      </div>
    );
  }

  const overview = data.overview;

  const statCards = [
    {
      label: 'Total Insights',
      value: overview.total_insights.toString(),
      icon: Brain,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Risk Alerts',
      value: overview.risk_alerts.toString(),
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Pending Reconciliations',
      value: overview.pending_reconciliations.toString(),
      icon: FileCheck,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Documents Processed',
      value: overview.documents_processed.toString(),
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
  ];

  const allInsights = [
    ...data.risk_alerts.map((a) => ({ ...a, _kind: 'alert' as const })),
    ...data.recent_insights.map((i) => ({ ...i, _kind: 'insight' as const })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Intelligence Hub</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered insights, risk analysis, and portfolio intelligence
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Health Scores */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Health Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.portfolio_health_scores.map((p) => (
                <div key={p.portfolio_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{p.name}</span>
                      {getTrendIcon(p.trend)}
                      <span className="text-xs text-gray-400">
                        {formatValue(p.total_value)}
                      </span>
                    </div>
                    <span className={`font-semibold ${getHealthTextColor(p.score)}`}>
                      {p.score}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${getHealthColor(p.score)}`}
                      style={{ width: `${Math.min(p.score, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {data.portfolio_health_scores.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No portfolio health data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Market Pulse */}
        <Card>
          <CardHeader>
            <CardTitle>Market Pulse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-4 rounded-full bg-gray-50">
                {getSentimentIcon(data.market_pulse.sentiment)}
              </div>
              <div>
                <p
                  className={`text-lg font-bold capitalize ${getSentimentColor(data.market_pulse.sentiment)}`}
                >
                  {data.market_pulse.sentiment}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  VIX: {data.market_pulse.vix}
                </p>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  Trend:{' '}
                  <span className="font-medium capitalize">
                    {data.market_pulse.trend}
                  </span>
                </p>
                <p>
                  Avg Return:{' '}
                  <span className="font-medium">
                    {data.market_pulse.avg_recent_return.toFixed(2)}%
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Insights & Risk Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Risk Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allInsights.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {item.type.replace(/_/g, ' ')}
                    </h4>
                    <Badge className={getSeverityColor(item.severity)}>
                      {item.severity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.portfolio}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{item.message}</p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                  {item.date}
                </div>
              </div>
            ))}
            {allInsights.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No recent insights or alerts
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
