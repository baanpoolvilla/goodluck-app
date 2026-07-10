/**
 * Hand-written placeholder matching supabase/migrations/*.sql.
 * Once a real Supabase project exists, regenerate with:
 *   npx supabase gen types typescript --project-id <ref> > lib/db/database.types.ts
 *
 * Shape (Tables/Views/Functions, Relationships[] per table) mirrors what
 * that generator produces — @supabase/postgrest-js's query builder types
 * rely on exactly this structure to resolve embedded resource selects
 * (e.g. `assignee:assigned_to(...)`) and RPC argument types.
 */

export type UserRole = "admin" | "manager" | "employee";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "completed_late"
  | "overdue"
  | "cancelled";
export type GradeModule = "task" | "daily_report";
export type ReportChannel = "it" | "marketing" | "admin" | "housekeeper";
export type LeaveType = "day_off" | "vacation" | "sick" | "personal" | "unpaid" | "other";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: UserRole;
          line_user_id: string | null;
          department: string | null;
          channel: ReportChannel | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          id: string;
          email: string;
          full_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          assigned_to: string;
          assigned_by: string;
          priority: TaskPriority;
          status: TaskStatus;
          deadline: string;
          completed_at: string | null;
          penalty_applied: number;
          grade_weight: number;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tasks"]["Row"]> & {
          title: string;
          assigned_to: string;
          assigned_by: string;
          deadline: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["task_comments"]["Row"]> & {
          task_id: string;
          user_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["task_comments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_reports: {
        Row: {
          id: string;
          user_id: string;
          report_date: string;
          content: string;
          submitted_at: string;
          is_late: boolean;
          channel: ReportChannel;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["daily_reports"]["Row"]> & {
          user_id: string;
          report_date: string;
          content: string;
          channel: ReportChannel;
        };
        Update: Partial<Database["public"]["Tables"]["daily_reports"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "daily_reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      report_comments: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["report_comments"]["Row"]> & {
          report_id: string;
          user_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_comments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "report_comments_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "daily_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      report_reactions: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["report_reactions"]["Row"]> & {
          report_id: string;
          user_id: string;
          emoji: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_reactions"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "report_reactions_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "daily_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      grade_configs: {
        Row: {
          id: string;
          module: GradeModule;
          weight_percent: number;
          penalty_per_day_late: number;
          penalty_per_missed: number;
          max_penalty_per_item: number;
          daily_report_deadline_hour: number;
          grace_period_minutes: number;
          is_active: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["grade_configs"]["Row"]> & {
          module: GradeModule;
          weight_percent: number;
        };
        Update: Partial<Database["public"]["Tables"]["grade_configs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "grade_configs_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      penalty_logs: {
        Row: {
          id: string;
          user_id: string;
          module: GradeModule;
          reference_id: string;
          penalty_amount: number;
          reason: string;
          penalty_date: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["penalty_logs"]["Row"]> & {
          user_id: string;
          module: GradeModule;
          reference_id: string;
          penalty_amount: number;
          reason: string;
          penalty_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["penalty_logs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "penalty_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      monthly_grades: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          task_score: number;
          report_score: number;
          total_score: number | null;
          grade: string | null;
          total_tasks: number;
          completed_on_time: number;
          total_report_days: number;
          reports_submitted: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["monthly_grades"]["Row"]> & {
          user_id: string;
          month: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_grades"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "monthly_grades_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      leaves: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          leave_type: LeaveType;
          reason: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["leaves"]["Row"]> & {
          user_id: string;
          start_date: string;
          end_date: string;
          created_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["leaves"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "leaves_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leaves_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      app_hub_items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon_url: string | null;
          redirect_url: string;
          allowed_roles: string[];
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["app_hub_items"]["Row"]> & {
          name: string;
          redirect_url: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_hub_items"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      calculate_monthly_grade: {
        Args: { p_user_id: string; p_month: string };
        Returns: undefined;
      };
      apply_task_penalty: {
        Args: { p_task_id: string };
        Returns: undefined;
      };
      apply_daily_report_penalty: {
        Args: { p_user_id: string; p_date: string; p_missed: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      grade_module: GradeModule;
      report_channel: ReportChannel;
      leave_type: LeaveType;
    };
    CompositeTypes: Record<string, never>;
  };
}
