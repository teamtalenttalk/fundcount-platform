import { useState, useEffect } from 'react';
import {
  Loader2,
  FileText,
  Clock,
  Download,
  LayoutGrid,
  RefreshCw,
  CalendarClock,
  FileSpreadsheet,
  FileDown,
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
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Template {
  id: number;
  name: string;
  category: string;
  format: string;
  last_generated: string;
  schedule: string;
  recipients: number;
  status: string;
}

interface ScheduledJob {
  id: number;
  template: string;
  next_run: string;
  frequency: string;
  format: string;
  delivery: string;
  status: string;
}

interface RecentExport {
  id: number;
  report: string;
  format: string;
  size: string;
  generated_at: string;
  generated_by: string;
  download_count: number;
}

interface AvailableFieldGroup {
  category: string;
  fields: string[];
}

interface ReportBuilderData {
  templates: Template[];
  scheduled_jobs: ScheduledJob[];
  recent_exports: RecentExport[];
  available_fields: AvailableFieldGroup[];
}

function getTemplateStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-700';
    case 'DRAFT': return 'bg-gray-100 text-gray-700';
    case 'ARCHIVED': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getJobStatusColor(status: string) {
  switch (status) {
    case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
    case 'RUNNING': return 'bg-emerald-100 text-emerald-700';
    case 'PAUSED': return 'bg-yellow-100 text-yellow-700';
    case 'FAILED': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getFormatColor(format: string) {
  switch (format) {
    case 'PDF': return 'bg-red-100 text-red-700';
    case 'Excel': return 'bg-emerald-100 text-emerald-700';
    case 'CSV': return 'bg-blue-100 text-blue-700';
    case 'HTML': return 'bg-purple-100 text-purple-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export default function ReportBuilderPage() {
  const [data, setData] = useState<ReportBuilderData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get<ReportBuilderData>('/enterprise/report-builder');
      setData(response.data);
    } catch {
      toast.error('Failed to load report builder data');
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

  const activeTemplates = data.templates.filter(t => t.status === 'ACTIVE').length;
  const scheduledJobs = data.scheduled_jobs.filter(j => j.status === 'SCHEDULED').length;
  const totalExports = data.recent_exports.length;
  const totalFields = data.available_fields.reduce((sum, g) => sum + g.fields.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
          <p className="text-sm text-gray-500 mt-1">
            Custom report templates, scheduled generation, and export management
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Templates</p>
                <p className="text-xl font-bold mt-1">{activeTemplates}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50">
                <FileText className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Scheduled Jobs</p>
                <p className="text-xl font-bold mt-1">{scheduledJobs}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <CalendarClock className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Recent Exports</p>
                <p className="text-xl font-bold mt-1">{totalExports}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-50">
                <FileDown className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Available Fields</p>
                <p className="text-xl font-bold mt-1">{totalFields}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50">
                <LayoutGrid className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            Report Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead>Last Generated</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-gray-900">{t.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{t.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getFormatColor(t.format)}>{t.format}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{t.schedule}</TableCell>
                  <TableCell className="text-right font-mono">{t.recipients}</TableCell>
                  <TableCell className="text-sm text-gray-500">{t.last_generated}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getTemplateStatusColor(t.status)}>{t.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {data.templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-4">
                    No report templates found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Scheduled Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.scheduled_jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium text-gray-900">{job.template}</TableCell>
                  <TableCell className="text-sm font-mono text-gray-600">{job.next_run}</TableCell>
                  <TableCell className="text-sm text-gray-600">{job.frequency}</TableCell>
                  <TableCell>
                    <Badge className={getFormatColor(job.format)}>{job.format}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{job.delivery}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={getJobStatusColor(job.status)}>{job.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {data.scheduled_jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-4">
                    No scheduled jobs
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-yellow-500" />
            Recent Exports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Generated At</TableHead>
                <TableHead>Generated By</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recent_exports.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="font-medium text-gray-900">{exp.report}</TableCell>
                  <TableCell>
                    <Badge className={getFormatColor(exp.format)}>{exp.format}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 font-mono">{exp.size}</TableCell>
                  <TableCell className="text-sm text-gray-500">{new Date(exp.generated_at).toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-gray-600">{exp.generated_by}</TableCell>
                  <TableCell className="text-right font-mono">{exp.download_count}</TableCell>
                </TableRow>
              ))}
              {data.recent_exports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-4">
                    No recent exports
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-purple-500" />
            Available Report Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.available_fields.map((group) => (
              <div key={group.category}>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">{group.category}</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {group.fields.map((field) => (
                    <Badge key={field} variant="outline" className="text-xs bg-gray-50">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
