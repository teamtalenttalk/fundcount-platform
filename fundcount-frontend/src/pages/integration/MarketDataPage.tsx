import { useState, useEffect } from 'react';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Activity,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Exchange {
  name: string;
  status: string;
  latency_ms: number;
  instruments: number;
  last_update: string;
}

interface Feed {
  symbol: string;
  name: string;
  asset_class: string;
  price: number;
  change_pct: number;
  bid: number;
  ask: number;
  volume: number;
  source: string;
  quality: string;
  last_update: string;
}

interface QualityMetrics {
  total_instruments: number;
  good_quality: number;
  stale: number;
  missing: number;
  avg_latency_ms: number;
  uptime_pct: number;
  last_health_check: string;
}

interface MarketDataResult {
  exchanges: Exchange[];
  feeds: Feed[];
  quality_metrics: QualityMetrics;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'CONNECTED': return 'bg-emerald-100 text-emerald-700';
    case 'DEGRADED': return 'bg-yellow-100 text-yellow-700';
    case 'DISCONNECTED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getQualityColor(quality: string) {
  return quality === 'GOOD' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
}

export default function MarketDataPage() {
  const [data, setData] = useState<MarketDataResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<MarketDataResult>('/integration/market-data');
      setData(response.data);
    } catch {
      toast.error('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!data) return null;

  const qm = data.quality_metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Data Feeds</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time market data integration, exchange connections, and data quality monitoring
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Instruments</p>
                <p className="text-2xl font-bold mt-1">{qm.total_instruments}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Good Quality</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{qm.good_quality}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <Wifi className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stale/Missing</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{qm.stale + qm.missing}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50">
                <WifiOff className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold mt-1">{qm.avg_latency_ms}ms</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-emerald-500" />
            Exchange Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {data.exchanges.map((ex) => (
              <div key={ex.name} className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">{ex.name}</span>
                  <Badge className={getStatusColor(ex.status)}>{ex.status}</Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>Latency: <span className="font-mono">{ex.latency_ms}ms</span></p>
                  <p>Instruments: {ex.instruments.toLocaleString()}</p>
                  <p>Updated: {new Date(ex.last_update).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Live Price Feeds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Bid</TableHead>
                <TableHead className="text-right">Ask</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-center">Quality</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.feeds.map((f) => (
                <TableRow key={f.symbol}>
                  <TableCell className="font-mono font-bold">{f.symbol}</TableCell>
                  <TableCell className="text-sm">{f.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{f.asset_class}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(f.price)}</TableCell>
                  <TableCell className={`text-right font-mono font-medium ${f.change_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span className="inline-flex items-center gap-1">
                      {f.change_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {f.change_pct >= 0 ? '+' : ''}{f.change_pct.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(f.bid)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(f.ask)}</TableCell>
                  <TableCell className="text-right text-sm">{f.volume.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{f.source}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getQualityColor(f.quality)}>{f.quality}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
