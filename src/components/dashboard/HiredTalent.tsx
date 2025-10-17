import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HiredCandidate {
  id: string;
  full_name: string;
  education: string | null;
  location: string | null;
  updated_at: string;
  job_post_id: string | null;
  resume_url: string | null;
  job_posts?: {
    id: string;
    title: string;
    location: string;
  } | null;
}

export function HiredTalent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hiredCandidates, setHiredCandidates] = useState<HiredCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch hired candidates from database
  useEffect(() => {
    const fetchHiredCandidates = async () => {
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
          // Fetch hired candidates with job post info
          const { data: candidatesData, error: candidatesError } =
            await supabase
              .from('candidates')
              .select(
                `
                id, 
                full_name, 
                education, 
                location,
                updated_at,
                job_post_id,
                resume_url,
                job_posts (
                  id,
                  title,
                  location
                )
              `
              )
              .or(`client_id.eq.${client.id},uploaded_by.eq.${user.id}`)
              .eq('status', 'hired')
              .order('updated_at', { ascending: false });

          if (candidatesError) {
            console.error('Error fetching hired candidates:', candidatesError);
          } else {
            setHiredCandidates(candidatesData || []);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHiredCandidates();
  }, [user]);

  // Update time every hour to refresh probation calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 3600000); // Update every hour

    return () => clearInterval(interval);
  }, []);

  const calculateDaysRemaining = (hireDate: string) => {
    const today = new Date();
    const hire = new Date(hireDate);
    const probationEndDate = new Date(hire);
    probationEndDate.setDate(probationEndDate.getDate() + 60);

    const diffTime = probationEndDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusColor = (daysRemaining: number) => {
    if (daysRemaining > 40) return 'text-green-600';
    if (daysRemaining > 20) return 'text-yellow-600';
    if (daysRemaining > 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusText = (daysRemaining: number) => {
    if (daysRemaining > 0) return `${daysRemaining} days remaining`;
    return 'Probation Complete';
  };

  const getJobTitle = (candidate: HiredCandidate) => {
    // Try to get the job title from the joined job_posts data
    if (candidate.job_posts && candidate.job_posts.title) {
      return candidate.job_posts.title;
    }
    return 'No Position Assigned';
  };

  const getLocation = (candidate: HiredCandidate) => {
    // First try candidate's location
    if (candidate.location) {
      return candidate.location;
    }
    // Then try job post location
    if (candidate.job_posts && candidate.job_posts.location) {
      return candidate.job_posts.location;
    }
    return '-';
  };

  const handleDownloadPDF = async (candidate: HiredCandidate) => {
    if (!candidate.resume_url) {
      toast({
        title: 'No Resume Available',
        description: `No resume has been uploaded for ${candidate.full_name}.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get the public URL from Supabase storage
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(candidate.resume_url);

      if (data?.publicUrl) {
        // Open the resume in a new tab
        window.open(data.publicUrl, '_blank');
        toast({
          title: 'Resume Opened',
          description: `Opening resume for ${candidate.full_name}.`,
        });
      } else {
        throw new Error('Could not generate resume URL');
      }
    } catch (error) {
      console.error('Error opening resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to open resume. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Hired Talent
        </h1>
        <p className="text-gray-600">
          Track hired candidates and their 60-day probation periods.
        </p>
      </div>

      <Card className="bg-white border border-gray-200">
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle className="text-lg font-medium">
            👥 Hired Candidates - 60 Day Probation Tracking
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
                  Education
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Hire Date
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  60-Day Status
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  PDF
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">
                        Loading hired candidates...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                hiredCandidates.map(candidate => {
                  const daysRemaining = calculateDaysRemaining(
                    candidate.updated_at
                  );
                  return (
                    <TableRow key={candidate.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {candidate.full_name}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {getJobTitle(candidate)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {getLocation(candidate)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {candidate.education || '-'}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {new Date(candidate.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell
                        className={`font-medium ${getStatusColor(
                          daysRemaining
                        )} text-nowrap`}
                      >
                        {getStatusText(daysRemaining)}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleDownloadPDF(candidate)}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          disabled={!candidate.resume_url}
                          title={
                            candidate.resume_url
                              ? 'Download Resume'
                              : 'No resume available'
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {!loading && hiredCandidates.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>No hired candidates yet.</p>
              <p className="text-sm mt-2">
                Candidates will appear here when you hire them from the
                Candidate Info section.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">
          📋 60-Day Guarantee Information
        </h3>
        <p className="text-blue-800 text-sm">
          All hired candidates have a 60-day probation period. During this time,
          we guarantee placement and provide support to ensure successful
          integration. The countdown shows days remaining in the probation
          period.
        </p>
      </div>
    </div>
  );
}
