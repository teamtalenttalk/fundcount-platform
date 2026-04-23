import { useState } from 'react';
import {
  Loader2,
  Calculator,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
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

interface NavComponent {
  asset_class: string;
  value: number;
  weight: number;
  daily_change: number;
  position_count: number;
}

interface PricingSource {
  symbol: string;
  source: string;
  price: number;
  price_date: string;
}

interface FairValueAdjustment {
  symbol: string;
  name: string;
  asset_class: string;
  reported_value: number;
  adjustment: number;
  fair_value: number;
  reason: string;
}

interface NavResult {
  portfolio_id: number;
  portfolio_name: string;
  calculation_date: string;
  nav: number;
  nav_per_share: number;
  total_assets: number;
  total_liabilities: number;
  shares_outstanding: number;
  components: NavComponent[];
  pricing_sources: PricingSource[];
  stale_prices: Array<{ symbol: string; price_date: string; days_stale: number }>;
  fair_value_adjustments: FairValueAdjustment[];
}

export default function NavCalculatorPage() {
  const [portfolioId, setPortfolioId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NavResult | null>(null);

  const handleCalculate = async () => {
    if (!portfolioId.trim()) {
      toast.error('Please enter a portfolio ID');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post<NavResult>('/ai/nav-calculate', {
        portfolio_id: portfolioId.trim(),
      });
      setResult(response.data);
    } catch {
      toast.error('Failed to calculate NAV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Real-time NAV Calculator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Calculate net asset value with AI-assisted pricing and fair value adjustments
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter Portfolio ID (e.g. 1, 2, 3)..."
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
              />
            </div>
            <Button
              onClick={handleCalculate}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate NAV
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Big NAV Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total NAV</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(result.nav)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">NAV Per Share</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    ${result.nav_per_share.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(result.total_assets)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Liabilities</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {formatCurrency(result.total_liabilities)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-gray-400 text-right">
            {result.portfolio_name} &middot; Calculated:{' '}
            {new Date(result.calculation_date).toLocaleString()} &middot;{' '}
            {result.shares_outstanding.toLocaleString()} shares outstanding
          </p>

          {/* Components Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Components Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Class</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Daily Change</TableHead>
                    <TableHead className="text-right">Positions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.components.map((c) => (
                    <TableRow key={c.asset_class}>
                      <TableCell className="font-medium">{c.asset_class}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(c.value)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercent(c.weight)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          c.daily_change >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {c.daily_change >= 0 ? '+' : ''}
                        {formatPercent(c.daily_change)}
                      </TableCell>
                      <TableCell className="text-right">{c.position_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Stale Prices Warning */}
          {result.stale_prices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-5 h-5" />
                  Stale Prices Warning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Last Price Date</TableHead>
                      <TableHead className="text-right">Days Stale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.stale_prices.map((sp) => (
                      <TableRow key={sp.symbol}>
                        <TableCell className="font-medium">{sp.symbol}</TableCell>
                        <TableCell>{sp.price_date}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={
                              sp.days_stale > 5
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {sp.days_stale}d
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Fair Value Adjustments */}
          {result.fair_value_adjustments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fair Value Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.fair_value_adjustments.map((fv) => (
                    <div
                      key={fv.symbol}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {fv.name} ({fv.symbol})
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {fv.asset_class} &middot; {fv.reason}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400 line-through">
                            {formatCurrency(fv.reported_value)}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {formatCurrency(fv.fair_value)}
                          </span>
                        </div>
                        <p
                          className={`text-xs font-medium mt-0.5 ${
                            fv.adjustment >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {fv.adjustment >= 0 ? '+' : ''}
                          {formatCurrency(fv.adjustment)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Price Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.pricing_sources.map((ps) => (
                    <TableRow key={ps.symbol}>
                      <TableCell className="font-mono font-medium">
                        {ps.symbol}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ps.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${ps.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {ps.price_date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
