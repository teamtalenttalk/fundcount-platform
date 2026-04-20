import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Portfolio } from '@/types';

interface PortfolioWithPositions extends Portfolio {
  positions_count?: number;
  benchmark_name?: string;
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<PortfolioWithPositions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await api.get('/portfolios');
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setPortfolios(data);
      } catch {
        setError('Failed to load portfolios');
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolios();
  }, []);

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

  const activePortfolios = portfolios.filter((p) => p.status === 'active');
  const totalAUM = portfolios.reduce((sum, p) => sum + (p.nav || 0), 0);

  const summaryCards = [
    {
      label: 'Total Portfolios',
      value: portfolios.length.toString(),
      icon: Briefcase,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Portfolios',
      value: activePortfolios.length.toString(),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total AUM',
      value: formatCurrency(totalAUM),
      icon: DollarSign,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portfolios</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your investment portfolios</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {portfolios.map((portfolio) => (
          <Card
            key={portfolio.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/portfolio/portfolios/${portfolio.id}`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{portfolio.name}</h3>
                  <p className="text-sm text-muted-foreground">{portfolio.code}</p>
                </div>
                <Badge variant={portfolio.status === 'active' ? 'default' : 'secondary'}>
                  {portfolio.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Value</span>
                  <span className="font-medium">{formatCurrency(portfolio.nav || 0, portfolio.base_currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{portfolio.base_currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inception Date</span>
                  <span className="font-medium">{formatDate(portfolio.inception_date)}</span>
                </div>
                {portfolio.benchmark_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Benchmark</span>
                    <span className="font-medium">{portfolio.benchmark_name}</span>
                  </div>
                )}
                {portfolio.positions_count !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Positions</span>
                    <span className="font-medium">{portfolio.positions_count}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {portfolios.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No portfolios found.
        </div>
      )}
    </div>
  );
}
