import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';

interface DashboardChartsProps {
  navHistory: Array<Record<string, unknown>>;
  assetAllocation: Array<Record<string, unknown>>;
  topPerformers: Array<Record<string, unknown>>;
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function DashboardCharts({
  navHistory,
  assetAllocation,
  topPerformers,
}: DashboardChartsProps) {
  const navData = navHistory.map((item) => ({
    date: String(item.date || '').slice(0, 10),
    nav: parseFloat(String(item.nav || 0)),
  }));

  const totalAllocation = assetAllocation.reduce(
    (sum, item) => sum + Number(item.market_value || item.total_value || 0),
    0
  );
  const allocationData = assetAllocation.map((item) => ({
    name: String(item.asset_class || ''),
    value: Number(item.market_value || item.total_value || 0),
    weight: totalAllocation > 0
      ? (Number(item.market_value || item.total_value || 0) / totalAllocation) * 100
      : 0,
  }));

  const perfData = topPerformers.map((item) => ({
    name: String(item.portfolio_name || ''),
    totalReturn: parseFloat(String(item.total_return || 0)),
    benchmarkReturn: parseFloat(String(item.benchmark_return || 0)),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* NAV Trend */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">NAV Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {navData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={navData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(Number(v) / 1e6).toFixed(0)}M`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'NAV']} />
                  <Line type="monotone" dataKey="nav" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No NAV data</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Asset Allocation Pie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {allocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="weight"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={false}
                    labelLine={false}
                  >
                    {allocationData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Weight']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No allocation data</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Performance Bar */}
      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Portfolio Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {perfData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perfData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Number(v).toFixed(1)}%`} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`]} />
                  <Legend />
                  <Bar dataKey="totalReturn" name="Fund Return" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="benchmarkReturn" name="Benchmark" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No performance data</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
