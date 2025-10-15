export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      admin_emails: {
        Row: {
          added_by: string | null;
          created_at: string;
          email: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          added_by?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          updated_at?: string;
        };
        Update: {
          added_by?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      candidates: {
        Row: {
          client_id: string | null;
          created_at: string;
          education: string | null;
          email: string | null;
          experience_years: string | null;
          full_name: string;
          id: string;
          phone: string | null;
          resume_url: string | null;
          skills: string[] | null;
          status: string;
          summary: string | null;
          updated_at: string;
          uploaded_by: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          education?: string | null;
          email?: string | null;
          experience_years?: string | null;
          full_name: string;
          id?: string;
          phone?: string | null;
          resume_url?: string | null;
          skills?: string[] | null;
          status?: string;
          summary?: string | null;
          updated_at?: string;
          uploaded_by: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          education?: string | null;
          email?: string | null;
          experience_years?: string | null;
          full_name?: string;
          id?: string;
          phone?: string | null;
          resume_url?: string | null;
          skills?: string[] | null;
          status?: string;
          summary?: string | null;
          updated_at?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'candidates_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'candidates_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          }
        ];
      };
      clients: {
        Row: {
          address: string | null;
          street1: string | null;
          street2: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          company_name: string;
          contact_phone: string | null;
          created_at: string;
          id: string;
          updated_at: string;
          user_id: string;
          welcome_email_sent: boolean;
        };
        Insert: {
          address?: string | null;
          street1?: string | null;
          street2?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          company_name: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id: string;
          welcome_email_sent?: boolean;
        };
        Update: {
          address?: string | null;
          street1?: string | null;
          street2?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          company_name?: string;
          contact_phone?: string | null;
          created_at?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
          welcome_email_sent?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'clients_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['user_id'];
          }
        ];
      };
      email_alerts: {
        Row: {
          alert_type: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          recipient_email: string;
          updated_at: string;
        };
        Insert: {
          alert_type: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          recipient_email: string;
          updated_at?: string;
        };
        Update: {
          alert_type?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          recipient_email?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          is_active: boolean;
          role: Database['public']['Enums']['app_role'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          role?: Database['public']['Enums']['app_role'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      job_posts: {
        Row: {
          amount_cents: number;
          benefits: string | null;
          classification: string;
          client_id: string;
          created_at: string;
          description: string;
          expires_at: string | null;
          id: string;
          job_type: string;
          location: string;
          payment_status: string;
          posted_at: string | null;
          requirements: string;
          salary: string | null;
          status: string;
          stripe_payment_intent_id: string | null;
          stripe_price_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          benefits?: string | null;
          classification: string;
          client_id: string;
          created_at?: string;
          description: string;
          expires_at?: string | null;
          id?: string;
          job_type: string;
          location: string;
          payment_status?: string;
          posted_at?: string | null;
          requirements: string;
          salary?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_price_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          benefits?: string | null;
          classification?: string;
          client_id?: string;
          created_at?: string;
          description?: string;
          expires_at?: string | null;
          id?: string;
          job_type?: string;
          location?: string;
          payment_status?: string;
          posted_at?: string | null;
          requirements?: string;
          salary?: string | null;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_price_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'job_posts_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          }
        ];
      };
      payment_transactions: {
        Row: {
          amount_cents: number;
          created_at: string;
          currency: string;
          failure_reason: string | null;
          id: string;
          job_post_id: string;
          payment_method: string | null;
          processed_at: string | null;
          status: string;
          stripe_charge_id: string | null;
          stripe_payment_intent_id: string;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          currency?: string;
          failure_reason?: string | null;
          id?: string;
          job_post_id: string;
          payment_method?: string | null;
          processed_at?: string | null;
          status: string;
          stripe_charge_id?: string | null;
          stripe_payment_intent_id: string;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          currency?: string;
          failure_reason?: string | null;
          id?: string;
          job_post_id?: string;
          payment_method?: string | null;
          processed_at?: string | null;
          status?: string;
          stripe_charge_id?: string | null;
          stripe_payment_intent_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_transactions_job_post_id_fkey';
            columns: ['job_post_id'];
            isOneToOne: false;
            referencedRelation: 'job_posts';
            referencedColumns: ['id'];
          }
        ];
      };
      security_audit_log: {
        Row: {
          action_type: string;
          created_at: string;
          details: Json | null;
          id: string;
          ip_address: string | null;
          resource_id: string | null;
          resource_type: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          action_type: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_type: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          action_type?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_type?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_role: {
        Args: { user_uuid: string };
        Returns: Database['public']['Enums']['app_role'];
      };
    };
    Enums: {
      app_role: 'admin' | 'client' | 'user';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
      DefaultSchema['Views'])
  ? (DefaultSchema['Tables'] &
      DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
  ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'client', 'user'],
    },
  },
} as const;
