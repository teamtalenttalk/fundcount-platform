import { useState, useEffect } from 'react';
import {
  Loader2,
  Server,
  Activity,
  AlertTriangle,
  Settings,
  History,
  RefreshCw,
  Cpu,
  HardDrive,
  MemoryStick,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
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

interface SystemHealth {
  status: string;
  uptime_pct: number;
  uptime_since: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  avg_response_ms: number;
  error_rate_24h: number;
}

interface Service {
  name: string;
  status: string;
  version: string;
  uptime: string;
  last_deploy: string;
}

interface Alert {
  id: number;
  severity: string;
  message: string;
  service: string;
  timestamp: string;
  acknowledged: boolean;
}

interface GlobalConfig {
  key: string;
  value: string;
  category: string;
  description: string;
}

interface ActivityEntry {
  timestamp: string;
  user: string;
  action: string;
  ip: string;
}

interface AdminPanelData {
  system_health: SystemHealth;
  services: Service[];
  alerts: Alert[];
  global_config: GlobalConfig[];
  activity_log: ActivityEntry[];
}

function getHealthStatusColor(status: string) {
  switch (status) {
    case 'HEALTHY': return 'bg-emerald-100 text-emerald-700';
    case 'DEGRADED': return 'bg-yellow-100 text-yellow-700';
    case 'DOWN': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getServiceStatusColor(status: string) {
  switch (status) {
    case 'RUNNING': return 'bg-emerald-100 text-emerald-700';
    case 'DEGRADED': return 'bg-yellow-100 text-yellow-700';
    case 'STOPPED': return 'bg-red-100 text-red-700';
    case 'MAINTENANCE': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-100 text-red-700';
    case 'WARNING': return 'bg-yellow-100 text-yellow-700';
    case 'INFO': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getUsageColor(pct: number) {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

function getUsageTextColor(pct: number) {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 70) return 'text-yellow-600';
  return 'text-emerald-600';
}

export default function AdminPanelPage() {
  const [data, setData] = useState<AdminPanelData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<AdminPanelData>('/enterprise/admin-panel');
      setData(response.data);
    } catch {
      toast.error('Failed to load admin panel data');
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

  const h = data.system_health;
  const unacknowledgedAlerts = data.alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">
            System health monitoring, service management, alerts, and configuration
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">System Status</p>
                <div className="mt-1">
                  <Badge className={getHealthStatusColor(h.status)}>{h.status}</Badge>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-xl font-bold mt-1 text-emerald-600">{h.uptime_pct}%</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <Clock className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Response</p>
                <p className="text-xl font-bold mt-1">{h.avg_response_ms}ms</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Connections</p>
                <p className="text-xl font-bold mt-1">{h.active_connections}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50">
                <Server className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Cpu className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">CPU Usage</p>
                  <span className={`text-sm font-semibold ${getUsageTextColor(h.cpu_usage)}`}>{h.cpu_usage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${getUsageColor(h.cpu_usage)}`} style={{ width: `${h.cpu_usage}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <MemoryStick className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Memory Usage</p>
                  <span className={`text-sm font-semibold ${getUsageTextColor(h.memory_usage)}`}>{h.memory_usage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${getUsageColor(h.memory_usage)}`} style={{ width: `${h.memory_usage}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50">
                <HardDrive className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">Disk Usage</p>
                  <span className={`text-sm font-semibold ${getUsageTextColor(h.disk_usage)}`}>{h.disk_usage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${getUsageColor(h.disk_usage)}`} style={{ width: `${h.disk_usage}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-500" />
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Last Deploy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.services.map((svc) => (
                  <TableRow key={svc.name}>
                    <TableCell className="font-medium text-gray-900">{svc.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getServiceStatusColor(svc.status)}>{svc.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">{svc.version}</TableCell>
                    <TableCell className="text-sm text-gray-600">{svc.uptime}</TableCell>
                    <TableCell className="text-sm text-gray-500">{svc.last_deploy}</TableCell>
                  </TableRow>
                ))}
                {data.services.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-4">
                      No services found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-500" />
                Alerts
              </CardTitle>
              {unacknowledgedAlerts > 0 && (
                <Badge className="bg-red-100 text-red-700">{unacknowledgedAlerts} unacknowledged</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.alerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${alert.acknowledged ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200'} hover:shadow-sm transition-shadow`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      <span className="text-xs text-gray-400">{alert.service}</span>
                    </div>
                    {alert.acknowledged ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              ))}
              {data.alerts.length === 0 && (
                <p className="text-center text-gray-400 py-4">No alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Global Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.global_config.map((cfg) => (
                <TableRow key={cfg.key}>
                  <TableCell className="font-mono text-sm font-medium text-gray-900">{cfg.key}</TableCell>
                  <TableCell className="font-mono text-sm text-emerald-700">{cfg.value}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{cfg.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{cfg.description}</TableCell>
                </TableRow>
              ))}
              {data.global_config.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-4">
                    No configuration entries
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.activity_log.map((entry, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-sm text-gray-500 font-mono whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{entry.user}</TableCell>
                  <TableCell className="text-sm text-gray-600">{entry.action}</TableCell>
                  <TableCell className="font-mono text-sm text-gray-500">{entry.ip}</TableCell>
                </TableRow>
              ))}
              {data.activity_log.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-4">
                    No recent activity
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
