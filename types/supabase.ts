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
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          preferred_currency: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          preferred_currency?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          preferred_currency?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          paid_at: string
          subscription_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at: string
          subscription_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing: Database["public"]["Enums"]["billing_cycle"]
          canceled_at: string | null
          category: string | null
          created_at: string
          currency: string
          id: string
          next_billing_date: string | null
          notes: string | null
          plan_name: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tags: string[]
          tool_name: string
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          billing?: Database["public"]["Enums"]["billing_cycle"]
          canceled_at?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          next_billing_date?: string | null
          notes?: string | null
          plan_name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tags?: string[]
          tool_name: string
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          billing?: Database["public"]["Enums"]["billing_cycle"]
          canceled_at?: string | null
          category?: string | null
          created_at?: string
          currency?: string
          id?: string
          next_billing_date?: string | null
          notes?: string | null
          plan_name?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tags?: string[]
          tool_name?: string
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      billing_cycle: "monthly" | "yearly" | "weekly" | "one_time"
      subscription_status: "active" | "canceled" | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Simplified helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
