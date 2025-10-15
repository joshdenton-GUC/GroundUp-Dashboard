import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateJobPDF } from '@/lib/pdfGenerator';
import { triggerJobStatusAlert } from '@/lib/emailAlertTriggers';
import {
  Eye,
  Edit,
  Pause,
  Play,
  X,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Calendar,
  Building2,
  Users,
  Download,
} from 'lucide-react';

interface JobPost {
  id: string;
  title: string;
  job_type: string;
  classification: string;
  location: string;
  salary: string | null;
  status: string;
  payment_status: string;
  amount_cents: number;
  created_at: string;
  updated_at: string;
  posted_at: string | null;
  expires_at: string | null;
  client_id: string;
  stripe_payment_intent_id: string | null;
  stripe_price_id: string | null;
  is_deleted?: boolean;
  company_name?: string;
  company_address?: string | null;
  company_phone?: string | null;
  company_email?: string | null;
  company_website?: string | null;
  company_description?: string | null;
}

export function ManageJobs() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const fetchJobs = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get client ID for the current user
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientError || !clientData) {
        console.error('Client profile not found:', clientError);
        toast({
          title: 'Error',
          description: `Client profile not found:, ${clientError.message}`,
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase
        .from('job_posts')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch job posts',
          variant: 'destructive',
        });
        return;
      }

      // Filter out deleted jobs
      const filteredData = (data || []).filter(job => !(job as any).is_deleted);
      setJobs(filteredData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('job_posts')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) {
        throw error;
      }

      setJobs(
        jobs.map(job =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );

      // Trigger job status email alert for relevant status changes
      try {
        await triggerJobStatusAlert(jobId, newStatus);
      } catch (alertError) {
        console.error('Error sending job status alert:', alertError);
        // Don't fail the main operation if alert fails
      }

      toast({
        title: 'Success',
        description: `Job status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job status',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPDF = (job: JobPost) => {
    try {
      generateJobPDF(job);
      toast({
        title: 'Success',
        description: 'PDF download started',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const },
      pending_payment: {
        label: 'Pending Payment',
        variant: 'outline' as const,
      },
      posted: { label: 'Posted', variant: 'default' as const },
      filled: { label: 'Filled', variant: 'default' as const },
      paused: { label: 'Paused', variant: 'secondary' as const },
      canceled: { label: 'Canceled', variant: 'destructive' as const },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <div className="flex flex-col gap-1">
        <Badge variant={config.variant}>{config.label}</Badge>
        {paymentStatus === 'completed' && (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        )}
        {paymentStatus === 'failed' && (
          <Badge variant="destructive">Payment Failed</Badge>
        )}
      </div>
    );
  };

  const getClassificationIcon = (classification: string) => {
    return classification === 'STANDARD' ? (
      <Users className="w-4 h-4" />
    ) : (
      <Building2 className="w-4 h-4" />
    );
  };

  const formatAmount = (amountCents: number) => {
    return `$${(amountCents / 100).toLocaleString()}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.company_name &&
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Manage Job Posts
          </h1>
          <p className="text-gray-600">View and manage your job postings</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Manage Job Posts
        </h1>
        <p className="text-gray-600">View and manage your job postings</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
            <SelectItem value="posted">Posted</SelectItem>
            {/* <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem> */}
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Posts ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No job posts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map(job => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {job.company_name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getClassificationIcon(job.classification)}
                        <span className="text-sm">
                          {job.classification === 'STANDARD'
                            ? 'Standard'
                            : 'Premium'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {job.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        {formatAmount(job.amount_cents)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(job.status, job.payment_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(job.posted_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {}}
                          title="View job details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button> */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(job)}
                          title="Download job details as PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {/* {job.status === 'posted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateJobStatus(job.id, 'paused')}
                            title="Pause job posting"
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        {job.status === 'paused' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateJobStatus(job.id, 'posted')}
                            title="Resume job posting"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        {job.status !== 'filled' &&
                          job.status !== 'canceled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateJobStatus(job.id, 'canceled')
                              }
                              title="Cancel job posting"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )} */}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
