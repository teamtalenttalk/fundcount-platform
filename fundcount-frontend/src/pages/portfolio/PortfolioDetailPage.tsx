import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '@/lib/api';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Portfolio, Position, Trade } from '@/types';

interface PortfolioDetail extends Portfolio {
  positions?: Position[];
  trades?: Trade[];
  nav_history?: { date: string; nav: number }[];
  asset_allocation?: { asset_class: string; weight: number; value: number }[];
  benchmark_name?: string;
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1', '#ec4899'];

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PortfolioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/portfolios/${id}`);
        setData(response.data);
      } catch {
        setError('Failed to load portfolio details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error || 'Portfolio not found'}</p>
      </div>
    );
  }

  const positions = data.positions || [];
  const trades = data.trades || [];
  const navHistory = data.nav_history || [];
  const assetAllocation = data.asset_allocation || [];

  return (
    <div className="space-y-6">
      {/* Back button + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portfolio/portfolios')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
          <p className="text-sm text-gray-500">{data.code}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-xl font-bold mt-1">{formatCurrency(data.nav || 0, data.base_currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="text-xl font-bold mt-1">{data.base_currency}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Inception Date</p>
            <p className="text-xl font-bold mt-1">{formatDate(data.inception_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Benchmark</p>
            <p className="text-xl font-bold mt-1">{data.benchmark_name || 'None'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Positions</h2>
          {positions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No positions found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Avg Cost</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">Unrealized P&L</TableHead>
                    <TableHead className="text-right">Weight %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell className="font-medium">{pos.asset_symbol}</TableCell>
                      <TableCell>{pos.asset_name}</TableCell>
                      <TableCell className="text-right">{formatNumber(pos.quantity)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pos.cost_basis, pos.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pos.market_value, pos.currency)}</TableCell>
                      <TableCell className={`text-right font-medium ${pos.unrealized_pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(pos.unrealized_pnl, pos.currency)}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(pos.weight)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NAV Chart */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">NAV History</h2>
            {navHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No NAV history available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={navHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} fontSize={12} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} fontSize={12} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} labelFormatter={(l) => formatDate(String(l))} />
                  <Line type="monotone" dataKey="nav" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Asset Allocation Pie */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Asset Allocation</h2>
            {assetAllocation.length === 0 ? (
              <p className="text-muted-foreground text-sm">No allocation data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetAllocation}
                    dataKey="weight"
                    nameKey="asset_class"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
                  >
                    {assetAllocation.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
          {trades.length === 0 ? (
            <p className="text-muted-foreground text-sm">No trades found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>{formatDate(trade.trade_date)}</TableCell>
                      <TableCell className="font-medium">{trade.asset_symbol}</TableCell>
                      <TableCell>
                        <Badge variant={trade.trade_type === 'buy' ? 'default' : 'destructive'}>
                          {trade.trade_type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(trade.quantity)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(trade.price, trade.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(trade.net_amount, trade.currency)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{trade.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
