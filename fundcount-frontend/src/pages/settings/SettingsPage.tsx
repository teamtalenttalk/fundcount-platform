import { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

interface Settings {
  company_name: string;
  base_currency: string;
  fiscal_year_start: string;
  accounting_method: string;
  auto_post_journals: boolean;
}

interface UserRecord {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_base: boolean;
  is_active: boolean;
}

interface FiscalPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    company_name: '',
    base_currency: 'USD',
    fiscal_year_start: '01-01',
    accounting_method: 'accrual',
    auto_post_journals: false,
  });
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'viewer', password: '' });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [settingsRes, usersRes, currenciesRes, periodsRes] = await Promise.all([
          api.get('/settings').catch(() => ({ data: null })),
          api.get('/users').catch(() => ({ data: [] })),
          api.get('/currencies').catch(() => ({ data: [] })),
          api.get('/fiscal-periods').catch(() => ({ data: [] })),
        ]);
        if (settingsRes.data) setSettings(settingsRes.data);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || []);
        setCurrencies(Array.isArray(currenciesRes.data) ? currenciesRes.data : currenciesRes.data?.items || []);
        setFiscalPeriods(Array.isArray(periodsRes.data) ? periodsRes.data : periodsRes.data?.items || []);
      } catch {
        // partial loads are ok
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
    } catch {
      // handle silently
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async () => {
    try {
      await api.post('/users', newUser);
      setNewUser({ full_name: '', email: '', role: 'viewer', password: '' });
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : res.data?.items || []);
    } catch {
      // handle silently
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform configuration and administration</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="accounting">Accounting</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal Periods</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Base Currency</Label>
                <Input
                  value={settings.base_currency}
                  onChange={(e) => setSettings({ ...settings, base_currency: e.target.value })}
                />
              </div>
              <div>
                <Label>Fiscal Year Start (MM-DD)</Label>
                <Input
                  value={settings.fiscal_year_start}
                  onChange={(e) => setSettings({ ...settings, fiscal_year_start: e.target.value })}
                />
              </div>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounting">
          <Card>
            <CardHeader>
              <CardTitle>Accounting Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Accounting Method</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={settings.accounting_method}
                  onChange={(e) => setSettings({ ...settings, accounting_method: e.target.value })}
                >
                  <option value="accrual">Accrual</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.auto_post_journals}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_post_journals: checked })}
                />
                <Label>Auto-post journal entries</Label>
              </div>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell className="capitalize">{u.role}</TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? 'default' : 'secondary'}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Add User</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="admin">Admin</option>
                      <option value="accountant">Accountant</option>
                      <option value="viewer">Viewer</option>
                      <option value="investor">Investor</option>
                    </select>
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                  </div>
                </div>
                <Button className="mt-3" onClick={handleAddUser}>
                  <Plus className="w-4 h-4 mr-2" />Add User
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currencies">
          <Card>
            <CardHeader>
              <CardTitle>Currencies</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Exchange Rate</TableHead>
                    <TableHead className="text-center">Base</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.code}</TableCell>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.symbol}</TableCell>
                      <TableCell className="text-right">{c.exchange_rate.toFixed(4)}</TableCell>
                      <TableCell className="text-center">
                        {c.is_base && <Badge>Base</Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={c.is_active ? 'default' : 'secondary'}>
                          {c.is_active ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal">
          <Card>
            <CardHeader>
              <CardTitle>Fiscal Periods</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fiscalPeriods.map((fp) => (
                    <TableRow key={fp.id}>
                      <TableCell className="font-medium">{fp.name}</TableCell>
                      <TableCell>{fp.start_date}</TableCell>
                      <TableCell>{fp.end_date}</TableCell>
                      <TableCell>
                        <Badge variant={fp.is_closed ? 'secondary' : 'default'}>
                          {fp.is_closed ? 'Closed' : 'Open'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
