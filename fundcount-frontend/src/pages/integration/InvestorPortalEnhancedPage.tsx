import { useState, useEffect } from 'react';
import {
  Loader2,
  Users,
  DollarSign,
  Mail,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
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

interface Investor {
  id: number;
  name: string;
  type: string;
  commitment: number;
  contributed: number;
  distributions: number;
  nav_share: number;
  ownership_pct: number;
  irr: number;
  inception_date: string;
  status: string;
}

interface CapitalActivity {
  id: string;
  type: string;
  investor: string;
  amount: number;
  status: string;
  date: string;
  due_date: string | null;
  notice_sent: boolean;
}

interface Communication {
  id: number;
  subject: string;
  type: string;
  date: string;
  recipients: number;
  status: string;
  open_rate: number;
}

interface PortalSummary {
  total_investors: number;
  total_aum: number;
  total_commitments: number;
  pending_requests: number;
  unread_messages: number;
  upcoming_capital_calls: number;
}

interface InvestorPortalData {
  investors: Investor[];
  capital_activity: CapitalActivity[];
  communications: Communication[];
  portal_summary: PortalSummary;
}

function getActivityTypeColor(type: string) {
  switch (type) {
    case 'CAPITAL_CALL': return 'bg-blue-100 text-blue-700';
    case 'DISTRIBUTION': return 'bg-emerald-100 text-emerald-700';
    case 'REDEMPTION': return 'bg-red-100 text-red-700';
    case 'SUBSCRIPTION': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getActivityStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getCommStatusColor(status: string) {
  return status === 'SENT' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700';
}

export default function InvestorPortalEnhancedPage() {
  const [data, setData] = useState<InvestorPortalData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<InvestorPortalData>('/integration/investor-portal');
      setData(response.data);
    } catch {
      toast.error('Failed to load investor portal data');
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

  const ps = data.portal_summary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investor Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Self-service investor dashboard, capital calls, distributions, and communications
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
                <p className="text-sm text-muted-foreground">Total Investors</p>
                <p className="text-2xl font-bold mt-1">{ps.total_investors}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total AUM</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(ps.total_aum)}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <DollarSign className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">{ps.pending_requests}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-50">
                <Bell className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">{ps.unread_messages}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Investor Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Commitment</TableHead>
                <TableHead className="text-right">Contributed</TableHead>
                <TableHead className="text-right">Distributions</TableHead>
                <TableHead className="text-right">NAV Share</TableHead>
                <TableHead className="text-right">Ownership</TableHead>
                <TableHead className="text-right">IRR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.investors.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{inv.type.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(inv.commitment)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(inv.contributed)}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600">
                    <span className="inline-flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {formatCurrency(inv.distributions)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCurrency(inv.nav_share)}</TableCell>
                  <TableCell className="text-right">{inv.ownership_pct}%</TableCell>
                  <TableCell className={`text-right font-medium ${inv.irr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{inv.irr}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              Capital Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.capital_activity.map((ca) => (
                <div key={ca.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${ca.type === 'DISTRIBUTION' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                      {ca.type === 'DISTRIBUTION' || ca.type === 'REDEMPTION'
                        ? <ArrowUpRight className={`w-4 h-4 ${ca.type === 'DISTRIBUTION' ? 'text-emerald-500' : 'text-red-500'}`} />
                        : <ArrowDownRight className="w-4 h-4 text-blue-500" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getActivityTypeColor(ca.type)}>{ca.type.replace(/_/g, ' ')}</Badge>
                        <Badge className={getActivityStatusColor(ca.status)}>{ca.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{ca.investor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold">{formatCurrency(ca.amount)}</p>
                    <p className="text-xs text-gray-400">{ca.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Communications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.communications.map((comm) => (
                <div key={comm.id} className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{comm.subject}</h4>
                    <Badge className={getCommStatusColor(comm.status)}>{comm.status}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{comm.type.replace(/_/g, ' ')}</span>
                    <span>{comm.recipients} recipients</span>
                    <span>{comm.date}</span>
                    {comm.open_rate > 0 && <span className="text-emerald-600">{comm.open_rate}% opened</span>}
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
