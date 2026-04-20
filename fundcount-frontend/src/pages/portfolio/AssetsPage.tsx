import { useState, useEffect } from 'react';
import { Loader2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { Asset } from '@/types';

const ASSET_CLASS_COLORS: Record<string, string> = {
  equity: 'bg-blue-100 text-blue-800',
  fixed_income: 'bg-purple-100 text-purple-800',
  derivative: 'bg-orange-100 text-orange-800',
  private_equity: 'bg-indigo-100 text-indigo-800',
  real_estate: 'bg-teal-100 text-teal-800',
  commodity: 'bg-yellow-100 text-yellow-800',
  cash: 'bg-gray-100 text-gray-800',
  currency: 'bg-gray-100 text-gray-800',
  alternative: 'bg-pink-100 text-pink-800',
};

const ASSET_CLASSES = [
  { value: 'all', label: 'All Classes' },
  { value: 'equity', label: 'Equity' },
  { value: 'fixed_income', label: 'Fixed Income' },
  { value: 'derivative', label: 'Derivative' },
  { value: 'commodity', label: 'Commodity' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'currency', label: 'Currency' },
  { value: 'alternative', label: 'Alternative' },
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    symbol: '', name: '', asset_class: 'equity', currency: 'USD', exchange: '',
  });

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await api.get('/assets');
        const data = Array.isArray(response.data) ? response.data : response.data.items || [];
        setAssets(data);
      } catch {
        setError('Failed to load assets');
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const handleAddAsset = async () => {
    try {
      const response = await api.post('/assets', newAsset);
      setAssets((prev) => [...prev, response.data]);
      setDialogOpen(false);
      setNewAsset({ symbol: '', name: '', asset_class: 'equity', currency: 'USD', exchange: '' });
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const filteredAssets = filter === 'all' ? assets : assets.filter((a) => a.asset_class === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your asset universe</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2" /> Add Asset
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Symbol</Label>
                <Input value={newAsset.symbol} onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value })} />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} />
              </div>
              <div>
                <Label>Asset Class</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newAsset.asset_class}
                  onChange={(e) => setNewAsset({ ...newAsset, asset_class: e.target.value })}
                >
                  {ASSET_CLASSES.filter((c) => c.value !== 'all').map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Currency</Label>
                <Input value={newAsset.currency} onChange={(e) => setNewAsset({ ...newAsset, currency: e.target.value })} />
              </div>
              <div>
                <Label>Exchange</Label>
                <Input value={newAsset.exchange} onChange={(e) => setNewAsset({ ...newAsset, exchange: e.target.value })} />
              </div>
              <Button onClick={handleAddAsset} className="w-full">Add Asset</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Filter by Asset Class</Label>
            <select
              className="border rounded-md px-3 py-2 text-sm w-[200px]"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {ASSET_CLASSES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Asset Class</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.symbol}</TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ASSET_CLASS_COLORS[asset.asset_class] || 'bg-gray-100 text-gray-800'}`}>
                        {asset.asset_class.replace('_', ' ').toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>{asset.asset_type}</TableCell>
                    <TableCell>{asset.exchange}</TableCell>
                    <TableCell className="text-right">{formatCurrency(asset.price, asset.currency)}</TableCell>
                    <TableCell>{asset.currency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredAssets.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No assets found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
