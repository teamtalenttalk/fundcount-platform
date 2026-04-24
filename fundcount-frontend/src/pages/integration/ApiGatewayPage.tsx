import { useState, useEffect } from 'react';
import {
  Loader2,
  Globe,
  Key,
  Webhook,
  BarChart3,
  Activity,
  Shield,
  RefreshCw,
  Copy,
} from 'lucide-react';
import api from '@/lib/api';
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
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  category: string;
  rate_limit: string;
  avg_response_ms: number;
}

interface WebhookEntry {
  id: number;
  url: string;
  events: string[];
  status: string;
  last_triggered: string;
  success_rate: number;
}

interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  permissions: string[];
  created: string;
  last_used: string;
  status: string;
  requests_today: number;
}

interface DailyStat {
  date: string;
  requests: number;
  errors: number;
  avg_latency_ms: number;
}

interface Usage {
  daily_stats: DailyStat[];
  total_requests_today: number;
  total_requests_month: number;
  error_rate: number;
  avg_latency_ms: number;
  uptime_pct: number;
}

interface ApiGatewayData {
  endpoints: Endpoint[];
  webhooks: WebhookEntry[];
  api_keys: ApiKey[];
  usage: Usage;
}

function getMethodColor(method: string) {
  switch (method) {
    case 'GET': return 'bg-emerald-100 text-emerald-700';
    case 'POST': return 'bg-blue-100 text-blue-700';
    case 'PUT': return 'bg-yellow-100 text-yellow-700';
    case 'DELETE': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getWebhookStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
    case 'PAUSED': return 'bg-yellow-100 text-yellow-700';
    case 'FAILED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function ApiGatewayPage() {
  const [data, setData] = useState<ApiGatewayData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiGatewayData>('/integration/api-gateway');
      setData(response.data);
    } catch {
      toast.error('Failed to load API gateway data');
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

  const u = data.usage;
  const categories = [...new Set(data.endpoints.map(e => e.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Gateway & Developer Platform</h1>
          <p className="text-sm text-gray-500 mt-1">
            REST API documentation, webhooks, API keys, and usage analytics
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Requests Today</p>
            <p className="text-xl font-bold mt-1">{u.total_requests_today.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Monthly Total</p>
            <p className="text-xl font-bold mt-1">{u.total_requests_month.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Error Rate</p>
            <p className="text-xl font-bold mt-1 text-yellow-600">{u.error_rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Avg Latency</p>
            <p className="text-xl font-bold mt-1">{u.avg_latency_ms}ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">{u.uptime_pct}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            API Traffic (30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={u.daily_stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="requests" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} name="Requests" />
                <Area type="monotone" dataKey="errors" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={1.5} name="Errors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.map((cat) => (
            <div key={cat} className="mb-4 last:mb-0">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">{cat}</h4>
              <div className="space-y-1">
                {data.endpoints.filter(e => e.category === cat).map((ep) => (
                  <div key={ep.path + ep.method} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getMethodColor(ep.method)} font-mono text-xs w-14 justify-center`}>{ep.method}</Badge>
                      <code className="text-sm font-mono text-gray-800">{ep.path}</code>
                      <span className="text-xs text-gray-400">{ep.description}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="font-mono">{ep.rate_limit}</span>
                      <span className="font-mono">{ep.avg_response_ms}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-yellow-500" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.api_keys.map((key) => (
                <div key={key.id} className="p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{key.name}</h4>
                    <Badge className="bg-emerald-100 text-emerald-700">{key.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">{key.prefix}</code>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toast.info('Key copied to clipboard')}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {key.permissions.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Created: {key.created}</span>
                    <span>{key.requests_today.toLocaleString()} requests today</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-blue-500" />
              Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.webhooks.map((wh) => (
                <div key={wh.id} className="p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono text-gray-700 break-all">{wh.url}</code>
                    <Badge className={getWebhookStatusColor(wh.status)}>{wh.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {wh.events.map((ev) => (
                      <Badge key={ev} variant="outline" className="text-xs">{ev}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Success rate: <span className="text-emerald-600 font-medium">{wh.success_rate}%</span></span>
                    <span>Last triggered: {new Date(wh.last_triggered).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
