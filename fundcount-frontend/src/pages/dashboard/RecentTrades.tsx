import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';

interface RecentTradesProps {
  trades: Array<Record<string, unknown>>;
}

export default function RecentTrades({ trades }: RecentTradesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium text-gray-500">Trade #</th>
                <th className="pb-2 font-medium text-gray-500">Date</th>
                <th className="pb-2 font-medium text-gray-500">Portfolio</th>
                <th className="pb-2 font-medium text-gray-500">Asset</th>
                <th className="pb-2 font-medium text-gray-500">Type</th>
                <th className="pb-2 font-medium text-gray-500 text-right">Quantity</th>
                <th className="pb-2 font-medium text-gray-500 text-right">Price</th>
                <th className="pb-2 font-medium text-gray-500 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, idx) => {
                const portfolio = trade.portfolio as Record<string, unknown> | null;
                const asset = trade.asset as Record<string, unknown> | null;
                const tradeType = String(trade.trade_type || '');
                const isBuy = tradeType === 'BUY';
                return (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3 font-mono text-xs">{String(trade.trade_number || '')}</td>
                    <td className="py-3">{formatDate(String(trade.trade_date || ''))}</td>
                    <td className="py-3">{portfolio ? String(portfolio.name || '') : ''}</td>
                    <td className="py-3 font-medium">{asset ? String(asset.symbol || '') : ''}</td>
                    <td className="py-3">
                      <Badge className={isBuy ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                        {tradeType}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">{formatNumber(Number(trade.quantity || 0), 0)}</td>
                    <td className="py-3 text-right">{formatCurrency(Number(trade.price || 0))}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(Number(trade.total_amount || 0))}</td>
                  </tr>
                );
              })}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">No recent trades</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
