import { useState, useEffect } from 'react';
import {
  Loader2,
  Layers,
  Building,
  PieChart,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
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
import { PieChart as RPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface Fund {
  id: number;
  name: string;
  structure: string;
  strategy: string;
  nav: number;
  nav_per_share: number;
  mtd_return: number;
  ytd_return: number;
  inception_return: number;
  aum: number;
  investors: number;
  status: string;
  base_currency: string;
  inception_date: string;
  parent_fund?: string;
}

interface SeriesClass {
  fund: string;
  series: string;
  mgmt_fee: number;
  perf_fee: number;
  nav_per_share: number;
  min_investment: number;
  lock_up: string;
  investors: number;
}

interface LookThrough {
  asset_class: string;
  allocation_pct: number;
  market_value: number;
  positions: number;
}

interface CrossFundExposure {
  sector: string;
  master_pct: number;
  equity_feeder_pct: number;
  fi_feeder_pct: number;
  total_value: number;
}

interface ConsolidationSummary {
  total_funds: number;
  master_funds: number;
  feeder_funds: number;
  side_pockets: number;
  total_aum: number;
  total_investors: number;
  total_series: number;
}

interface MultiFundData {
  funds: Fund[];
  series_classes: SeriesClass[];
  look_through: LookThrough[];
  cross_fund_exposure: CrossFundExposure[];
  consolidation_summary: ConsolidationSummary;
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function getStructureColor(structure: string) {
  switch (structure) {
    case 'MASTER': return 'bg-emerald-100 text-emerald-700';
    case 'FEEDER': return 'bg-blue-100 text-blue-700';
    case 'SIDE_POCKET': return 'bg-yellow-100 text-yellow-700';
    case 'STANDALONE': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function MultiFundPage() {
  const [data, setData] = useState<MultiFundData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<MultiFundData>('/integration/multi-fund');
      setData(response.data);
    } catch {
      toast.error('Failed to load multi-fund data');
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

  const cs = data.consolidation_summary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Multi-Fund Consolidation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fund-of-funds, master-feeder structures, side pockets, and consolidated reporting
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Funds', value: cs.total_funds.toString() },
          { label: 'Master', value: cs.master_funds.toString() },
          { label: 'Feeders', value: cs.feeder_funds.toString() },
          { label: 'Side Pockets', value: cs.side_pockets.toString() },
          { label: 'Series/Classes', value: cs.total_series.toString() },
          { label: 'Total Investors', value: cs.total_investors.toString() },
          { label: 'Total AUM', value: formatCurrency(cs.total_aum) },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-bold mt-1">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-500" />
            Fund Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fund</TableHead>
                <TableHead>Structure</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead className="text-right">NAV</TableHead>
                <TableHead className="text-right">NAV/Share</TableHead>
                <TableHead className="text-right">MTD</TableHead>
                <TableHead className="text-right">YTD</TableHead>
                <TableHead className="text-right">Inception</TableHead>
                <TableHead className="text-right">Investors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.funds.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-gray-900">{f.name}</span>
                      {f.parent_fund && (
                        <p className="text-xs text-gray-400 mt-0.5">Parent: {f.parent_fund}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStructureColor(f.structure)}>{f.structure.replace(/_/g, ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{f.strategy}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(f.nav)}</TableCell>
                  <TableCell className="text-right font-mono">${f.nav_per_share.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-mono font-medium ${f.mtd_return >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span className="inline-flex items-center gap-0.5">
                      {f.mtd_return >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {f.mtd_return >= 0 ? '+' : ''}{f.mtd_return.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-medium ${f.ytd_return >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {f.ytd_return >= 0 ? '+' : ''}{f.ytd_return.toFixed(2)}%
                  </TableCell>
                  <TableCell className={`text-right font-mono ${f.inception_return >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {f.inception_return >= 0 ? '+' : ''}{f.inception_return.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">{f.investors}</TableCell>
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
              <PieChart className="w-5 h-5 text-blue-500" />
              Look-Through Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RPieChart>
                    <Pie
                      data={data.look_through}
                      dataKey="allocation_pct"
                      nameKey="asset_class"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      strokeWidth={2}
                    >
                      {data.look_through.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                  </RPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {data.look_through.map((lt, idx) => (
                  <div key={lt.asset_class} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-gray-700">{lt.asset_class}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono">{lt.allocation_pct}%</span>
                      <span className="text-xs text-gray-400">{lt.positions} pos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" />
              Series / Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund / Series</TableHead>
                  <TableHead className="text-right">Mgmt Fee</TableHead>
                  <TableHead className="text-right">Perf Fee</TableHead>
                  <TableHead className="text-right">NAV/Share</TableHead>
                  <TableHead>Lock-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.series_classes.map((sc, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{sc.series}</span>
                        <p className="text-xs text-gray-400">{sc.fund}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{sc.mgmt_fee}%</TableCell>
                    <TableCell className="text-right font-mono">{sc.perf_fee}%</TableCell>
                    <TableCell className="text-right font-mono">${sc.nav_per_share.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{sc.lock_up}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-500" />
            Cross-Fund Sector Exposure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Master Fund</TableHead>
                <TableHead className="text-right">Equity Feeder</TableHead>
                <TableHead className="text-right">FI Feeder</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.cross_fund_exposure.map((cfe) => (
                <TableRow key={cfe.sector}>
                  <TableCell className="font-medium">{cfe.sector}</TableCell>
                  <TableCell className="text-right font-mono">{cfe.master_pct}%</TableCell>
                  <TableCell className="text-right font-mono">{cfe.equity_feeder_pct}%</TableCell>
                  <TableCell className="text-right font-mono">{cfe.fi_feeder_pct}%</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCurrency(cfe.total_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
