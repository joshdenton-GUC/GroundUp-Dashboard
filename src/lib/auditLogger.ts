import { supabase } from "@/integrations/supabase/client";

export interface AuditLogData {
  actionType: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
}

export const logSecurityEvent = async (data: AuditLogData) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.warn('No session available for audit logging');
      return;
    }

    await supabase.functions.invoke('audit-log', {
      body: data,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};