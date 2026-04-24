import { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileText,
} from 'lucide-react';
import api from '@/lib/api';
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
import { toast } from 'sonner';

interface Deadline {
  filing: string;
  regulator: string;
  jurisdiction: string;
  deadline: string;
  days_remaining: number;
  status: string;
  description: string;
}

interface TestResult {
  check: string;
  status: string;
  detail: string;
  checked_at: string;
}

interface DashboardData {
  compliance_score: number;
  score_breakdown: {
    total_checks: number;
    passed: number;
    failed: number;
    categories: Record<string, string>;
  };
  upcoming_deadlines: Deadline[];
  recent_test_results: TestResult[];
  filing_status_counts: {
    filed: number;
    pending: number;
    overdue: number;
    upcoming: number;
  };
  portfolio_summary: {
    total_portfolios: number;
    total_aum: number;
    active_positions: number;
    total_unrealized_pnl: number;
  };
}

function getScoreColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getDeadlineStatusColor(status: string) {
  switch (status) {
    case 'OVERDUE':
      return 'bg-red-100 text-red-700';
    case 'DUE_SOON':
      return 'bg-yellow-100 text-yellow-700';
    case 'FILED':
      return 'bg-emerald-100 text-emerald-700';
    case 'ON_TRACK':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getTestStatusBadge(status: string) {
  switch (status) {
    case 'PASS':
      return 'bg-emerald-100 text-emerald-700';
    case 'FAIL':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function ComplianceDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<DashboardData>('/compliance/dashboard');
        setData(response.data);
      } catch {
        toast.error('Failed to load compliance dashboard data');
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

  const scoreAngle = (data.compliance_score / 100) * 180;
  const scoreColor = getScoreColor(data.compliance_score);
  const bd = data.score_breakdown;

  const statCards = [
    { label: 'Total Checks', value: bd.total_checks.toString(), icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Passed', value: bd.passed.toString(), icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Failed', value: bd.failed.toString(), icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Upcoming Deadlines', value: data.upcoming_deadlines.filter(d => d.status !== 'FILED').length.toString(), icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  ];

  const fsc = data.filing_status_counts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Regulatory compliance overview, test results, and upcoming deadlines
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 200 120" className="w-48 h-28">
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={scoreColor} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${(scoreAngle / 180) * 251.2} 251.2`} />
                <line x1="100" y1="100" x2={100 + 60 * Math.cos(Math.PI - (scoreAngle * Math.PI) / 180)} y2={100 - 60 * Math.sin(Math.PI - (scoreAngle * Math.PI) / 180)} stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="100" cy="100" r="4" fill="#374151" />
                <text x="100" y="90" textAnchor="middle" fill="#111827" fontSize="24" fontWeight="bold">{data.compliance_score}</text>
              </svg>
              <p className="text-sm font-medium mt-2" style={{ color: scoreColor }}>
                {data.compliance_score >= 80 ? 'Compliant' : data.compliance_score >= 60 ? 'Needs Attention' : 'Non-Compliant'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Regulatory Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcoming_deadlines.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge className={getDeadlineStatusColor(d.status)}>{d.status.replace(/_/g, ' ')}</Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.filing}</p>
                      <p className="text-xs text-gray-500">{d.regulator} ({d.jurisdiction}) - {d.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600 font-mono">{d.deadline}</span>
                    {d.days_remaining > 0 && (
                      <p className="text-xs text-gray-400">{Math.ceil(d.days_remaining)}d remaining</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Recent Compliance Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Checked At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recent_test_results.map((test, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{test.check}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs">{test.detail}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getTestStatusBadge(test.status)}>
                      {test.status === 'PASS' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {test.status === 'FAIL' && <XCircle className="w-3 h-3 mr-1" />}
                      {test.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{new Date(test.checked_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Filing Status Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-2xl font-bold text-emerald-700">{fsc.filed}</p>
              <p className="text-sm text-emerald-600">Filed</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
              <p className="text-2xl font-bold text-yellow-700">{fsc.pending}</p>
              <p className="text-sm text-yellow-600">Pending</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-center">
              <p className="text-2xl font-bold text-red-700">{fsc.overdue}</p>
              <p className="text-sm text-red-600">Overdue</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <p className="text-2xl font-bold text-blue-700">{fsc.upcoming}</p>
              <p className="text-sm text-blue-600">Upcoming</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
