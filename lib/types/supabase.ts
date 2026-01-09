export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};

type GenericUpdatableView = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: GenericRelationship[];
};

type GenericNonUpdatableView = {
  Row: Record<string, unknown>;
  Relationships: GenericRelationship[];
};

type GenericView = GenericUpdatableView | GenericNonUpdatableView;

type GenericSetofOption = {
  isSetofReturn?: boolean;
  isOneToOne?: boolean;
  isNotNullable?: boolean;
  to: string;
  from: string;
};

type GenericFunction = {
  Args: Record<string, unknown> | never;
  Returns: unknown;
  SetofOptions?: GenericSetofOption;
};

type GenericSchema = {
  Tables: Record<string, GenericTable>;
  Views: Record<string, GenericView>;
  Functions: Record<string, GenericFunction>;
};

type PublicSchema = GenericSchema & {
  Tables: {
    profiles: {
      Row: {
        id: string;
        email: string;
        full_name: string | null;
        dni: string | null;
        phone: string | null;
        date_of_birth: string | null;
        role: string | null;
        avatar_url: string | null;
        created_at: string | null;
        updated_at: string | null;
      };
      Insert: {
        id: string;
        email: string;
        full_name?: string | null;
        dni?: string | null;
        phone?: string | null;
        date_of_birth?: string | null;
        role?: string | null;
        avatar_url?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
      };
      Update: {
        id?: string;
        email?: string;
        full_name?: string | null;
        dni?: string | null;
        phone?: string | null;
        date_of_birth?: string | null;
        role?: string | null;
        avatar_url?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
      };
      Relationships: [];
    };
    employees: {
      Row: {
        id: string;
        user_id: string | null;
        employee_number: string | null;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        phone: string | null;
        position: string | null;
        department: string | null;
        status: string | null;
        start_date: string | null;
        end_date: string | null;
        date_of_birth: string | null;
        gender: string | null;
        address: string | null;
        city: string | null;
        country: string | null;
        postal_code: string | null;
        emergency_contact_name: string | null;
        emergency_contact_phone: string | null;
        emergency_contact_relationship: string | null;
        profile_image_url: string | null;
        cv_url: string | null;
        vacation_start: string | null;
        vacation_end: string | null;
        created_at: string | null;
        updated_at: string | null;
        created_by: string | null;
      };
      Insert: {
        id?: string;
        user_id?: string | null;
        employee_number?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
        phone?: string | null;
        position?: string | null;
        department?: string | null;
        status?: string | null;
        start_date?: string | null;
        end_date?: string | null;
        date_of_birth?: string | null;
        gender?: string | null;
        address?: string | null;
        city?: string | null;
        country?: string | null;
        postal_code?: string | null;
        emergency_contact_name?: string | null;
        emergency_contact_phone?: string | null;
        emergency_contact_relationship?: string | null;
        profile_image_url?: string | null;
        cv_url?: string | null;
        vacation_start?: string | null;
        vacation_end?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        created_by?: string | null;
      };
      Update: {
        id?: string;
        user_id?: string | null;
        employee_number?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
        phone?: string | null;
        position?: string | null;
        department?: string | null;
        status?: string | null;
        start_date?: string | null;
        end_date?: string | null;
        date_of_birth?: string | null;
        gender?: string | null;
        address?: string | null;
        city?: string | null;
        country?: string | null;
        postal_code?: string | null;
        emergency_contact_name?: string | null;
        emergency_contact_phone?: string | null;
        emergency_contact_relationship?: string | null;
        profile_image_url?: string | null;
        cv_url?: string | null;
        vacation_start?: string | null;
        vacation_end?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        created_by?: string | null;
      };
      Relationships: [];
    };
    employee_documents: {
      Row: {
        id: string;
        employee_id: string | null;
        document_type: string;
        document_name: string;
        file_url: string;
        file_size: number | null;
        signed_at: string | null;
        signed_by: string | null;
        signed_name: string | null;
        signature_data_url: string | null;
        uploaded_at: string | null;
        uploaded_by: string | null;
      };
      Insert: {
        id?: string;
        employee_id?: string | null;
        document_type: string;
        document_name: string;
        file_url: string;
        file_size?: number | null;
        signed_at?: string | null;
        signed_by?: string | null;
        signed_name?: string | null;
        signature_data_url?: string | null;
        uploaded_at?: string | null;
        uploaded_by?: string | null;
      };
      Update: {
        id?: string;
        employee_id?: string | null;
        document_type?: string;
        document_name?: string;
        file_url?: string;
        file_size?: number | null;
        signed_at?: string | null;
        signed_by?: string | null;
        signed_name?: string | null;
        signature_data_url?: string | null;
        uploaded_at?: string | null;
        uploaded_by?: string | null;
      };
      Relationships: [];
    };
    attendance_records: {
      Row: {
        id: string;
        employee_id: string | null;
        attendance_date: string | null;
        status: string | null;
        check_in: string | null;
        check_out: string | null;
        break_minutes: number | null;
        notes: string | null;
        source: string | null;
        created_at: string | null;
        created_by: string | null;
      };
      Insert: {
        id?: string;
        employee_id?: string | null;
        attendance_date?: string | null;
        status?: string | null;
        check_in?: string | null;
        check_out?: string | null;
        break_minutes?: number | null;
        notes?: string | null;
        source?: string | null;
        created_at?: string | null;
        created_by?: string | null;
      };
      Update: {
        id?: string;
        employee_id?: string | null;
        attendance_date?: string | null;
        status?: string | null;
        check_in?: string | null;
        check_out?: string | null;
        break_minutes?: number | null;
        notes?: string | null;
        source?: string | null;
        created_at?: string | null;
        created_by?: string | null;
      };
      Relationships: [];
    };
    salaries: {
      Row: {
        id: string;
        employee_id: string | null;
        base_salary: number;
        currency: string | null;
        payment_frequency: string | null;
        bonuses: number | null;
        deductions: number | null;
        bank_account: string | null;
        effective_date: string;
        end_date: string | null;
        is_current: boolean | null;
        notes: string | null;
        created_at: string | null;
        created_by: string | null;
      };
      Insert: {
        id?: string;
        employee_id?: string | null;
        base_salary: number;
        currency?: string | null;
        payment_frequency?: string | null;
        bonuses?: number | null;
        deductions?: number | null;
        bank_account?: string | null;
        effective_date: string;
        end_date?: string | null;
        is_current?: boolean | null;
        notes?: string | null;
        created_at?: string | null;
        created_by?: string | null;
      };
      Update: {
        id?: string;
        employee_id?: string | null;
        base_salary?: number;
        currency?: string | null;
        payment_frequency?: string | null;
        bonuses?: number | null;
        deductions?: number | null;
        bank_account?: string | null;
        effective_date?: string;
        end_date?: string | null;
        is_current?: boolean | null;
        notes?: string | null;
        created_at?: string | null;
        created_by?: string | null;
      };
      Relationships: [];
    };
    salary_receipts: {
      Row: {
        id: string;
        employee_id: string | null;
        salary_id: string | null;
        period_start: string;
        period_end: string;
        payment_date: string;
        gross_amount: number;
        net_amount: number;
        bonuses: number | null;
        deductions: number | null;
        receipt_file_url: string | null;
        status: string | null;
        signed_at: string | null;
        signed_by: string | null;
        signed_name: string | null;
        signature_data_url: string | null;
        created_at: string | null;
        created_by: string | null;
      };
      Insert: {
        id?: string;
        employee_id?: string | null;
        salary_id?: string | null;
        period_start: string;
        period_end: string;
        payment_date: string;
        gross_amount: number;
        net_amount: number;
        bonuses?: number | null;
        deductions?: number | null;
        receipt_file_url?: string | null;
        status?: string | null;
        signed_at?: string | null;
        signed_by?: string | null;
        signed_name?: string | null;
        signature_data_url?: string | null;
        created_at?: string | null;
        created_by?: string | null;
      };
      Update: {
        id?: string;
        employee_id?: string | null;
        salary_id?: string | null;
        period_start?: string;
        period_end?: string;
        payment_date?: string;
        gross_amount?: number;
        net_amount?: number;
        bonuses?: number | null;
        deductions?: number | null;
        receipt_file_url?: string | null;
        status?: string | null;
        signed_at?: string | null;
        signed_by?: string | null;
        signed_name?: string | null;
        signature_data_url?: string | null;
        created_at?: string | null;
        created_by?: string | null;
      };
      Relationships: [];
    };
  } & Record<string, GenericTable>;
  Views: Record<string, GenericView>;
  Functions: Record<string, GenericFunction>;
};

export type Database = {
  public: PublicSchema;
};
