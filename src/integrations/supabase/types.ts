export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      authors: {
        Row: {
          id: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
        }
        Relationships: []
      }
      genres: {
        Row: {
          id: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
        }
        Relationships: []
      }
      libraries: {
        Row: {
          id: string
          name: string
          address: string
          contact_info: Json | null
          institution_id: string
          created_at: string | null
          created_by: string | null
          updated_at: string | null
          open_time: string | null
          close_time: string | null
          days_closed: string[] | null
          resources: string[] | null
          shelves: Json | null
          managed_by: string[] | null
          user_types: string[] | null
        }
        Insert: {
          id?: string
          name: string
          address: string
          contact_info?: Json | null
          institution_id: string
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
          open_time?: string | null
          close_time?: string | null
          days_closed?: string[] | null
          resources?: string[] | null
          shelves?: Json | null
          managed_by?: string[] | null
          user_types?: string[] | null
        }
        Update: {
          id?: string
          name?: string
          address?: string
          contact_info?: Json | null
          institution_id?: string
          created_at?: string | null
          created_by?: string | null
          updated_at?: string | null
          open_time?: string | null
          close_time?: string | null
          days_closed?: string[] | null
          resources?: string[] | null
          shelves?: Json | null
          managed_by?: string[] | null
          user_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "libraries_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "libraries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      library_access: {
        Row: {
          id: string
          library_id: string
          profile_id: string
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          library_id: string
          profile_id: string
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          library_id?: string
          profile_id?: string
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_access_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_access_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_access_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      books: {
        Row: {
          id: string
          title: string
          authors: string[]
          genres: string[]
          summary: string | null
          image_url: string | null
          status: Database["public"]["Enums"]["book_status"]
          available: number
          total: number
          created_at: string | null
          institution_id: string
          isbn_13: string | null
          isbn_10: string | null
          publish_date: string | null
          publisher: string | null
          cover_type: 'Hardcover' | 'Paperback' | null
          language: string
        }
        Insert: {
          id?: string
          title: string
          authors: string[]
          genres: string[]
          summary?: string | null
          image_url?: string | null
          status: Database["public"]["Enums"]["book_status"]
          available?: number
          total?: number
          created_at?: string | null
          institution_id: string
          isbn_13?: string | null
          isbn_10?: string | null
          publish_date?: string | null
          publisher?: string | null
          cover_type?: 'Hardcover' | 'Paperback' | null
          language?: string
        }
        Update: {
          id?: string
          title?: string
          authors?: string[]
          genres?: string[]
          summary?: string | null
          image_url?: string | null
          status?: Database["public"]["Enums"]["book_status"]
          available?: number
          total?: number
          created_at?: string | null
          institution_id?: string
          isbn_13?: string | null
          isbn_10?: string | null
          publish_date?: string | null
          publisher?: string | null
          cover_type?: 'Hardcover' | 'Paperback' | null
          language?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          }
        ]
      }
      borrowings: {
        Row: {
          book_id: string | null
          borrow_date: string | null
          created_at: string | null
          due_date: string
          id: string
          institution_id: string
          penalty: number | null
          return_date: string | null
          user_id: string | null
        }
        Insert: {
          book_id?: string | null
          borrow_date?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          institution_id: string
          penalty?: number | null
          return_date?: string | null
          user_id?: string | null
        }
        Update: {
          book_id?: string | null
          borrow_date?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          institution_id?: string
          penalty?: number | null
          return_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "borrowings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowings_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          address: string
          admin_name: string
          admin_email: string
          admin_password: string | null
          contact_phone: string | null
          organization_structure: Json
          open_time: string | null
          close_time: string | null
          off_days: string[] | null
          reserve_duration_days: number | null
          loan_duration_days: number | null
          late_fine_per_day: number | null
          rules: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          address: string
          admin_name: string
          admin_email: string
          admin_password?: string | null
          contact_phone?: string | null
          organization_structure?: Json
          open_time?: string | null
          close_time?: string | null
          off_days?: string[] | null
          reserve_duration_days?: number | null
          loan_duration_days?: number | null
          late_fine_per_day?: number | null
          rules?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          address?: string
          admin_name?: string
          admin_email?: string
          admin_password?: string | null
          contact_phone?: string | null
          organization_structure?: Json
          open_time?: string | null
          close_time?: string | null
          off_days?: string[] | null
          reserve_duration_days?: number | null
          loan_duration_days?: number | null
          late_fine_per_day?: number | null
          rules?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          institution_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          access_level: number
          user_type: string | null
          permissions: string[] | null
          borrowed_books: number
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          institution_id?: string | null
          role: Database["public"]["Enums"]["user_role"]
          access_level?: number
          user_type?: string | null
          permissions?: string[] | null
          borrowed_books?: number
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          institution_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          access_level?: number
          user_type?: string | null
          permissions?: string[] | null
          borrowed_books?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          book_id: string | null
          created_at: string | null
          expiration_date: string
          id: string
          institution_id: string
          request_date: string | null
          user_id: string | null
          status: "pending" | "approved" | "rejected" | "expired"
          notes: string | null
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          expiration_date: string
          id?: string
          institution_id: string
          request_date?: string | null
          user_id?: string | null
          status?: "pending" | "approved" | "rejected" | "expired"
          notes?: string | null
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          expiration_date?: string
          id?: string
          institution_id?: string
          request_date?: string | null
          user_id?: string | null
          status?: "pending" | "approved" | "rejected" | "expired"
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      book_queue: {
        Row: {
          id: string;
          book_id: string;
          user_id: string;
          institution_id: string;
          position: number;
          status: string;
          created_at: string;
          notified_at: string | null;
          expires_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          user_id: string;
          institution_id: string;
          position: number;
          status?: string;
          created_at?: string;
          notified_at?: string | null;
          expires_at: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          user_id?: string;
          institution_id?: string;
          position?: number;
          status?: string;
          created_at?: string;
          notified_at?: string | null;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_queue_book_id_fkey";
            columns: ["book_id"];
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_queue_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_queue_institution_id_fkey";
            columns: ["institution_id"];
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          }
        ];
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_institution_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      direct_profile_lookup: {
        Args: { user_id: string }
        Returns: Json
      }
      get_profile_by_id: {
        Args: { profile_id: string }
        Returns: Json
      }
      approve_request_transaction: {
        Args: {
          p_request_id: string
          p_approver_id: string
          p_approver_role: string
        }
        Returns: Json
      }
      increment_book_availability: {
        Args: {
          p_book_id: string
          p_increment: number
        }
        Returns: void
      }
      borrow_book: {
        Args: {
          p_book_id: string
          p_user_id: string
          p_institution_id: string
          p_expiration_date: string
        }
        Returns: string
      }
      return_book: {
        Args: {
          p_borrowing_id: string
          p_returner_id: string
          p_condition: string
          p_notes: string
        }
        Returns: Json
      }
      handle_request_approval: {
        Args: {
          p_request_id: string
          p_book_id: string
          p_user_id: string
          p_borrower_email: string
          p_institution_id: string
          p_loan_days: number
          p_fine_per_day: number
        }
        Returns: void
      }
      reject_borrow_request: {
        Args: {
          p_request_id: string
          p_rejecter_id: string
          p_reason: string
        }
        Returns: Json
      }
      manage_book_queue: {
        Args: {
          p_book_id: string
          p_user_id: string
          p_institution_id: string
        }
        Returns: string
      }
    }
    Enums: {
      book_status:
        | "Available"
        | "Borrowed"
        | "Reserved"
        | "Maintenance"
        | "Lost"
      user_role: "student" | "librarian" | "admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      book_status: ["Available", "Borrowed", "Reserved", "Maintenance", "Lost"],
      user_role: ["student", "librarian", "admin", "super_admin"],
    },
  },
} as const

export interface Libraries {
  id: string;
  name: string;
  address: string;
  institution_id: string;
  contact_number: string;
  open_time: string;
  close_time: string;
  days_closed: string[];
  resources: string[];
  shelves: {
    name: string;
    capacity: number;
    description?: string;
  }[];
  user_types: string[];
  created_at: string;
  created_by: string;
  updated_at?: string;
}

export interface LibrariesInsert {
  name: string;
  address: string;
  institution_id: string;
  contact_number: string;
  open_time: string;
  close_time: string;
  days_closed: string[];
  resources: string[];
  shelves: {
    name: string;
    capacity: number;
    description?: string;
  }[];
  user_types: string[];
  created_by: string;
}

export interface LibrariesUpdate {
  name?: string;
  address?: string;
  institution_id?: string;
  contact_number?: string;
  open_time?: string;
  close_time?: string;
  days_closed?: string[];
  resources?: string[];
  shelves?: {
    name: string;
    capacity: number;
    description?: string;
  }[];
  user_types?: string[];
  updated_at?: string;
}
