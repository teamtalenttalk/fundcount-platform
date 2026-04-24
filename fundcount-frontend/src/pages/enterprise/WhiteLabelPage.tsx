import { useState, useEffect } from 'react';
import {
  Loader2,
  Palette,
  Globe,
  Shield,
  FileText,
  RefreshCw,
  Mail,
  Image,
  Type,
  Server,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Theme {
  id: number;
  tenant: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  logo_url: string;
  favicon_url: string;
  custom_domain: string;
  ssl_status: string;
  email_from: string;
  report_header: string;
  report_footer: string;
  login_bg_image: string;
  status: string;
}

interface DomainSettings {
  default_domain: string;
  ssl_provider: string;
  cdn_provider: string;
  dns_instructions: string;
}

interface WhiteLabelData {
  themes: Theme[];
  domain_settings: DomainSettings;
}

function getDeploymentStatusColor(status: string) {
  switch (status) {
    case 'DEPLOYED': return 'bg-emerald-100 text-emerald-700';
    case 'CONFIGURING': return 'bg-yellow-100 text-yellow-700';
    case 'PENDING': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getSslStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    case 'EXPIRED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function WhiteLabelPage() {
  const [data, setData] = useState<WhiteLabelData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<WhiteLabelData>('/enterprise/white-label');
      setData(response.data);
    } catch {
      toast.error('Failed to load white-label configuration');
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

  const ds = data.domain_settings;
  const deployed = data.themes.filter(t => t.status === 'DEPLOYED').length;
  const configuring = data.themes.filter(t => t.status === 'CONFIGURING').length;

  const statCards = [
    { label: 'Total Themes', value: data.themes.length.toString(), icon: Palette, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Deployed', value: deployed.toString(), icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Configuring', value: configuring.toString(), icon: Server, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'SSL Provider', value: ds.ssl_provider, icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">White-Label Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Branding themes, custom domains, SSL certificates, and tenant customization
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-500" />
            Tenant Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.themes.map((theme) => (
              <div key={theme.id} className="p-5 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">{theme.tenant}</h4>
                  <Badge className={getDeploymentStatusColor(theme.status)}>{theme.status}</Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Color Palette</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ backgroundColor: theme.primary_color }} />
                          <div>
                            <p className="text-xs text-gray-500">Primary</p>
                            <p className="text-xs font-mono">{theme.primary_color}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ backgroundColor: theme.secondary_color }} />
                          <div>
                            <p className="text-xs text-gray-500">Secondary</p>
                            <p className="text-xs font-mono">{theme.secondary_color}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ backgroundColor: theme.accent_color }} />
                          <div>
                            <p className="text-xs text-gray-500">Accent</p>
                            <p className="text-xs font-mono">{theme.accent_color}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{theme.font_family}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500 font-mono">{theme.logo_url}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{theme.email_from}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Custom Domain</p>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-mono text-gray-800">{theme.custom_domain}</span>
                        <Badge className={getSslStatusColor(theme.ssl_status)}>
                          <Shield className="w-3 h-3 mr-1" />
                          SSL {theme.ssl_status}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Report Header</p>
                      <p className="text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded">{theme.report_header}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Report Footer</p>
                      <p className="text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded">{theme.report_footer}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            Domain & DNS Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-xs text-emerald-600 mb-1">Default Domain</p>
              <p className="text-sm font-mono font-medium text-emerald-700">{ds.default_domain}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">SSL Provider</p>
              <p className="text-sm font-medium text-blue-700">{ds.ssl_provider}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-xs text-purple-600 mb-1">CDN Provider</p>
              <p className="text-sm font-medium text-purple-700">{ds.cdn_provider}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-1">DNS Instructions</p>
            <p className="text-sm text-gray-700 font-mono">{ds.dns_instructions}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
