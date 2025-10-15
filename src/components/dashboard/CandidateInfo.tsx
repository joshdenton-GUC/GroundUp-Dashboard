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
import { useJobHiring } from '@/contexts/JobHiringContext';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function CandidateInfo() {
  const { state } = useJobHiring();
  const { toast } = useToast();
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentClient, setCurrentClient] = useState<any>(null);

  // Helper function to send job status update alerts
  const sendJobStatusAlert = async (
    candidateId: string,
    candidateName: string,
    newStatus: 'interviewing' | 'hired' | 'not_hired'
  ) => {
    try {
      // Get candidate and client details for the alert
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .select(
          `
          id,
          full_name,
          client_id,
          clients!inner(
            id,
            company_name,
            user_id,
            profiles!inner(
              email,
              full_name
            )
          )
        `
        )
        .eq('id', candidateId)
        .single();

      if (candidateError || !candidateData) {
        console.error(
          'Error fetching candidate data for alert:',
          candidateError
        );
        return;
      }

      // Send the alert via Supabase function
      // The function will fetch admin emails and configured recipients using service role key
      const { error: functionError } = await supabase.functions.invoke(
        'send-email-alert',
        {
          body: {
            alertType: 'job_status_update',
            clientName: candidateData.clients.profiles.full_name || 'Client',
            clientEmail: candidateData.clients.profiles.email || '',
            companyName: candidateData.clients.company_name || 'Company',
            jobTitle: 'Job Position', // We can enhance this later to get actual job title
            jobStatus: newStatus,
            candidateName: candidateName,
            dashboardUrl: `${window.location.origin}/dashboard/candidate-info`,
          },
        }
      );

      if (functionError) {
        console.error('Error sending job status alert:', functionError);
        return;
      }

      console.log(`Job status alert sent successfully for ${newStatus} status`);
    } catch (error) {
      console.error('Error triggering job status alert:', error);
    }
  };

  // Fetch current user's client information and candidates
  useEffect(() => {
    const fetchClientAndCandidates = async () => {
      if (!user) return;

      try {
        // Get current client information
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (clientError && clientError.code !== 'PGRST116') {
          console.error('Error fetching client:', clientError);
        } else if (client) {
          setCurrentClient(client);

          // Fetch candidates uploaded by this client or assigned to this client
          // Exclude pending_review and rejected candidates
          const { data: candidatesData, error: candidatesError } =
            await supabase
              .from('candidates')
              .select(
                'id, full_name, status, created_at, uploaded_by, client_id, education, skills, summary, experience_years'
              )
              .or(`client_id.eq.${client.id},uploaded_by.eq.${user.id}`)
              .not('status', 'in', '(pending_review,rejected)')
              .order('created_at', { ascending: false });

          if (candidatesError) {
            console.error('Error fetching candidates:', candidatesError);
          } else {
            setCandidates(candidatesData || []);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientAndCandidates();
  }, [user]);

  const handleHire = async (
    candidateId: string,
    jobId: string,
    candidateName: string
  ) => {
    await changeCandidateStatusWithUndo(candidateId, candidateName, 'hired');
  };

  const handleNotHired = async (candidateId: string, candidateName: string) => {
    await changeCandidateStatusWithUndo(
      candidateId,
      candidateName,
      'not_hired'
    );
  };

  const handleInterviewing = async (
    candidateId: string,
    candidateName: string
  ) => {
    await changeCandidateStatusWithUndo(
      candidateId,
      candidateName,
      'interviewing'
    );
  };

  const changeCandidateStatusWithUndo = async (
    candidateId: string,
    candidateName: string,
    newStatus: 'interviewing' | 'hired' | 'not_hired'
  ) => {
    const previous = candidates.find(c => c.id === candidateId);
    const previousStatus = previous?.status as
      | 'pending'
      | 'reviewing'
      | 'interviewing'
      | 'interviewed'
      | 'hired'
      | 'not_hired'
      | 'rejected'
      | undefined;

    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', candidateId);

      if (error) {
        console.error('Error updating candidate status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update candidate status. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // optimistic local update
      setCandidates(prevCandidates =>
        prevCandidates.map(candidate =>
          candidate.id === candidateId
            ? { ...candidate, status: newStatus }
            : candidate
        )
      );

      // fire-and-forget alert (non-blocking)
      sendJobStatusAlert(candidateId, candidateName, newStatus).catch(err => {
        console.error('Error sending job status alert:', err);
      });

      const toastTitle =
        newStatus === 'hired'
          ? 'Candidate Hired'
          : newStatus === 'not_hired'
          ? 'Candidate Not Hired'
          : 'Status Updated';
      const toastDescription =
        newStatus === 'hired'
          ? `${candidateName} has been successfully hired.`
          : newStatus === 'not_hired'
          ? `${candidateName} has been marked as not hired.`
          : `${candidateName} has been marked as interviewing.`;

      const { dismiss } = toast({
        title: toastTitle,
        description: toastDescription,
        action: (
          <ToastAction
            altText="Undo status change"
            onClick={async () => {
              if (!previousStatus) return;
              try {
                const { error: revertError } = await supabase
                  .from('candidates')
                  .update({ status: previousStatus })
                  .eq('id', candidateId);
                if (revertError) {
                  console.error('Error reverting status:', revertError);
                  toast({
                    title: 'Undo Failed',
                    description:
                      'Could not revert the change. Please try again later.',
                    variant: 'destructive',
                  });
                  return;
                }
                setCandidates(prevCandidates =>
                  prevCandidates.map(candidate =>
                    candidate.id === candidateId
                      ? { ...candidate, status: previousStatus }
                      : candidate
                  )
                );
                toast({
                  title: 'Change Reverted',
                  description: `Restored ${candidateName} to ${previousStatus.replace(
                    '_',
                    ' '
                  )}.`,
                });
              } catch (e) {
                console.error('Error reverting candidate status:', e);
              } finally {
                dismiss();
              }
            }}
          >
            Undo
          </ToastAction>
        ),
      });
    } catch (error) {
      console.error('Error updating candidate status:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary', label: 'Pending' },
      reviewing: { variant: 'secondary', label: 'Reviewing' },
      interviewing: { variant: 'default', label: 'Interviewing' },
      interviewed: { variant: 'default', label: 'Interviewed' },
      hired: { variant: 'default', label: 'Hired' },
      not_hired: { variant: 'destructive', label: 'Not Hired' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    } as const;

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.reviewing;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getJobTitle = (jobId: string) => {
    const job = state.jobs.find(j => j.id === jobId);
    return job?.title || 'Available for Assignment';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          My Candidates
        </h1>
        <p className="text-gray-600">
          View candidates you've uploaded and those assigned to you by admins.
        </p>
      </div>

      <Card className="bg-white border border-gray-200">
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle className="text-lg font-medium">
            📋 All Candidates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  Candidate Name
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Position
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Location
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Source
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Submit Date
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">
                        Loading candidates...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map(candidate => (
                  <TableRow key={candidate.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">
                      {candidate.full_name}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {getJobTitle(candidate.jobId || '')}
                    </TableCell>
                    <TableCell className="text-gray-700">-</TableCell>
                    <TableCell className="text-gray-700">
                      {candidate.uploaded_by === user?.id ? (
                        <Badge variant="secondary">You Uploaded</Badge>
                      ) : (
                        <Badge variant="outline">Admin Assigned</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {candidate.status !== 'hired' &&
                          candidate.status !== 'not_hired' && (
                            <>
                              {candidate.status !== 'interviewing' && (
                                <Button
                                  onClick={() =>
                                    handleInterviewing(
                                      candidate.id,
                                      candidate.full_name
                                    )
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  size="sm"
                                >
                                  Interviewing
                                </Button>
                              )}
                              <Button
                                onClick={() =>
                                  handleHire(
                                    candidate.id,
                                    candidate.jobId || '',
                                    candidate.full_name
                                  )
                                }
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                              >
                                Hire
                              </Button>
                              <Button
                                onClick={() =>
                                  handleNotHired(
                                    candidate.id,
                                    candidate.full_name
                                  )
                                }
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                size="sm"
                              >
                                Not Hired
                              </Button>
                            </>
                          )}
                        {(candidate.status === 'hired' ||
                          candidate.status === 'not_hired') && (
                          <span className="text-sm text-gray-500 italic">
                            Decision Made
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && candidates.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>No candidates found.</p>
              <p className="text-sm mt-2">
                Candidates you upload or those assigned by admins will appear
                here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📊 Record Keeping</h3>
        <p className="text-blue-800 text-sm">
          Use the "Hire" and "Not Hired" buttons to keep track of hiring
          decisions. Hired candidates will be moved to the Hired Talent section
          with probation tracking.
        </p>
      </div>
    </div>
  );
}
