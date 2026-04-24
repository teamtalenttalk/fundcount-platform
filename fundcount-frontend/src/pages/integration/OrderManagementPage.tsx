import { useState, useEffect } from 'react';
import {
  Loader2,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Scale,
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

interface Order {
  order_id: string;
  symbol: string;
  asset_name: string;
  side: string;
  order_type: string;
  quantity: number;
  price: number;
  filled_qty: number;
  fill_pct: number;
  status: string;
  broker: string;
  portfolio: string;
  created_at: string;
  filled_at: string | null;
}

interface Summary {
  total_orders: number;
  filled: number;
  partially_filled: number;
  pending: number;
  cancelled: number;
  rejected: number;
  total_notional: number;
  fill_rate: number;
}

interface Rebalancing {
  symbol: string;
  asset_name: string;
  current_weight: number;
  target_weight: number;
  drift: number;
  action: string;
  estimated_quantity: number;
  estimated_value: number;
}

interface OmsData {
  orders: Order[];
  summary: Summary;
  rebalancing: Rebalancing[];
}

function getOrderStatusColor(status: string) {
  switch (status) {
    case 'FILLED': return 'bg-emerald-100 text-emerald-700';
    case 'PARTIALLY_FILLED': return 'bg-blue-100 text-blue-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    case 'CANCELLED': return 'bg-gray-100 text-gray-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getSideColor(side: string) {
  return side === 'BUY' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
}

function getActionColor(action: string) {
  switch (action) {
    case 'BUY': return 'text-emerald-600';
    case 'SELL': return 'text-red-600';
    default: return 'text-gray-500';
  }
}

export default function OrderManagementPage() {
  const [data, setData] = useState<OmsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<OmsData>('/integration/oms');
      setData(response.data);
    } catch {
      toast.error('Failed to load order data');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management System</h1>
          <p className="text-sm text-gray-500 mt-1">
            Trade order management, execution monitoring, and portfolio rebalancing
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-xl font-bold mt-1">{s.total_orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Filled</p>
            <p className="text-xl font-bold mt-1 text-emerald-600">{s.filled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Partial</p>
            <p className="text-xl font-bold mt-1 text-blue-600">{s.partially_filled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-xl font-bold mt-1 text-yellow-600">{s.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Fill Rate</p>
            <p className="text-xl font-bold mt-1">{s.fill_rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Notional</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(s.total_notional)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            Trade Blotter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-center">Side</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Filled</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.orders.map((o) => (
                <TableRow key={o.order_id}>
                  <TableCell className="font-mono text-sm">{o.order_id}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-mono font-bold">{o.symbol}</span>
                      <p className="text-xs text-gray-400">{o.asset_name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getSideColor(o.side)}>{o.side}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{o.order_type}</TableCell>
                  <TableCell className="text-right font-mono">{o.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${o.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono">{o.filled_qty.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-1">({o.fill_pct}%)</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getOrderStatusColor(o.status)}>
                      {o.status === 'FILLED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {o.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                      {o.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                      {o.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{o.broker}</TableCell>
                  <TableCell className="text-sm text-gray-500">{o.created_at}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-500" />
            Portfolio Rebalancing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Current %</TableHead>
                <TableHead className="text-right">Target %</TableHead>
                <TableHead className="text-right">Drift</TableHead>
                <TableHead className="text-center">Action</TableHead>
                <TableHead className="text-right">Est. Qty</TableHead>
                <TableHead className="text-right">Est. Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rebalancing.map((r) => (
                <TableRow key={r.symbol}>
                  <TableCell className="font-mono font-bold">{r.symbol}</TableCell>
                  <TableCell className="text-sm">{r.asset_name}</TableCell>
                  <TableCell className="text-right font-mono">{r.current_weight.toFixed(2)}%</TableCell>
                  <TableCell className="text-right font-mono">{r.target_weight.toFixed(2)}%</TableCell>
                  <TableCell className={`text-right font-mono font-medium ${r.drift > 0 ? 'text-red-600' : r.drift < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {r.drift > 0 ? '+' : ''}{r.drift.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${getActionColor(r.action)}`}>{r.action}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{r.estimated_quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(r.estimated_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
