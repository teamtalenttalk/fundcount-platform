import { useState, useEffect } from 'react';
import {
  Loader2,
  Building2,
  Users,
  DollarSign,
  Globe,
  HardDrive,
  Activity,
  RefreshCw,
  Briefcase,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TenantBranding {
  primary_color: string;
  logo: string;
}

interface Tenant {
  id: number;
  name: string;
  domain: string;
  status: string;
  plan: string;
  users: number;
  funds: number;
  aum: number;
  created_at: string;
  last_login: string;
  branding: TenantBranding;
  storage_used_gb: number;
  api_calls_month: number;
}

interface TenantSummary {
  total_tenants: number;
  active: number;
  trial: number;
  suspended: number;
  total_users: number;
  total_aum: number;
  total_funds: number;
  total_storage_gb: number;
}

interface TenantsData {
  tenants: Tenant[];
  summary: TenantSummary;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
    case 'TRIAL': return 'bg-blue-100 text-blue-700';
    case 'SUSPENDED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getPlanColor(plan: string) {
  switch (plan) {
    case 'Enterprise': return 'bg-purple-100 text-purple-700';
    case 'Professional': return 'bg-blue-100 text-blue-700';
    case 'Starter': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function TenantsPage() {
  const [data, setData] = useState<TenantsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<TenantsData>('/enterprise/tenants');
      setData(response.data);
    } catch {
      toast.error('Failed to load tenants data');
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

  const s = data.summary;

  const statCards = [
    { label: 'Total Tenants', value: s.total_tenants.toString(), icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Active', value: s.active.toString(), icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Users', value: s.total_users.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total AUM', value: formatCurrency(s.total_aum), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enterprise multi-tenant overview, usage metrics, and account management
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Trial</p>
            <p className="text-lg font-bold mt-1 text-blue-600">{s.trial}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Suspended</p>
            <p className="text-lg font-bold mt-1 text-red-600">{s.suspended}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Funds</p>
            <p className="text-lg font-bold mt-1">{s.total_funds}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Storage</p>
            <p className="text-lg font-bold mt-1">{s.total_storage_gb} GB</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            Tenants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.tenants.map((tenant) => (
              <div key={tenant.id} className="p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: tenant.branding.primary_color + '20' }}>
                      <Building2 className="w-5 h-5" style={{ color: tenant.branding.primary_color }} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{tenant.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Globe className="w-3 h-3" />
                        {tenant.domain}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(tenant.status)}>{tenant.status}</Badge>
                    <Badge className={getPlanColor(tenant.plan)}>{tenant.plan}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Users</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-medium">{tenant.users}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Funds</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-medium">{tenant.funds}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">AUM</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-medium font-mono">{formatCurrency(tenant.aum)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Storage</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <HardDrive className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-medium">{tenant.storage_used_gb} GB</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">API Calls/Mo</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm font-medium">{tenant.api_calls_month.toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Created</p>
                    <span className="text-sm font-medium">{tenant.created_at}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
