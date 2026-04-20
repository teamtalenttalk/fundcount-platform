import { useState, useEffect } from 'react';
import { Loader2, Users, DollarSign, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatPercent } from '@/lib/format';
import type { Partner } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', type: 'limited', email: '', commitment: '' });

  const fetchPartners = async () => {
    try {
      const response = await api.get('/partners');
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setPartners(data);
    } catch {
      setError('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPartners(); }, []);

  const handleAdd = async () => {
    try {
      await api.post('/partners', {
        name: form.name,
        code: form.code,
        type: form.type,
        email: form.email,
        commitment: parseFloat(form.commitment) || 0,
      });
      setDialogOpen(false);
      setForm({ name: '', code: '', type: 'limited', email: '', commitment: '' });
      fetchPartners();
    } catch {
      setError('Failed to add partner');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error && partners.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const totalCommitment = partners.reduce((s, p) => s + p.commitment, 0);
  const totalFunded = partners.reduce((s, p) => s + p.funded, 0);
  const totalDistributed = 0; // derived from capital accounts

  const summaryCards = [
    { label: 'Total Partners', value: partners.length.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Commitments', value: formatCurrency(totalCommitment), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Total Paid-In', value: formatCurrency(totalFunded), icon: ArrowUpRight, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Total Distributed', value: formatCurrency(totalDistributed), icon: ArrowDownRight, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage fund partners and commitments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2" />Add Partner
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Partner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="general">General Partner (GP)</option>
                  <option value="limited">Limited Partner (LP)</option>
                </select>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Commitment</Label>
                <Input type="number" value={form.commitment} onChange={(e) => setForm({ ...form, commitment: e.target.value })} />
              </div>
              <Button className="w-full" onClick={handleAdd}>Add Partner</Button>
            </div>
          </DialogContent>
        </Dialog>
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
          <CardTitle>All Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Commitment</TableHead>
                <TableHead className="text-right">Paid-In Capital</TableHead>
                <TableHead className="text-right">Distributed</TableHead>
                <TableHead className="text-right">Ownership%</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <Badge variant={p.type === 'general' ? 'default' : 'secondary'} className={p.type === 'general' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                      {p.type === 'general' ? 'GP' : 'LP'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(p.commitment)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.funded)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                  <TableCell className="text-right">{formatPercent(p.ownership_pct)}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                      {p.status}
                    </Badge>
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
