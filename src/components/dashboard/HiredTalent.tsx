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

interface HiredCandidate {
  id: string;
  full_name: string;
  education: string | null;
  updated_at: string;
}

export function HiredTalent() {
  const { user } = useAuth();
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
          // Fetch hired candidates
          const { data: candidatesData, error: candidatesError } =
            await supabase
              .from('candidates')
              .select('id, full_name, education, updated_at')
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
                  Education
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Hire Date
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  60-Day Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
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
