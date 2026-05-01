export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adherence_events: {
        Row: {
          created_at: string
          id: string
          medication_id: string
          notes: string | null
          patient_id: string
          scheduled_at: string
          source: string | null
          status: string
          taken_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          medication_id: string
          notes?: string | null
          patient_id: string
          scheduled_at: string
          source?: string | null
          status: string
          taken_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          medication_id?: string
          notes?: string | null
          patient_id?: string
          scheduled_at?: string
          source?: string | null
          status?: string
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adherence_events_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adherence_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          changes: Json | null
          created_at: string
          id: string
          ip_address: unknown
          target_id: string
          target_table: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          target_id: string
          target_table: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          changes?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          target_id?: string
          target_table?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      clinicians: {
        Row: {
          auth_user_id: string | null
          clinic_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          role: string
          specialty: string | null
        }
        Insert: {
          auth_user_id?: string | null
          clinic_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          role: string
          specialty?: string | null
        }
        Update: {
          auth_user_id?: string | null
          clinic_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          specialty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinicians_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          baseline_values: Json | null
          condition: string
          created_at: string
          diagnosed_on: string | null
          icd10_code: string | null
          id: string
          notes: string | null
          patient_id: string
        }
        Insert: {
          baseline_values?: Json | null
          condition: string
          created_at?: string
          diagnosed_on?: string | null
          icd10_code?: string | null
          id?: string
          notes?: string | null
          patient_id: string
        }
        Update: {
          baseline_values?: Json | null
          condition?: string
          created_at?: string
          diagnosed_on?: string | null
          icd10_code?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          address: string | null
          auth_user_id: string | null
          created_at: string
          full_name: string
          id: string
          notify_on_non_response: boolean
          patient_id: string
          phone: string | null
          relationship: string | null
          telegram_chat_id: string | null
        }
        Insert: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          notify_on_non_response?: boolean
          patient_id: string
          phone?: string | null
          relationship?: string | null
          telegram_chat_id?: string | null
        }
        Update: {
          address?: string | null
          auth_user_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          notify_on_non_response?: boolean
          patient_id?: string
          phone?: string | null
          relationship?: string | null
          telegram_chat_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          approved_at: string | null
          approved_by_clinician_id: string | null
          citation: string | null
          clinical_reasoning: string | null
          created_at: string
          id: string
          patient_id: string
          recommendation_text: string
          sent_at: string | null
          sent_message_text: string | null
          status: string
          triggered_by_risk_event_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by_clinician_id?: string | null
          citation?: string | null
          clinical_reasoning?: string | null
          created_at?: string
          id?: string
          patient_id: string
          recommendation_text: string
          sent_at?: string | null
          sent_message_text?: string | null
          status: string
          triggered_by_risk_event_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by_clinician_id?: string | null
          citation?: string | null
          clinical_reasoning?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          recommendation_text?: string
          sent_at?: string | null
          sent_message_text?: string | null
          status?: string
          triggered_by_risk_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interventions_approved_by_clinician_id_fkey"
            columns: ["approved_by_clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_triggered_by_risk_event_id_fkey"
            columns: ["triggered_by_risk_event_id"]
            isOneToOne: false
            referencedRelation: "risk_events"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          created_at: string
          dose_amount: number | null
          dose_unit: string | null
          drug_name: string
          end_date: string | null
          frequency: string | null
          generic_name: string | null
          id: string
          instructions: string | null
          patient_id: string
          prescribed_by_clinician_id: string | null
          prescribed_on: string | null
          prescription_id: string | null
          start_date: string | null
          status: string
        }
        Insert: {
          created_at?: string
          dose_amount?: number | null
          dose_unit?: string | null
          drug_name: string
          end_date?: string | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          instructions?: string | null
          patient_id: string
          prescribed_by_clinician_id?: string | null
          prescribed_on?: string | null
          prescription_id?: string | null
          start_date?: string | null
          status: string
        }
        Update: {
          created_at?: string
          dose_amount?: number | null
          dose_unit?: string | null
          drug_name?: string
          end_date?: string | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          instructions?: string | null
          patient_id?: string
          prescribed_by_clinician_id?: string | null
          prescribed_on?: string | null
          prescription_id?: string | null
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_prescribed_by_clinician_id_fkey"
            columns: ["prescribed_by_clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          city: string | null
          clinic_id: string
          created_at: string
          dob: string | null
          enrolled_at: string
          enrolled_by_clinician_id: string | null
          family_history: string | null
          full_name: string
          height_cm: number | null
          id: string
          last_detected_language: string | null
          phone: string | null
          preferred_language: string
          sex: string | null
          telegram_chat_id: string | null
          weight_kg: number | null
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          city?: string | null
          clinic_id: string
          created_at?: string
          dob?: string | null
          enrolled_at?: string
          enrolled_by_clinician_id?: string | null
          family_history?: string | null
          full_name: string
          height_cm?: number | null
          id?: string
          last_detected_language?: string | null
          phone?: string | null
          preferred_language?: string
          sex?: string | null
          telegram_chat_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          city?: string | null
          clinic_id?: string
          created_at?: string
          dob?: string | null
          enrolled_at?: string
          enrolled_by_clinician_id?: string | null
          family_history?: string | null
          full_name?: string
          height_cm?: number | null
          id?: string
          last_detected_language?: string | null
          phone?: string | null
          preferred_language?: string
          sex?: string | null
          telegram_chat_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_enrolled_by_clinician_id_fkey"
            columns: ["enrolled_by_clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          confirmed_at: string | null
          confirmed_by_clinician_id: string | null
          created_at: string
          id: string
          image_storage_path: string | null
          notes: string | null
          ocr_raw_text: string | null
          parsed_medications: Json | null
          patient_id: string
          status: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by_clinician_id?: string | null
          created_at?: string
          id?: string
          image_storage_path?: string | null
          notes?: string | null
          ocr_raw_text?: string | null
          parsed_medications?: Json | null
          patient_id: string
          status: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by_clinician_id?: string | null
          created_at?: string
          id?: string
          image_storage_path?: string | null
          notes?: string | null
          ocr_raw_text?: string | null
          parsed_medications?: Json | null
          patient_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_confirmed_by_clinician_id_fkey"
            columns: ["confirmed_by_clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_events: {
        Row: {
          created_at: string
          data_point_refs: Json | null
          detected_at: string
          event_type: string
          guideline_citation: string | null
          id: string
          llm_reasoning_trace: Json | null
          narrative_text: string | null
          patient_id: string
          rule_fired: string
          score_delta: number
          severity: string
        }
        Insert: {
          created_at?: string
          data_point_refs?: Json | null
          detected_at: string
          event_type: string
          guideline_citation?: string | null
          id?: string
          llm_reasoning_trace?: Json | null
          narrative_text?: string | null
          patient_id: string
          rule_fired: string
          score_delta?: number
          severity: string
        }
        Update: {
          created_at?: string
          data_point_refs?: Json | null
          detected_at?: string
          event_type?: string
          guideline_citation?: string | null
          id?: string
          llm_reasoning_trace?: Json | null
          narrative_text?: string | null
          patient_id?: string
          rule_fired?: string
          score_delta?: number
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      symptoms: {
        Row: {
          created_at: string
          id: string
          language_detected: string | null
          patient_id: string
          recorded_at: string
          severity: string | null
          source: string | null
          symptom_text_normalized: string | null
          symptom_text_raw: string
        }
        Insert: {
          created_at?: string
          id?: string
          language_detected?: string | null
          patient_id: string
          recorded_at: string
          severity?: string | null
          source?: string | null
          symptom_text_normalized?: string | null
          symptom_text_raw: string
        }
        Update: {
          created_at?: string
          id?: string
          language_detected?: string | null
          patient_id?: string
          recorded_at?: string
          severity?: string | null
          source?: string | null
          symptom_text_normalized?: string | null
          symptom_text_raw?: string
        }
        Relationships: [
          {
            foreignKeyName: "symptoms_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      vitals: {
        Row: {
          created_at: string
          id: string
          image_storage_path: string | null
          notes: string | null
          patient_id: string
          recorded_at: string
          source: string
          unit: string | null
          value_diastolic: number | null
          value_numeric: number | null
          value_systolic: number | null
          vital_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_storage_path?: string | null
          notes?: string | null
          patient_id: string
          recorded_at: string
          source: string
          unit?: string | null
          value_diastolic?: number | null
          value_numeric?: number | null
          value_systolic?: number | null
          vital_type: string
        }
        Update: {
          created_at?: string
          id?: string
          image_storage_path?: string | null
          notes?: string | null
          patient_id?: string
          recorded_at?: string
          source?: string
          unit?: string | null
          value_diastolic?: number | null
          value_numeric?: number | null
          value_systolic?: number | null
          vital_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_scores: {
        Row: {
          calculated_for_date: string
          calculation_breakdown: Json | null
          created_at: string
          id: string
          patient_id: string
          score: number
          sub_score_adherence: number
          sub_score_engagement: number
          sub_score_symptom: number
          sub_score_vitals: number
        }
        Insert: {
          calculated_for_date: string
          calculation_breakdown?: Json | null
          created_at?: string
          id?: string
          patient_id: string
          score: number
          sub_score_adherence: number
          sub_score_engagement: number
          sub_score_symptom: number
          sub_score_vitals: number
        }
        Update: {
          calculated_for_date?: string
          calculation_breakdown?: Json | null
          created_at?: string
          id?: string
          patient_id?: string
          score?: number
          sub_score_adherence?: number
          sub_score_engagement?: number
          sub_score_symptom?: number
          sub_score_vitals?: number
        }
        Relationships: [
          {
            foreignKeyName: "wellness_scores_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      audit_log_target_in_caller_clinic: {
        Args: { p_target_id: string; p_target_table: string }
        Returns: boolean
      }
      auth_clinician_clinic_id: { Args: never; Returns: string }
      auth_clinician_owns_patient: {
        Args: { p_patient_id: string }
        Returns: boolean
      }
      auth_guardian_can_view_patient: {
        Args: { p_patient_id: string }
        Returns: boolean
      }
      auth_patient_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
