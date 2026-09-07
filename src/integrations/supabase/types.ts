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
      banners: {
        Row: {
          createdAt: string
          id: number
          imageUrl: string
          isActive: boolean
          link: string | null
          sortOrder: number
          title: string | null
        }
        Insert: {
          createdAt?: string
          id?: number
          imageUrl: string
          isActive?: boolean
          link?: string | null
          sortOrder?: number
          title?: string | null
        }
        Update: {
          createdAt?: string
          id?: number
          imageUrl?: string
          isActive?: boolean
          link?: string | null
          sortOrder?: number
          title?: string | null
        }
        Relationships: []
      }
      cart: {
        Row: {
          createdAt: string
          customerId: number
          id: number
          productId: number
          quantity: number
        }
        Insert: {
          createdAt?: string
          customerId: number
          id?: number
          productId: number
          quantity?: number
        }
        Update: {
          createdAt?: string
          customerId?: number
          id?: number
          productId?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          createdAt: string
          id: number
          imageUrl: string | null
          name: string
        }
        Insert: {
          createdAt?: string
          id?: number
          imageUrl?: string | null
          name: string
        }
        Update: {
          createdAt?: string
          id?: number
          imageUrl?: string | null
          name?: string
        }
        Relationships: []
      }
      couriers: {
        Row: {
          createdAt: string
          id: number
          isActive: boolean
          lat: number | null
          lng: number | null
          locationUpdatedAt: string | null
          name: string
          password: string
          phone: string
          username: string
        }
        Insert: {
          createdAt?: string
          id?: number
          isActive?: boolean
          lat?: number | null
          lng?: number | null
          locationUpdatedAt?: string | null
          name: string
          password: string
          phone: string
          username: string
        }
        Update: {
          createdAt?: string
          id?: number
          isActive?: boolean
          lat?: number | null
          lng?: number | null
          locationUpdatedAt?: string | null
          name?: string
          password?: string
          phone?: string
          username?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          avatarUrl: string | null
          createdAt: string
          id: number
          language: string | null
          lastNotificationReadAt: string | null
          name: string | null
          phone: string
          savedAddress: string | null
          telegramId: string | null
        }
        Insert: {
          avatarUrl?: string | null
          createdAt?: string
          id?: number
          language?: string | null
          lastNotificationReadAt?: string | null
          name?: string | null
          phone: string
          savedAddress?: string | null
          telegramId?: string | null
        }
        Update: {
          avatarUrl?: string | null
          createdAt?: string
          id?: number
          language?: string | null
          lastNotificationReadAt?: string | null
          name?: string | null
          phone?: string
          savedAddress?: string | null
          telegramId?: string | null
        }
        Relationships: []
      }
      liked: {
        Row: {
          createdAt: string
          customerId: number
          id: number
          productId: number
        }
        Insert: {
          createdAt?: string
          customerId: number
          id?: number
          productId: number
        }
        Update: {
          createdAt?: string
          customerId?: number
          id?: number
          productId?: number
        }
        Relationships: [
          {
            foreignKeyName: "liked_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liked_productId_fkey"
            columns: ["productId"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          createdAt: string
          customerId: number
          id: number
          isRead: boolean
          mediaType: string | null
          mediaUrl: string | null
          senderType: string
          text: string
        }
        Insert: {
          createdAt?: string
          customerId: number
          id?: number
          isRead?: boolean
          mediaType?: string | null
          mediaUrl?: string | null
          senderType: string
          text?: string
        }
        Update: {
          createdAt?: string
          customerId?: number
          id?: number
          isRead?: boolean
          mediaType?: string | null
          mediaUrl?: string | null
          senderType?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          createdAt: string
          id: number
          message: string
        }
        Insert: {
          createdAt?: string
          id?: number
          message: string
        }
        Update: {
          createdAt?: string
          id?: number
          message?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: number
          orderId: number
          price: number
          productId: number | null
          productImage: string | null
          productName: string
          quantity: number
        }
        Insert: {
          id?: number
          orderId: number
          price: number
          productId?: number | null
          productImage?: string | null
          productName: string
          quantity: number
        }
        Update: {
          id?: number
          orderId?: number
          price?: number
          productId?: number | null
          productImage?: string | null
          productName?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          courierId: number | null
          createdAt: string
          customerId: number
          deliveryFee: number
          deliveryMethod: string
          discountAmount: number
          id: number
          note: string | null
          paymentMethod: string
          promoCode: string | null
          status: string
          totalPrice: number
        }
        Insert: {
          address?: string | null
          courierId?: number | null
          createdAt?: string
          customerId: number
          deliveryFee?: number
          deliveryMethod: string
          discountAmount?: number
          id?: number
          note?: string | null
          paymentMethod: string
          promoCode?: string | null
          status?: string
          totalPrice: number
        }
        Update: {
          address?: string | null
          courierId?: number | null
          createdAt?: string
          customerId?: number
          deliveryFee?: number
          deliveryMethod?: string
          discountAmount?: number
          id?: number
          note?: string | null
          paymentMethod?: string
          promoCode?: string | null
          status?: string
          totalPrice?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_courierId_fkey"
            columns: ["courierId"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          categoryId: number | null
          createdAt: string
          description: string | null
          id: number
          images: Json
          inStock: boolean
          name: string
          oldPrice: number | null
          price: number
          unit: string
        }
        Insert: {
          categoryId?: number | null
          createdAt?: string
          description?: string | null
          id?: number
          images?: Json
          inStock?: boolean
          name: string
          oldPrice?: number | null
          price: number
          unit?: string
        }
        Update: {
          categoryId?: number | null
          createdAt?: string
          description?: string | null
          id?: number
          images?: Json
          inStock?: boolean
          name?: string
          oldPrice?: number | null
          price?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_usages: {
        Row: {
          customerId: number
          id: number
          orderId: number | null
          promoCodeId: number
          usedAt: string
        }
        Insert: {
          customerId: number
          id?: number
          orderId?: number | null
          promoCodeId: number
          usedAt?: string
        }
        Update: {
          customerId?: number
          id?: number
          orderId?: number | null
          promoCodeId?: number
          usedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usages_customerId_fkey"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usages_orderId_fkey"
            columns: ["orderId"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usages_promoCodeId_fkey"
            columns: ["promoCodeId"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          createdAt: string
          discountAmount: number
          discountType: string
          id: number
          isActive: boolean
          maxUses: number | null
          usedCount: number
        }
        Insert: {
          code: string
          createdAt?: string
          discountAmount: number
          discountType?: string
          id?: number
          isActive?: boolean
          maxUses?: number | null
          usedCount?: number
        }
        Update: {
          code?: string
          createdAt?: string
          discountAmount?: number
          discountType?: string
          id?: number
          isActive?: boolean
          maxUses?: number | null
          usedCount?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: number
          key: string
          updatedAt: string
          value: string
        }
        Insert: {
          id?: number
          key: string
          updatedAt?: string
          value: string
        }
        Update: {
          id?: number
          key?: string
          updatedAt?: string
          value?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
