import { useState, useEffect } from 'react';
import { DollarSign, Briefcase, Users, TrendingUp, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import DashboardCharts from './DashboardCharts';
import RecentTrades from './RecentTrades';

interface DashboardData {
  totalAUM: number;
  totalPortfolios: number;
  activePartners: number;
  mtdReturn: number;
  navHistory: Array<{ date: string; nav: number }>;
  assetAllocation: Array<{ asset_class: string; total_value: number }>;
  recentTrades: Array<Record<string, unknown>>;
  portfolioPerformance: Array<Record<string, unknown>>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get<DashboardData>('/dashboard');
        setData(response.data);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

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
        <p className="text-red-500">{error || 'No data available'}</p>
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Total AUM',
      value: formatCurrency(data.totalAUM),
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Portfolios',
      value: data.totalPortfolios.toString(),
      icon: Briefcase,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Partners',
      value: data.activePartners.toString(),
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      label: 'MTD Return',
      value: formatPercent(data.mtdReturn || 0),
      icon: TrendingUp,
      color: (data.mtdReturn || 0) >= 0 ? 'text-emerald-500' : 'text-red-500',
      bg: (data.mtdReturn || 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Portfolio overview and key metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <DashboardCharts
        navHistory={data.navHistory || []}
        assetAllocation={data.assetAllocation || []}
        topPerformers={data.portfolioPerformance || []}
      />

      {/* Recent Trades */}
      <RecentTrades trades={data.recentTrades || []} />
    </div>
  );
}
