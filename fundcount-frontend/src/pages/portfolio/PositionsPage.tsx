import { useState, useEffect } from 'react';
import { Loader2, DollarSign, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Position } from '@/types';

interface PositionWithPortfolio extends Position {
  portfolio_name?: string;
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<PositionWithPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await api.get('/positions');
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setPositions(data);
      } catch {
        setError('Failed to load positions');
      } finally {
        setLoading(false);
      }
    };
    fetchPositions();
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

  const totalMarketValue = positions.reduce((sum, p) => sum + p.market_value, 0);
  const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealized_pnl, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Positions</h1>
        <p className="text-sm text-gray-500 mt-1">Current portfolio holdings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Market Value</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalMarketValue)}</p>
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
                <p className="text-sm text-muted-foreground">Total Unrealized P&L</p>
                <p className={`text-2xl font-bold mt-1 ${totalUnrealizedPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(totalUnrealizedPnl)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${totalUnrealizedPnl >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <TrendingUp className={`w-5 h-5 ${totalUnrealizedPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Portfolio</TableHead>
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
                    <TableCell>{pos.portfolio_name || `Portfolio #${pos.portfolio_id}`}</TableCell>
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
          {positions.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No positions found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
