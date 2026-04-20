import { useState, useEffect } from 'react';
import { Loader2, Users, ShieldCheck, Clock, DollarSign, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Investor {
  id: number;
  name: string;
  email: string;
  partner_name: string;
  kyc_status: string;
  risk_profile: string;
  is_accredited: boolean;
  aum: number;
}

export default function InvestorPortalPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/investors');
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setInvestors(data);
      } catch {
        setError('Failed to load investor data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const totalInvestors = investors.length;
  const accredited = investors.filter((i) => i.is_accredited).length;
  const pendingKyc = investors.filter((i) => i.kyc_status === 'pending').length;
  const totalAum = investors.reduce((s, i) => s + (i.aum || 0), 0);

  const summaryCards = [
    { label: 'Total Investors', value: totalInvestors.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Accredited', value: accredited.toString(), icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Pending KYC', value: pendingKyc.toString(), icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Total AUM', value: formatCurrency(totalAum), icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const kycBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Investor Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Manage investor profiles and KYC status</p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Investor Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Risk Profile</TableHead>
                <TableHead className="text-center">Accredited</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investors.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.name}</TableCell>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell>{inv.partner_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={kycBadgeColor(inv.kyc_status)}>
                      {inv.kyc_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{inv.risk_profile}</TableCell>
                  <TableCell className="text-center">
                    {inv.is_accredited && <CheckCircle2 className="w-5 h-5 text-emerald-500 inline" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
