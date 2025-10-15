import { JobStaging } from '@/components/dashboard/JobStaging';
import { useNavigate } from 'react-router-dom';

const JobStagingPage = () => {
  const navigate = useNavigate();

  const handleNavigateToPostJob = (jobId?: string) => {
    navigate('/post-new-job', {
      state: { jobId },
    });
  };

  return <JobStaging onNavigateToPostJob={handleNavigateToPostJob} />;
};

export default JobStagingPage;
