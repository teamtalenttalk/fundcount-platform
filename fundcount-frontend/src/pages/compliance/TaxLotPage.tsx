import { useState } from 'react';
import {
  Loader2,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface TaxLot {
  asset_symbol: string;
  asset_name: string;
  asset_class: string;
  acquisition_date: string;
  trade_number: string;
  quantity: number;
  cost_per_unit: number;
  cost_basis: number;
  current_price: number;
  market_value: number;
  unrealized_gain_loss: number;
  return_pct: number;
  holding_period_days: number;
  holding_period_type: string;
  fifo_order: number;
}

interface TaxLotResult {
  portfolio_id: number;
  portfolio_name: string;
  method: string;
  as_of_date: string;
  tax_lots: TaxLot[];
  summary: {
    total_cost_basis: number;
    total_market_value: number;
    total_unrealized_gain_loss: number;
    short_term_gain_loss: number;
    long_term_gain_loss: number;
    total_lots: number;
  };
}

const METHODS = [
  { label: 'FIFO', value: 'FIFO' },
  { label: 'LIFO', value: 'LIFO' },
  { label: 'Specific', value: 'SPECIFIC' },
];

export default function TaxLotPage() {
  const [portfolioId, setPortfolioId] = useState('');
  const [method, setMethod] = useState('FIFO');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaxLotResult | null>(null);

  const handleFetch = async () => {
    if (!portfolioId.trim()) {
      toast.error('Please enter a portfolio ID');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get<TaxLotResult>(
        `/compliance/tax-lots/${portfolioId.trim()}?method=${method}`
      );
      setResult(response.data);
    } catch {
      toast.error('Failed to load tax lot data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tax Lot Accounting</h1>
        <p className="text-sm text-gray-500 mt-1">
          View tax lots by cost basis method with unrealized gain/loss analysis
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Enter Portfolio ID (e.g. 1, 2, 3)..."
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    method === m.value
                      ? 'bg-white text-gray-900 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <Button
              onClick={handleFetch}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Load Tax Lots
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost Basis</p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(result.summary.total_cost_basis)}
                    </p>
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
                    <p className="text-sm text-muted-foreground">Market Value</p>
                    <p className="text-xl font-bold mt-1">
                      {formatCurrency(result.summary.total_market_value)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unrealized G/L</p>
                    <p
                      className={`text-xl font-bold mt-1 ${
                        result.summary.total_unrealized_gain_loss >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(result.summary.total_unrealized_gain_loss)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${result.summary.total_unrealized_gain_loss >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {result.summary.total_unrealized_gain_loss >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Short-Term G/L</p>
                  <p
                    className={`text-xl font-bold mt-1 ${
                      result.summary.short_term_gain_loss >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(result.summary.short_term_gain_loss)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">Long-Term G/L</p>
                  <p
                    className={`text-xl font-bold mt-1 ${
                      result.summary.long_term_gain_loss >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(result.summary.long_term_gain_loss)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Lots</p>
                    <p className="text-xl font-bold mt-1">
                      {result.summary.total_lots}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50">
                    <Layers className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              Portfolio: <strong className="text-gray-900">{result.portfolio_name}</strong>
            </span>
            <span>
              Method: <strong className="text-gray-900">{result.method}</strong>
            </span>
            <span>
              As of: <strong className="text-gray-900">{result.as_of_date}</strong>
            </span>
          </div>

          {/* Tax Lots Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Tax Lots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Trade #</TableHead>
                    <TableHead>Acquisition Date</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Cost/Unit</TableHead>
                    <TableHead className="text-right">Cost Basis</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">Unrealized G/L</TableHead>
                    <TableHead className="text-right">Return %</TableHead>
                    <TableHead className="text-center">Holding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.tax_lots.map((lot, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lot.asset_symbol}</p>
                          <p className="text-xs text-gray-400">{lot.asset_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-500">
                        {lot.trade_number}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 font-mono">
                        {lot.acquisition_date}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {lot.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {formatNumber(lot.cost_per_unit)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(lot.cost_basis)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {formatNumber(lot.current_price)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(lot.market_value)}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-semibold ${
                          lot.unrealized_gain_loss >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(lot.unrealized_gain_loss)}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-mono ${
                          lot.return_pct >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {lot.return_pct.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={
                            lot.holding_period_type === 'LONG_TERM'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }
                        >
                          {lot.holding_period_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {result.tax_lots.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-gray-400 py-4">
                        No tax lots found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
