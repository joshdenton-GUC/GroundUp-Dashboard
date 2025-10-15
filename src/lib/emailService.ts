import { supabase } from '@/integrations/supabase/client';

export interface EmailAlertData {
  alertType: string;
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  metadata?: Record<string, any>;
}

export interface NoSaleAlertData {
  clientName: string;
  clientEmail: string;
  jobTitle?: string;
  signupDate: string;
  dashboardUrl: string;
}

export interface JobStatusAlertData {
  clientName: string;
  clientEmail: string;
  jobTitle: string;
  jobStatus: 'filled' | 'not_hired' | 'cancelled';
  candidateName?: string;
  dashboardUrl: string;
}

class EmailService {
  private async getActiveEmailAlerts(alertType: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('email_alerts')
        .select('recipient_email')
        .eq('alert_type', alertType)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching email alerts:', error);
        return [];
      }

      return data?.map(alert => alert.recipient_email) || [];
    } catch (error) {
      console.error('Error in getActiveEmailAlerts:', error);
      return [];
    }
  }

  private async sendEmailViaSupabaseFunction(
    functionName: string,
    data: any
  ): Promise<boolean> {
    try {
      const { data: result, error } = await supabase.functions.invoke(
        functionName,
        {
          body: data,
        }
      );

      if (error) {
        console.error(`Error calling ${functionName}:`, error);
        return false;
      }

      console.log(`${functionName} result:`, result);
      return true;
    } catch (error) {
      console.error(`Error in ${functionName}:`, error);
      return false;
    }
  }

  async sendNoSaleAlert(data: NoSaleAlertData): Promise<boolean> {
    try {
      // Get active email alerts for no_sale_job_staged
      const recipientEmails = await this.getActiveEmailAlerts(
        'no_sale_job_staged'
      );

      if (recipientEmails.length === 0) {
        console.log('No active email alerts configured for no_sale_job_staged');
        return true;
      }

      // Prepare email content
      const emailContent = {
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        jobTitle: data.jobTitle || 'Job Posting',
        signupDate: data.signupDate,
        dashboardUrl: data.dashboardUrl,
        recipientEmails,
        alertType: 'no_sale_job_staged',
      };

      // Send via Supabase function
      return await this.sendEmailViaSupabaseFunction(
        'send-email-alert',
        emailContent
      );
    } catch (error) {
      console.error('Error sending no sale alert:', error);
      return false;
    }
  }

  async sendJobStatusAlert(data: JobStatusAlertData): Promise<boolean> {
    try {
      // Get active email alerts for job_status_update
      const recipientEmails = await this.getActiveEmailAlerts(
        'job_status_update'
      );

      if (recipientEmails.length === 0) {
        console.log('No active email alerts configured for job_status_update');
        return true;
      }

      // Prepare email content
      const emailContent = {
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        jobTitle: data.jobTitle,
        jobStatus: data.jobStatus,
        candidateName: data.candidateName,
        dashboardUrl: data.dashboardUrl,
        recipientEmails,
        alertType: 'job_status_update',
      };

      // Send via Supabase function
      return await this.sendEmailViaSupabaseFunction(
        'send-email-alert',
        emailContent
      );
    } catch (error) {
      console.error('Error sending job status alert:', error);
      return false;
    }
  }

  async sendCandidateAssignedAlert(data: {
    candidateName: string;
    candidateEmail?: string;
    candidateSkills?: string[];
    candidateSummary?: string;
    clientEmails?: string[];
    candidateId?: string;
    clientId?: string;
  }): Promise<boolean> {
    try {
      return await this.sendEmailViaSupabaseFunction('notify-client', data);
    } catch (error) {
      console.error('Error sending candidate assigned alert:', error);
      return false;
    }
  }

  async sendNewResumeAlert(data: {
    candidateName: string;
    candidateEmail?: string;
    resumeUrl?: string;
    clientEmails?: string[];
    candidateId?: string;
    clientId?: string;
  }): Promise<boolean> {
    try {
      // Get active email alerts for new_resume_uploaded
      const recipientEmails = await this.getActiveEmailAlerts(
        'new_resume_uploaded'
      );

      if (recipientEmails.length === 0) {
        console.log(
          'No active email alerts configured for new_resume_uploaded'
        );
        return true;
      }

      const emailContent = {
        ...data,
        recipientEmails,
        alertType: 'new_resume_uploaded',
      };

      return await this.sendEmailViaSupabaseFunction(
        'send-email-alert',
        emailContent
      );
    } catch (error) {
      console.error('Error sending new resume alert:', error);
      return false;
    }
  }

  async sendClientRegisteredAlert(data: {
    clientName: string;
    clientEmail: string;
    companyName?: string;
    signupDate: string;
  }): Promise<boolean> {
    try {
      // Get active email alerts for client_registered
      const recipientEmails = await this.getActiveEmailAlerts(
        'client_registered'
      );

      if (recipientEmails.length === 0) {
        console.log('No active email alerts configured for client_registered');
        return true;
      }

      const emailContent = {
        ...data,
        recipientEmails,
        alertType: 'client_registered',
      };

      return await this.sendEmailViaSupabaseFunction(
        'send-email-alert',
        emailContent
      );
    } catch (error) {
      console.error('Error sending client registered alert:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
