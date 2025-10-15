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
import { PaymentModal } from '@/components/ui/payment-modal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Trash2,
  Edit,
  Eye,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Briefcase,
} from 'lucide-react';

interface JobPost {
  id: string;
  title: string;
  job_type: string;
  classification: string;
  location: string;
  salary: string | null;
  description: string;
  requirements: string;
  benefits: string | null;
  status: string;
  payment_status: string;
  amount_cents: number;
  created_at: string;
  updated_at: string;
  is_deleted?: boolean;
  company_name?: string;
  company_address?: string | null;
  company_phone?: string | null;
  company_email?: string | null;
  company_website?: string | null;
  company_description?: string | null;
}

export function JobStaging({
  onNavigateToPostJob,
}: {
  onNavigateToPostJob?: (jobId?: string) => void;
}) {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
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
          description: `Client profile not found: ${clientError.message}`,
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase
        .from('job_posts')
        .select('*')
        .eq('client_id', clientData.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch draft job posts',
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

  const deleteJob = async (jobId: string, jobTitle: string) => {
    try {
      const { error } = await supabase
        .from('job_posts')
        .update({ is_deleted: true } as any)
        .eq('id', jobId);

      if (error) {
        throw error;
      }

      setJobs(jobs.filter(job => job.id !== jobId));
      toast({
        title: 'Success',
        description: `"${jobTitle}" draft has been deleted.`,
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job draft',
        variant: 'destructive',
      });
    }
  };

  const handlePostJob = (job: JobPost) => {
    setSelectedJob(job);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    if (selectedJob) {
      // Remove the job from staging since it's now posted
      setJobs(jobs.filter(job => job.id !== selectedJob.id));
      toast({
        title: 'Job Posted Successfully',
        description: 'Your job has been posted and is now live after payment.',
      });
      setSelectedJob(null);
    }
  };

  const getClassificationIcon = (classification: string) => {
    return classification === 'STANDARD' ? (
      <Users className="w-4 h-4" />
    ) : (
      <Briefcase className="w-4 h-4" />
    );
  };

  const formatAmount = (amountCents: number) => {
    return `$${(amountCents / 100).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.company_name &&
        job.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Job Staging
          </h1>
          <p className="text-gray-600">
            Manage your draft jobs and prepare them for posting.
          </p>
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
          Job Staging
        </h1>
        <p className="text-gray-600">
          Manage your draft jobs and prepare them for posting.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search draft jobs..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Draft Jobs ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No draft jobs found</p>
              <Button
                className="bg-orange text-orange-foreground hover:bg-orange/90"
                onClick={() => onNavigateToPostJob && onNavigateToPostJob()}
              >
                Create New Job Draft
              </Button>
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
                  <TableHead>Created</TableHead>
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
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(job.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (onNavigateToPostJob) {
                              onNavigateToPostJob(job.id);
                            }
                          }}
                          title="Continue editing this draft"
                        >
                          <Edit className="w-4 h-4" />
                        </Button> */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePostJob(job)}
                          title="Post this job (requires payment)"
                          className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteJob(job.id, job.title)}
                          title="Delete this draft"
                          className="text-red-600 hover:bg-red-50 border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedJob && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedJob(null);
          }}
          onSuccess={handlePaymentSuccess}
          jobTitle={selectedJob.title}
          companyName={selectedJob.company_name || 'Unknown Company'}
          jobClassification={
            selectedJob.classification as 'STANDARD' | 'PREMIUM'
          }
          jobData={{
            title: selectedJob.title,
            type: selectedJob.job_type as
              | 'full-time'
              | 'part-time'
              | 'contract'
              | 'temporary',
            classification: selectedJob.classification as
              | 'STANDARD'
              | 'PREMIUM',
            location: selectedJob.location,
            salary: selectedJob.salary || '',
            description: selectedJob.description,
            requirements: selectedJob.requirements,
            benefits: selectedJob.benefits || '',
          }}
          companyData={{
            name: selectedJob.company_name || '',
            address: selectedJob.company_address || '',
            phone: selectedJob.company_phone || '',
            email: selectedJob.company_email || '',
            website: selectedJob.company_website || '',
            description: selectedJob.company_description || '',
          }}
          existingJobId={selectedJob.id}
        />
      )}
    </div>
  );
}
