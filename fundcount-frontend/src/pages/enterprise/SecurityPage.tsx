import { useState, useEffect } from 'react';
import {
  Loader2,
  Shield,
  ShieldCheck,
  KeyRound,
  Globe,
  Monitor,
  Users,
  RefreshCw,
  Fingerprint,
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

interface MfaMethod {
  method: string;
  users: number;
  pct: number;
}

interface MfaStatus {
  total_users: number;
  mfa_enabled: number;
  mfa_disabled: number;
  enforcement_policy: string;
  methods: MfaMethod[];
}

interface SsoConfig {
  id: number;
  tenant: string;
  provider: string;
  protocol: string;
  status: string;
  users_synced: number;
  last_sync: string;
}

interface IpRule {
  id: number;
  tenant: string;
  type: string;
  ip_range: string;
  description: string;
  status: string;
}

interface Session {
  user: string;
  tenant: string;
  ip: string;
  location: string;
  device: string;
  started: string;
  status: string;
}

interface SecurityCategory {
  name: string;
  score: number;
  details: string;
}

interface SecurityScore {
  overall: number;
  categories: SecurityCategory[];
}

interface SecurityData {
  mfa_status: MfaStatus;
  sso_configs: SsoConfig[];
  ip_rules: IpRule[];
  sessions: Session[];
  security_score: SecurityScore;
}

function getScoreColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getScoreTextClass(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBgClass(score: number) {
  if (score >= 80) return 'bg-emerald-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
}

function getSsoStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
    case 'INACTIVE': return 'bg-gray-100 text-gray-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getIpRuleStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
    case 'DISABLED': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getSessionStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
    case 'IDLE': return 'bg-yellow-100 text-yellow-700';
    case 'EXPIRED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getPolicyColor(policy: string) {
  switch (policy) {
    case 'REQUIRED': return 'bg-emerald-100 text-emerald-700';
    case 'RECOMMENDED': return 'bg-yellow-100 text-yellow-700';
    case 'OPTIONAL': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function SecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<SecurityData>('/enterprise/security');
      setData(response.data);
    } catch {
      toast.error('Failed to load security data');
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

  const mfa = data.mfa_status;
  const score = data.security_score;
  const scoreAngle = (score.overall / 100) * 180;
  const scoreColor = getScoreColor(score.overall);
  const mfaPct = mfa.total_users > 0 ? Math.round((mfa.mfa_enabled / mfa.total_users) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Multi-factor authentication, SSO, IP access rules, and session management
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
            <p className="text-xs text-muted-foreground">Security Score</p>
            <p className={`text-xl font-bold mt-1 ${getScoreTextClass(score.overall)}`}>{score.overall}/100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Users</p>
            <p className="text-xl font-bold mt-1">{mfa.total_users}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">MFA Enabled</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">{mfa.mfa_enabled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">MFA Disabled</p>
            <p className="text-xl font-bold mt-1 text-red-600">{mfa.mfa_disabled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Active Sessions</p>
            <p className="text-xl font-bold mt-1">{data.sessions.filter(s => s.status === 'ACTIVE').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 200 120" className="w-48 h-28">
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={scoreColor} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(scoreAngle / 180) * 251.2} 251.2`} />
                <line x1="100" y1="100" x2={100 + 60 * Math.cos(Math.PI - (scoreAngle * Math.PI) / 180)} y2={100 - 60 * Math.sin(Math.PI - (scoreAngle * Math.PI) / 180)} stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="100" cy="100" r="4" fill="#374151" />
                <text x="100" y="90" textAnchor="middle" fill="#111827" fontSize="24" fontWeight="bold">{score.overall}</text>
              </svg>
              <p className="text-sm font-medium mt-2" style={{ color: scoreColor }}>
                {score.overall >= 80 ? 'Strong Security' : score.overall >= 60 ? 'Needs Improvement' : 'At Risk'}
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {score.categories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{cat.name}</span>
                    <span className={`text-sm font-semibold ${getScoreTextClass(cat.score)}`}>{cat.score}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${cat.score}%`, backgroundColor: getScoreColor(cat.score) }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-500" />
              Multi-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-gray-500">Enforcement Policy:</span>
              <Badge className={getPolicyColor(mfa.enforcement_policy)}>{mfa.enforcement_policy}</Badge>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">MFA Adoption</span>
                <span className="text-sm font-semibold text-emerald-600">{mfaPct}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${mfaPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
                <span>{mfa.mfa_enabled} enabled</span>
                <span>{mfa.mfa_disabled} disabled</span>
              </div>
            </div>
            <div className="space-y-2">
              {mfa.methods.map((m) => (
                <div key={m.method} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{m.method}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{m.users} users</span>
                    <Badge variant="outline" className="text-xs">{m.pct}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            SSO Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Users Synced</TableHead>
                <TableHead>Last Sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sso_configs.map((sso) => (
                <TableRow key={sso.id}>
                  <TableCell className="font-medium text-gray-900">{sso.tenant}</TableCell>
                  <TableCell className="text-sm text-gray-600">{sso.provider}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{sso.protocol}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getSsoStatusColor(sso.status)}>{sso.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{sso.users_synced}</TableCell>
                  <TableCell className="text-sm text-gray-500">{new Date(sso.last_sync).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {data.sso_configs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-4">
                    No SSO configurations found
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
            <Globe className="w-5 h-5 text-blue-500" />
            IP Access Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>IP Range</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.ip_rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium text-gray-900">{rule.tenant}</TableCell>
                  <TableCell>
                    <Badge className={rule.type === 'WHITELIST' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                      {rule.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{rule.ip_range}</TableCell>
                  <TableCell className="text-sm text-gray-600">{rule.description}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getIpRuleStatusColor(rule.status)}>{rule.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {data.ip_rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-4">
                    No IP rules configured
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
            <Monitor className="w-5 h-5 text-purple-500" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sessions.map((session, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-sm">{session.user}</TableCell>
                  <TableCell className="text-sm text-gray-600">{session.tenant}</TableCell>
                  <TableCell className="font-mono text-sm">{session.ip}</TableCell>
                  <TableCell className="text-sm text-gray-600">{session.location}</TableCell>
                  <TableCell className="text-sm text-gray-500">{session.device}</TableCell>
                  <TableCell className="text-sm text-gray-500">{new Date(session.started).toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getSessionStatusColor(session.status)}>{session.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {data.sessions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-4">
                    No active sessions
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
