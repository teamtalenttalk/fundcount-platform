import { useState, useEffect } from 'react';
import {
  FileText,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Filing {
  id: string;
  filing_type: string;
  regulator: string;
  jurisdiction: string;
  period: string;
  deadline: string;
  status: string;
  filed_date: string | null;
  aum_reported: number | null;
  notes: string;
}

interface FilingsData {
  filings: Filing[];
  summary: {
    total: number;
    filed: number;
    pending: number;
    overdue: number;
    upcoming: number;
  };
}

type FilterTab = 'ALL' | 'FILED' | 'PENDING' | 'OVERDUE' | 'UPCOMING';

function getStatusBadge(status: string) {
  switch (status.toUpperCase()) {
    case 'FILED':
      return {
        className: 'bg-emerald-100 text-emerald-700',
        icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
      };
    case 'PENDING':
      return {
        className: 'bg-yellow-100 text-yellow-700',
        icon: <Clock className="w-3.5 h-3.5 mr-1" />,
      };
    case 'OVERDUE':
      return {
        className: 'bg-red-100 text-red-700',
        icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" />,
      };
    case 'UPCOMING':
      return {
        className: 'bg-blue-100 text-blue-700',
        icon: <CalendarClock className="w-3.5 h-3.5 mr-1" />,
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-600',
        icon: null,
      };
  }
}

function getRegulatorBadge(regulator: string) {
  switch (regulator.toUpperCase()) {
    case 'SEC':
      return 'bg-blue-100 text-blue-700';
    case 'CFTC':
      return 'bg-purple-100 text-purple-700';
    case 'FINRA':
      return 'bg-indigo-100 text-indigo-700';
    case 'NFA':
      return 'bg-cyan-100 text-cyan-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Filed', value: 'FILED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Upcoming', value: 'UPCOMING' },
];

export default function FilingsPage() {
  const [data, setData] = useState<FilingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<FilingsData>('/compliance/filings');
        setData(response.data);
      } catch {
        toast.error('Failed to load filings data');
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

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">No data available</p>
      </div>
    );
  }

  const filteredFilings =
    activeTab === 'ALL'
      ? data.filings
      : data.filings.filter((f) => f.status.toUpperCase() === activeTab);

  const statCards = [
    {
      label: 'Filed',
      value: data.summary.filed,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pending',
      value: data.summary.pending,
      icon: Clock,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Overdue',
      value: data.summary.overdue,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Upcoming',
      value: data.summary.upcoming,
      icon: CalendarClock,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Regulatory Filings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage and track regulatory filings across jurisdictions
        </p>
      </div>

      {/* Stat Cards */}
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

      {/* Filter Tabs + Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Filings ({data.summary.total} total)
            </CardTitle>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeTab === tab.value
                      ? 'bg-white text-gray-900 shadow-sm font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Filing Type</TableHead>
                <TableHead>Regulator</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Filed Date</TableHead>
                <TableHead className="text-right">AUM Reported</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFilings.map((filing) => {
                const badge = getStatusBadge(filing.status);
                return (
                  <TableRow key={filing.id}>
                    <TableCell className="font-mono text-sm">{filing.id}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {filing.filing_type}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRegulatorBadge(filing.regulator)}>
                        {filing.regulator}
                      </Badge>
                      <span className="ml-1 text-xs text-gray-400">{filing.jurisdiction}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {filing.period}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 font-mono">
                      {filing.deadline}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 font-mono">
                      {filing.filed_date || '--'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {filing.aum_reported != null
                        ? formatCurrency(filing.aum_reported)
                        : '--'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${badge.className} flex items-center justify-center w-fit mx-auto`}>
                        {badge.icon}
                        {filing.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {filing.notes}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredFilings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-400 py-4">
                    No filings found for this filter
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
