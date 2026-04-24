import { useState, useEffect } from 'react';
import {
  Loader2,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeftRight,
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

interface Custodian {
  id: number;
  name: string;
  type: string;
  status: string;
  accounts: number;
  aum: number;
  positions: number;
  last_reconciled: string;
  reconciliation_status: string;
  connection_type: string;
}

interface ReconSummary {
  total_positions: number;
  matched: number;
  breaks: number;
  pending: number;
  last_full_recon: string;
  next_scheduled: string;
}

interface Transaction {
  id: string;
  type: string;
  asset: string;
  custodian: string;
  amount: number;
  status: string;
  date: string;
}

interface CustodianData {
  custodians: Custodian[];
  reconciliation_summary: ReconSummary;
  recent_transactions: Transaction[];
  total_aum: number;
}

function getCustodianStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    case 'INACTIVE': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getReconStatusColor(status: string) {
  switch (status) {
    case 'MATCHED': return 'bg-emerald-100 text-emerald-700';
    case 'BREAK': return 'bg-red-100 text-red-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getTxnStatusColor(status: string) {
  switch (status) {
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    case 'FAILED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function CustodianPage() {
  const [data, setData] = useState<CustodianData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<CustodianData>('/integration/custodian');
      setData(response.data);
    } catch {
      toast.error('Failed to load custodian data');
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

  const rs = data.reconciliation_summary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custodian Connectivity</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bank connections, position reconciliation, and multi-custodian asset aggregation
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
                <p className="text-sm text-muted-foreground">Total AUM</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(data.total_aum)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <Building2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Matched</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{rs.matched}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Breaks</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{rs.breaks}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">{rs.pending}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-50">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            Connected Custodians
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {data.custodians.map((c) => (
              <div key={c.id} className="p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{c.name}</h3>
                  <Badge className={getCustodianStatusColor(c.status)}>{c.status}</Badge>
                </div>
                <p className="text-xs text-gray-500 mb-3">{c.type} &middot; {c.connection_type}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">AUM</p>
                    <p className="font-semibold">{formatCurrency(c.aum)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Positions</p>
                    <p className="font-semibold">{c.positions}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Accounts</p>
                    <p className="font-semibold">{c.accounts}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Recon Status</p>
                    <Badge className={`text-xs ${getReconStatusColor(c.reconciliation_status)}`}>
                      {c.reconciliation_status}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Last reconciled: {new Date(c.last_reconciled).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-500" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Custodian</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recent_transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-sm">{txn.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{txn.type.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell className="font-mono font-medium">{txn.asset}</TableCell>
                  <TableCell className="text-sm">{txn.custodian}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(txn.amount)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getTxnStatusColor(txn.status)}>{txn.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{txn.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
