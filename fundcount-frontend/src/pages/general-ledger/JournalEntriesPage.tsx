import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { JournalEntry, Account } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  posted: 'bg-green-100 text-green-800',
  reversed: 'bg-red-100 text-red-800',
};

const STATUS_CARD: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-500', bg: 'bg-gray-50' },
  pending: { label: 'Pending', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  approved: { label: 'Approved', color: 'text-blue-500', bg: 'bg-blue-50' },
  posted: { label: 'Posted', color: 'text-green-500', bg: 'bg-green-50' },
};

interface LineForm {
  account_id: string;
  description: string;
  debit: string;
  credit: string;
}

interface EntryForm {
  date: string;
  description: string;
  reference: string;
  lines: LineForm[];
}

const emptyLine: LineForm = { account_id: '', description: '', debit: '', credit: '' };

const emptyForm: EntryForm = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  reference: '',
  lines: [{ ...emptyLine }, { ...emptyLine }],
};

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EntryForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = async () => {
    try {
      const response = await api.get('/journal-entries');
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setEntries(data);
    } catch {
      setError('Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setAccounts(data);
    } catch {
      // Accounts are optional for the form
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchAccounts();
  }, []);

  const filteredEntries = entries.filter((e) => !statusFilter || e.status === statusFilter);

  const statusCounts = Object.keys(STATUS_CARD).reduce(
    (acc, status) => {
      acc[status] = entries.filter((e) => e.status === status).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalDebits = (lines: LineForm[]) =>
    lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredits = (lines: LineForm[]) =>
    lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

  const isBalanced = totalDebits(form.lines) === totalCredits(form.lines) && totalDebits(form.lines) > 0;

  const updateLine = (index: number, field: keyof LineForm, value: string) => {
    const newLines = [...form.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setForm({ ...form, lines: newLines });
  };

  const addLine = () => {
    setForm({ ...form, lines: [...form.lines, { ...emptyLine }] });
  };

  const removeLine = (index: number) => {
    if (form.lines.length <= 2) return;
    setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;
    setSubmitting(true);
    try {
      await api.post('/journal-entries', {
        date: form.date,
        description: form.description,
        reference: form.reference,
        lines: form.lines
          .filter((l) => l.account_id)
          .map((l) => ({
            account_id: parseInt(l.account_id),
            description: l.description,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
          })),
      });
      setDialogOpen(false);
      setForm(emptyForm);
      fetchEntries();
    } catch {
      setError('Failed to create journal entry');
    } finally {
      setSubmitting(false);
    }
  };

  const getEntryTotal = (entry: JournalEntry) =>
    entry.lines?.reduce((sum, l) => sum + l.debit, 0) || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
          <p className="text-sm text-gray-500 mt-1">Record and manage journal entries</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Journal Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="REF-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Input
                    id="desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Entry description"
                    required
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    <Plus className="w-3 h-3 mr-1" /> Add Line
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Account</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Description</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">Debit</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">Credit</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.lines.map((line, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">
                            <select
                              className="w-full h-8 rounded border border-input bg-transparent px-2 text-sm"
                              value={line.account_id}
                              onChange={(e) => updateLine(i, 'account_id', e.target.value)}
                            >
                              <option value="">Select account</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.code} - {a.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-8"
                              value={line.description}
                              onChange={(e) => updateLine(i, 'description', e.target.value)}
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-8 text-right"
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.debit}
                              onChange={(e) => updateLine(i, 'debit', e.target.value)}
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              className="h-8 text-right"
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.credit}
                              onChange={(e) => updateLine(i, 'credit', e.target.value)}
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeLine(i)}
                              disabled={form.lines.length <= 2}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t bg-gray-50 font-medium">
                        <td colSpan={2} className="px-3 py-2 text-right">Totals</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatCurrency(totalDebits(form.lines))}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatCurrency(totalCredits(form.lines))}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {totalDebits(form.lines) > 0 && !isBalanced && (
                  <p className="text-xs text-red-500">
                    Debits and credits must be equal. Difference:{' '}
                    {formatCurrency(Math.abs(totalDebits(form.lines) - totalCredits(form.lines)))}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting || !isBalanced}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Entry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(STATUS_CARD).map(([status, config]) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                  <p className="text-2xl font-bold mt-1">{statusCounts[status] || 0}</p>
                </div>
                <div className={`p-3 rounded-xl ${config.bg}`}>
                  <div className={`w-3 h-3 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('')}
        >
          All
        </Button>
        {Object.entries(STATUS_CARD).map(([status, config]) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {config.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No journal entries found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <>
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                    >
                      <TableCell>
                        {expandedRow === entry.id ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{entry.entry_number}</TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell className="font-medium">{entry.description}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.reference || '-'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[entry.status]}`}>
                          {entry.status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(getEntryTotal(entry))}
                      </TableCell>
                    </TableRow>
                    {expandedRow === entry.id && entry.lines && (
                      <TableRow key={`${entry.id}-lines`}>
                        <TableCell colSpan={7} className="bg-gray-50 p-0">
                          <div className="px-8 py-3">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-gray-500 uppercase">
                                  <th className="text-left pb-2">Account</th>
                                  <th className="text-left pb-2">Description</th>
                                  <th className="text-right pb-2">Debit</th>
                                  <th className="text-right pb-2">Credit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entry.lines.map((line) => (
                                  <tr key={line.id} className="border-t border-gray-200">
                                    <td className="py-1.5 font-mono text-xs">
                                      {line.account_code} - {line.account_name}
                                    </td>
                                    <td className="py-1.5 text-muted-foreground">
                                      {line.description || '-'}
                                    </td>
                                    <td className="py-1.5 text-right font-mono">
                                      {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                    </td>
                                    <td className="py-1.5 text-right font-mono">
                                      {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
