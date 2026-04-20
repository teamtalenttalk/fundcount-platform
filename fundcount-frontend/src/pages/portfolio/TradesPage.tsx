import { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatNumber, formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Trade, Portfolio, Asset } from '@/types';

const TRADE_TYPE_COLORS: Record<string, string> = {
  buy: 'bg-emerald-100 text-emerald-800',
  sell: 'bg-red-100 text-red-800',
  short: 'bg-orange-100 text-orange-800',
  cover: 'bg-blue-100 text-blue-800',
};

interface TradeWithPortfolio extends Trade {
  portfolio_name?: string;
}

export default function TradesPage() {
  const [trades, setTrades] = useState<TradeWithPortfolio[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPortfolio, setFilterPortfolio] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTrade, setNewTrade] = useState({
    portfolio_id: '', asset_id: '', trade_type: 'buy', quantity: '', price: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tradesRes, portfoliosRes, assetsRes] = await Promise.all([
          api.get('/trades'),
          api.get('/portfolios'),
          api.get('/assets'),
        ]);
        const tradesData = Array.isArray(tradesRes.data) ? tradesRes.data : tradesRes.data.items || [];
        const portfoliosData = Array.isArray(portfoliosRes.data) ? portfoliosRes.data : portfoliosRes.data.items || [];
        const assetsData = Array.isArray(assetsRes.data) ? assetsRes.data : assetsRes.data.items || [];
        setTrades(tradesData);
        setPortfolios(portfoliosData);
        setAssets(assetsData);
      } catch {
        setError('Failed to load trades');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddTrade = async () => {
    try {
      const payload = {
        portfolio_id: parseInt(newTrade.portfolio_id),
        asset_id: parseInt(newTrade.asset_id),
        trade_type: newTrade.trade_type,
        quantity: parseFloat(newTrade.quantity),
        price: parseFloat(newTrade.price),
      };
      const response = await api.post('/trades', payload);
      setTrades((prev) => [...prev, response.data]);
      setDialogOpen(false);
      setNewTrade({ portfolio_id: '', asset_id: '', trade_type: 'buy', quantity: '', price: '' });
    } catch {
      // handle silently
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const filteredTrades = trades.filter((t) => {
    if (filterPortfolio !== 'all' && t.portfolio_id.toString() !== filterPortfolio) return false;
    if (filterType !== 'all' && t.trade_type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trades</h1>
          <p className="text-sm text-gray-500 mt-1">Trade history and execution</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2" /> Add Trade
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Trade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Portfolio</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newTrade.portfolio_id}
                  onChange={(e) => setNewTrade({ ...newTrade, portfolio_id: e.target.value })}
                >
                  <option value="">Select portfolio</option>
                  {portfolios.map((p) => (
                    <option key={p.id} value={p.id.toString()}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Asset</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newTrade.asset_id}
                  onChange={(e) => setNewTrade({ ...newTrade, asset_id: e.target.value })}
                >
                  <option value="">Select asset</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id.toString()}>{a.symbol} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newTrade.trade_type}
                  onChange={(e) => setNewTrade({ ...newTrade, trade_type: e.target.value })}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                  <option value="short">Short</option>
                  <option value="cover">Cover</option>
                </select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={newTrade.quantity} onChange={(e) => setNewTrade({ ...newTrade, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Price</Label>
                <Input type="number" value={newTrade.price} onChange={(e) => setNewTrade({ ...newTrade, price: e.target.value })} />
              </div>
              <Button onClick={handleAddTrade} className="w-full">Submit Trade</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label>Portfolio</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm w-[200px]"
                value={filterPortfolio}
                onChange={(e) => setFilterPortfolio(e.target.value)}
              >
                <option value="all">All Portfolios</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id.toString()}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Type</Label>
              <select
                className="border rounded-md px-3 py-2 text-sm w-[150px]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="short">Short</option>
                <option value="cover">Cover</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trade #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Portfolio</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.reference || `#${trade.id}`}</TableCell>
                    <TableCell>{formatDate(trade.trade_date)}</TableCell>
                    <TableCell>{trade.portfolio_name || `Portfolio #${trade.portfolio_id}`}</TableCell>
                    <TableCell>{trade.asset_symbol}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${TRADE_TYPE_COLORS[trade.trade_type] || 'bg-gray-100 text-gray-800'}`}>
                        {trade.trade_type.toUpperCase()}
                      </span>
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
          {filteredTrades.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No trades found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
