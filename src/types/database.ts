export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Views: {
      admin_inventory_reservation_summary: {
        Row: { id: string; order_id: string; order_number: string; status: string; expires_at: string; created_at: string; finite_units: number }
        Relationships: []
      }
      admin_failed_email_jobs: {
        Row: { id: string; order_id: string; type: string; attempts: number; last_error: string | null; scheduled_for: string; locked_at: string | null; created_at: string }
        Relationships: []
      }
      admin_payment_review: {
        Row: { id: string; order_number: string; total_cents: number; currency: string; created_at: string; provider: string | null; provider_reference: string | null; payment_updated_at: string | null }
        Relationships: []
      }
    }
    Functions: {
      consume_rate_limit: { Args: { p_bucket_key: string; p_limit: number; p_window_seconds: number }; Returns: boolean }
      claim_email_jobs: { Args: { p_limit?: number }; Returns: Database['public']['Tables']['email_queue']['Row'][] }
      reserve_order_inventory: { Args: { p_order_id: string; p_ttl_seconds?: number }; Returns: string }
      release_order_inventory: { Args: { p_order_id: string; p_reason?: string; p_expired?: boolean }; Returns: boolean }
      release_expired_inventory_reservations: { Args: Record<PropertyKey, never>; Returns: number }
      finalize_paid_order: { Args: { p_order_id: string; p_provider_reference: string; p_source: string }; Returns: string }
      ingest_analytics_events: { Args: { p_session_id: string; p_events: Json }; Returns: number }
      link_analytics_session: { Args: { p_token_hash: string; p_user_id?: string | null; p_lead_id?: string | null; p_quiz_profile_id?: string | null; p_order_id?: string | null }; Returns: string | null }
      claim_analytics_outbox: { Args: { p_limit?: number }; Returns: Database['public']['Tables']['analytics_delivery_outbox']['Row'][] }
      cleanup_analytics_journeys: { Args: { p_retention_days?: number }; Returns: number }
      analytics_summary: { Args: { p_days?: number }; Returns: Json }
      admin_analytics_session_list: { Args: { p_days?: number; p_limit?: number; p_offset?: number; p_query?: string | null; p_identity?: string; p_whatsapp?: boolean }; Returns: Json }
      admin_analytics_session_detail: { Args: { p_session_id: string }; Returns: Json }
    }
    Tables: {
      categories: {
        Row: { id: string; name: string; slug: string; parent_id: string | null; sort_order: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
        Relationships: []
      }
      products: {
        Row: { id: string; name: string; slug: string; description: string | null; brand: string | null; category_id: string | null; cover_image_url: string | null; gallery_urls: string[]; usage_instructions: string | null; indications: string | null; contraindications: string | null; is_active: boolean; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }
      product_variants: {
        Row: { id: string; product_id: string; sku: string; name: string; weight_grams: number | null; is_active: boolean; stock_quantity: number | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at' | 'stock_quantity'> & { stock_quantity?: number | null }
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
        Relationships: []
      }
      product_prices: {
        Row: { id: string; variant_id: string; currency: string; amount_cents: number; compare_at_cents: number | null; effective_from: string; effective_to: string | null }
        Insert: Omit<Database['public']['Tables']['product_prices']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['product_prices']['Insert']>
        Relationships: []
      }
      tags: {
        Row: { id: string; name: string; slug: string; group: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tags']['Insert']>
        Relationships: []
      }
      product_tags: {
        Row: { product_id: string; tag_id: string }
        Insert: Database['public']['Tables']['product_tags']['Row']
        Update: Partial<Database['public']['Tables']['product_tags']['Row']>
        Relationships: []
      }
      kits: {
        Row: { id: string; name: string; slug: string; description: string | null; cover_image_url: string | null; type: 'static' | 'dynamic'; is_active: boolean; created_at: string; show_in_home: boolean; home_sort_order: number; benefits: Array<{ icon: string; title: string; desc: string }> }
        Insert: Omit<Database['public']['Tables']['kits']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['kits']['Insert']>
        Relationships: []
      }
      kit_products: {
        Row: { kit_id: string; variant_id: string; quantity: number; sort_order: number; is_required: boolean; step_label: string | null; step_when: string | null; step_instruction: string | null }
        Insert: Database['public']['Tables']['kit_products']['Row']
        Update: Partial<Database['public']['Tables']['kit_products']['Row']>
        Relationships: []
      }
      quiz_templates: {
        Row: { id: string; kit_id: string | null; name: string; description: string | null; max_questions: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['quiz_templates']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['quiz_templates']['Insert']>
        Relationships: []
      }
      quiz_question_groups: {
        Row: { id: string; template_id: string; title: string; sort_order: number; interstitial_text: string | null }
        Insert: Omit<Database['public']['Tables']['quiz_question_groups']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['quiz_question_groups']['Insert']>
        Relationships: []
      }
      quiz_questions: {
        Row: { id: string; group_id: string; text: string; subtext: string | null; type: 'single' | 'multi' | 'range' | 'age'; sort_order: number; is_required: boolean; conditions: Json | null }
        Insert: Omit<Database['public']['Tables']['quiz_questions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['quiz_questions']['Insert']>
        Relationships: []
      }
      quiz_question_options: {
        Row: { id: string; question_id: string; text: string; slug: string; icon_url: string | null; sort_order: number; tag_ids: string[]; next_question_id: string | null }
        Insert: Omit<Database['public']['Tables']['quiz_question_options']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['quiz_question_options']['Insert']>
        Relationships: []
      }
      quiz_profiles: {
        Row: { id: string; session_token: string; user_id: string | null; template_id: string | null; answers: Json; applied_tags: string[]; created_at: string }
        Insert: Omit<Database['public']['Tables']['quiz_profiles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['quiz_profiles']['Insert']>
        Relationships: []
      }
      recommendations: {
        Row: { id: string; quiz_profile_id: string; variant_id: string; score: number; rationale: string | null; created_at: string }
        Insert: { quiz_profile_id: string; variant_id: string; score: number; rationale?: string | null }
        Update: Partial<Database['public']['Tables']['recommendations']['Insert']>
        Relationships: []
      }
      leads: {
        Row: { id: string; email: string; phone: string | null; quiz_profile_id: string | null; source: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
        Relationships: []
      }
      analytics_events: {
        Row: { id: string; session_id: string; analytics_session_id: string | null; event_id: string | null; page_view_id: string | null; user_id: string | null; event: string; path: string | null; referrer: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; product_slug: string | null; variant_id: string | null; value_cents: number | null; metadata: Json; device: string | null; occurred_at: string | null; target_id: string | null; target_type: string | null; engagement_ms: number | null; created_at: string }
        Insert: { session_id: string; event: string; analytics_session_id?: string | null; event_id?: string | null; page_view_id?: string | null; user_id?: string | null; path?: string | null; referrer?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; product_slug?: string | null; variant_id?: string | null; value_cents?: number | null; metadata?: Json; device?: string | null; occurred_at?: string | null; target_id?: string | null; target_type?: string | null; engagement_ms?: number | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['analytics_events']['Insert']>
        Relationships: []
      }
      analytics_sessions: {
        Row: { id: string; token_hash: string; status: 'anonymous' | 'identified' | 'opted_out'; started_at: string; last_seen_at: string; ended_at: string | null; landing_path: string | null; last_path: string | null; active_ms: number; page_view_count: number; device: string | null; referrer: string | null; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; user_id: string | null; lead_id: string | null; quiz_profile_id: string | null; order_id: string | null; identified_at: string | null; whatsapp_code: string | null; created_at: string; updated_at: string }
        Insert: { token_hash: string; status?: 'anonymous' | 'identified' | 'opted_out'; user_id?: string | null; identified_at?: string | null }
        Update: Partial<Database['public']['Tables']['analytics_sessions']['Row']>
        Relationships: []
      }
      analytics_page_views: {
        Row: { id: string; session_id: string; path: string; title: string | null; entered_at: string; last_active_at: string; exited_at: string | null; engaged_ms: number; created_at: string }
        Insert: Omit<Database['public']['Tables']['analytics_page_views']['Row'], 'created_at' | 'engaged_ms'> & { engaged_ms?: number }
        Update: Partial<Database['public']['Tables']['analytics_page_views']['Insert']>
        Relationships: []
      }
      analytics_delivery_outbox: {
        Row: { id: string; event_id: string; provider: 'amplitude'; payload: Json; status: 'pending' | 'processing' | 'sent' | 'failed'; attempts: number; next_attempt_at: string; locked_at: string | null; last_error: string | null; sent_at: string | null; created_at: string }
        Insert: { event_id: string; provider: 'amplitude'; payload: Json }
        Update: Partial<Database['public']['Tables']['analytics_delivery_outbox']['Row']>
        Relationships: []
      }
      profiles: {
        Row: { id: string; first_name: string | null; last_name: string | null; phone: string | null; avatar_url: string | null; preferred_currency: string; quiz_profile_id: string | null; role: 'customer' | 'admin'; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      addresses: {
        Row: { id: string; user_id: string | null; first_name: string; last_name: string; phone: string | null; address_line1: string; address_line2: string | null; district: string | null; city: string; state: string | null; postal_code: string | null; country: string; is_default: boolean; created_at: string }
        Insert: { user_id?: string | null; first_name: string; last_name: string; phone?: string | null; address_line1: string; address_line2?: string | null; district?: string | null; city: string; state?: string | null; postal_code?: string | null; country: string; is_default?: boolean }
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>
        Relationships: []
      }
      coupons: {
        Row: { id: string; code: string; type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'gift_product'; value: number; gift_variant_id: string | null; scope: string; scope_category_ids: string[] | null; scope_product_ids: string[] | null; min_purchase_cents: number | null; max_uses: number | null; max_uses_per_user: number; is_active: boolean; starts_at: string | null; expires_at: string | null; created_by: string | null; created_at: string; description: string | null; used_count: number; color: string; is_public: boolean; new_customers_only: boolean; audience: 'everyone' | 'logged_out' | 'logged_in' | 'returning'; placements: string[]; promo_title: string | null; promo_subtitle: string | null; promo_cta: string | null }
        Insert: Pick<Database['public']['Tables']['coupons']['Row'], 'code' | 'type' | 'value'> & Partial<Omit<Database['public']['Tables']['coupons']['Row'], 'id' | 'created_at' | 'code' | 'type' | 'value'>>
        Update: Partial<Database['public']['Tables']['coupons']['Insert']>
        Relationships: []
      }
      carts: {
        Row: { id: string; user_id: string | null; session_token: string; currency: string; quiz_profile_id: string | null; applied_coupon_id: string | null; referral_code_used: string | null; expires_at: string; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['carts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['carts']['Insert']>
        Relationships: []
      }
      cart_items: {
        Row: { id: string; cart_id: string; variant_id: string; quantity: number; unit_price_cents: number; currency: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['cart_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>
        Relationships: []
      }
      orders: {
        Row: { id: string; order_number: string; user_id: string | null; guest_email: string | null; guest_name: string | null; guest_phone: string | null; shipping_address_id: string | null; subtotal_cents: number; discount_cents: number; tax_cents: number; total_cents: number; currency: string; coupon_id: string | null; referral_code_used: string | null; quiz_profile_id: string | null; checkout_token_hash: string | null; tracking_token_hash: string | null; reservation_expires_at: string | null; status: 'pending_payment' | 'paid' | 'payment_review' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'; notes: string | null; created_at: string; updated_at: string }
        Insert: { user_id?: string | null; guest_email?: string | null; guest_name?: string | null; guest_phone?: string | null; shipping_address_id?: string | null; subtotal_cents: number; discount_cents: number; tax_cents: number; total_cents: number; currency: string; coupon_id?: string | null; referral_code_used?: string | null; quiz_profile_id?: string | null; checkout_token_hash?: string | null; tracking_token_hash?: string | null; reservation_expires_at?: string | null; status: 'pending_payment' | 'paid' | 'payment_review' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'; notes?: string | null }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
        Relationships: []
      }
      order_items: {
        Row: { id: string; order_id: string; variant_id: string | null; product_name_snapshot: string; variant_name_snapshot: string; quantity: number; unit_price_cents: number; currency: string }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
        Relationships: []
      }
      order_status_history: {
        Row: { id: string; order_id: string; status: string; note: string | null; created_by: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['order_status_history']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['order_status_history']['Insert']>
        Relationships: []
      }
      shipments: {
        Row: { id: string; order_id: string; carrier: string | null; tracking_number: string | null; tracking_url: string | null; shipped_at: string | null; estimated_delivery_at: string | null; delivered_at: string | null }
        Insert: Omit<Database['public']['Tables']['shipments']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['shipments']['Insert']>
        Relationships: []
      }
      payments: {
        Row: { id: string; order_id: string; provider: 'culqi' | 'izipay' | 'stripe' | 'mock'; provider_reference: string | null; status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled'; amount_cents: number; currency: string; method: string | null; metadata: Json | null; idempotency_key: string; created_at: string; updated_at: string }
        Insert: { order_id: string; provider: 'culqi' | 'izipay' | 'stripe' | 'mock'; provider_reference?: string | null; status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'cancelled'; amount_cents: number; currency: string; method?: string | null; metadata?: Json | null; idempotency_key: string }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
        Relationships: []
      }
      payment_events: {
        Row: { id: string; payment_id: string; provider: string; provider_event_id: string | null; event_type: string; payload: Json; hmac_verified: boolean; processed: boolean; processing_error: string | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['payment_events']['Row'], 'id' | 'created_at' | 'provider_event_id' | 'processing_error'> & { provider_event_id?: string | null; processing_error?: string | null }
        Update: Partial<Database['public']['Tables']['payment_events']['Insert']>
        Relationships: []
      }
      reviews: {
        Row: { id: string; product_id: string; order_item_id: string | null; user_id: string | null; guest_email: string | null; rating: number; title: string | null; body: string | null; is_verified_purchase: boolean; is_published: boolean; created_at: string }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
        Relationships: []
      }
      bot_conversations: {
        Row: { id: string; user_id: string | null; session_token: string | null; context_product_ids: string[]; context_cart_id: string | null; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['bot_conversations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bot_conversations']['Insert']>
        Relationships: []
      }
      bot_messages: {
        Row: { id: string; conversation_id: string; role: 'user' | 'assistant'; content: string; suggested_swap: Json | null; swap_accepted: boolean | null; created_at: string }
        Insert: Omit<Database['public']['Tables']['bot_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bot_messages']['Insert']>
        Relationships: []
      }
      inventory_reservations: {
        Row: { id: string; order_id: string; status: 'active' | 'consumed' | 'released' | 'expired'; expires_at: string; consumed_at: string | null; released_at: string | null; release_reason: string | null; created_at: string; updated_at: string }
        Insert: { order_id: string; expires_at: string; status?: 'active' | 'consumed' | 'released' | 'expired'; consumed_at?: string | null; released_at?: string | null; release_reason?: string | null }
        Update: Partial<Database['public']['Tables']['inventory_reservations']['Insert']>
        Relationships: []
      }
      inventory_reservation_items: {
        Row: { reservation_id: string; variant_id: string; quantity: number }
        Insert: Database['public']['Tables']['inventory_reservation_items']['Row']
        Update: Partial<Database['public']['Tables']['inventory_reservation_items']['Insert']>
        Relationships: []
      }
      email_queue: {
        Row: { id: string; order_id: string; type: string; scheduled_for: string; sent: boolean; sent_at: string | null; status: 'pending' | 'processing' | 'captured' | 'sent' | 'failed'; attempts: number; locked_at: string | null; last_error: string | null; idempotency_key: string | null; payload: Json; html_snapshot: string | null; created_at: string }
        Insert: { order_id: string; type: string; scheduled_for: string; sent?: boolean; sent_at?: string | null; status?: 'pending' | 'processing' | 'captured' | 'sent' | 'failed'; attempts?: number; locked_at?: string | null; last_error?: string | null; idempotency_key?: string | null; payload?: Json; html_snapshot?: string | null }
        Update: Partial<Database['public']['Tables']['email_queue']['Insert']>
        Relationships: []
      }
      rate_limit_buckets: {
        Row: { bucket_key: string; request_count: number; window_started_at: string; expires_at: string }
        Insert: Database['public']['Tables']['rate_limit_buckets']['Row']
        Update: Partial<Database['public']['Tables']['rate_limit_buckets']['Insert']>
        Relationships: []
      }
    }
  }
}

/* Convenience row types */
export type Category = Database['public']['Tables']['categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type ProductPrice = Database['public']['Tables']['product_prices']['Row']
export type Kit = Database['public']['Tables']['kits']['Row']
export type KitProduct = Database['public']['Tables']['kit_products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type Cart = Database['public']['Tables']['carts']['Row']
export type CartItem = Database['public']['Tables']['cart_items']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']
export type Coupon = Database['public']['Tables']['coupons']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type QuizProfile = Database['public']['Tables']['quiz_profiles']['Row']

/* Enriched / joined types */
export interface ProductWithDetails extends Product {
  category: Category | null
  variants: (ProductVariant & { prices: ProductPrice[] })[]
  tags: { tag: Database['public']['Tables']['tags']['Row'] }[]
}

export interface KitWithProducts extends Kit {
  kit_products: (KitProduct & {
    variant: ProductVariant & {
      product: Product
      prices: ProductPrice[]
    }
  })[]
}

export interface CartWithItems extends Cart {
  items: (CartItem & {
    variant: ProductVariant & {
      product: Product
      prices: ProductPrice[]
    }
  })[]
  coupon: Coupon | null
}
