import { useState, useEffect } from 'react';
import {
  Loader2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  RefreshCw,
  Check,
  Users,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
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

interface PlanLimits {
  users: number;
  funds: number;
  api_calls: number;
  storage_gb: number;
}

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  limits: PlanLimits;
  active_subscribers: number;
}

interface Invoice {
  id: string;
  tenant: string;
  plan: string;
  amount: number;
  status: string;
  date: string;
  paid_date: string;
  method: string;
}

interface Revenue {
  mrr: number;
  arr: number;
  total_collected: number;
  outstanding: number;
  churn_rate: number;
  avg_revenue_per_tenant: number;
}

interface BillingData {
  plans: Plan[];
  invoices: Invoice[];
  revenue: Revenue;
}

function getInvoiceStatusColor(status: string) {
  switch (status) {
    case 'PAID': return 'bg-emerald-100 text-emerald-700';
    case 'OVERDUE': return 'bg-red-100 text-red-700';
    case 'TRIAL': return 'bg-blue-100 text-blue-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<BillingData>('/enterprise/billing');
      setData(response.data);
    } catch {
      toast.error('Failed to load billing data');
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

  const r = data.revenue;

  const statCards = [
    { label: 'Monthly Recurring Revenue', value: formatCurrency(r.mrr), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Annual Recurring Revenue', value: formatCurrency(r.arr), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Collected', value: formatCurrency(r.total_collected), icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Outstanding', value: formatCurrency(r.outstanding), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Revenue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Subscription plans, invoices, revenue metrics, and payment management
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
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

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Churn Rate</p>
            <p className="text-lg font-bold mt-1 text-yellow-600">{r.churn_rate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Avg Revenue / Tenant</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(r.avg_revenue_per_tenant)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            Subscription Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.plans.map((plan) => (
              <div key={plan.id} className="p-5 rounded-lg border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                  <Badge className="bg-emerald-100 text-emerald-700">
                    <Users className="w-3 h-3 mr-1" />
                    {plan.active_subscribers}
                  </Badge>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price_monthly}</span>
                  <span className="text-sm text-gray-500">/mo</span>
                  <p className="text-xs text-gray-400 mt-0.5">${plan.price_annual}/yr (save {Math.round((1 - plan.price_annual / (plan.price_monthly * 12)) * 100)}%)</p>
                </div>
                <div className="space-y-2 mb-4 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Limits</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <span>{plan.limits.users} users</span>
                    <span>{plan.limits.funds} funds</span>
                    <span>{plan.limits.api_calls.toLocaleString()} API calls</span>
                    <span>{plan.limits.storage_gb} GB storage</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-500" />
            Recent Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm font-medium">{inv.id}</TableCell>
                  <TableCell className="font-medium text-gray-900">{inv.tenant}</TableCell>
                  <TableCell className="text-sm text-gray-600">{inv.plan}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCurrency(inv.amount)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getInvoiceStatusColor(inv.status)}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{inv.date}</TableCell>
                  <TableCell className="text-sm text-gray-500">{inv.paid_date || '-'}</TableCell>
                  <TableCell className="text-sm text-gray-500">{inv.method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
