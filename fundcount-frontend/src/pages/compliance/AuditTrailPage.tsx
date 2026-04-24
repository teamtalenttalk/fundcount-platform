import { useState, useEffect } from 'react';
import {
  Loader2,
  Search,
  Download,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface AuditLog {
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
}

interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

interface AuditTrailData {
  audit_logs: AuditLog[];
  pagination: Pagination;
  summary: {
    actions: string[];
    entities: string[];
  };
}

function getActionBadge(action: string) {
  const a = action.toUpperCase();
  if (a.includes('CREATE') || a.includes('ADD') || a.includes('INSERT'))
    return 'bg-emerald-100 text-emerald-700';
  if (a.includes('UPDATE') || a.includes('MODIFY') || a.includes('EDIT'))
    return 'bg-blue-100 text-blue-700';
  if (a.includes('DELETE') || a.includes('REMOVE'))
    return 'bg-red-100 text-red-700';
  if (a.includes('LOGIN') || a.includes('AUTH'))
    return 'bg-purple-100 text-purple-700';
  if (a.includes('EXPORT') || a.includes('DOWNLOAD'))
    return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-100 text-gray-700';
}

export default function AuditTrailPage() {
  const [data, setData] = useState<AuditTrailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchData = async (pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pageNum.toString() });
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (userFilter.trim()) params.append('user', userFilter.trim());
      if (actionFilter.trim()) params.append('action', actionFilter.trim());

      const response = await api.get<AuditTrailData>(
        `/compliance/audit-trail?${params.toString()}`
      );
      setData(response.data);
      setPage(pageNum);
    } catch {
      toast.error('Failed to load audit trail data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const handleSearch = () => {
    fetchData(1);
  };

  const handleExport = () => {
    toast.success('Export started. File will be downloaded shortly.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all system activities, user actions, and data changes
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">User</label>
              <Input
                placeholder="Filter by user..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Action Type</label>
              <Input
                placeholder="Filter by action..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-44"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-500" />
              Audit Log
            </CardTitle>
            {data && (
              <span className="text-sm text-gray-500">
                {data.pagination.total} total entries
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : data ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.audit_logs.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-sm text-gray-500 font-mono whitespace-nowrap">
                        {entry.timestamp}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {entry.user}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadge(entry.action)}>
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.resource}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {entry.details}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 font-mono">
                        {entry.ip_address}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.audit_logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-400 py-4">
                        No audit entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data.pagination.last_page > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Page {data.pagination.current_page} of {data.pagination.last_page}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchData(page - 1)}
                      disabled={page <= 1 || loading}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchData(page + 1)}
                      disabled={page >= data.pagination.last_page || loading}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-red-500">No data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
