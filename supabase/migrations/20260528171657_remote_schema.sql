drop extension if exists "pg_net";


  create table "public"."addresses" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "first_name" text not null,
    "last_name" text not null,
    "phone" text,
    "address_line1" text not null,
    "address_line2" text,
    "district" text,
    "city" text not null,
    "state" text,
    "postal_code" text,
    "country" text not null default 'PE'::text,
    "is_default" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."addresses" enable row level security;


  create table "public"."bot_conversations" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "session_token" text,
    "context_product_ids" uuid[] not null default '{}'::uuid[],
    "context_cart_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."bot_conversations" enable row level security;


  create table "public"."bot_messages" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "conversation_id" uuid not null,
    "role" text not null,
    "content" text not null,
    "suggested_swap" jsonb,
    "swap_accepted" boolean,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."bot_messages" enable row level security;


  create table "public"."cart_items" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "cart_id" uuid not null,
    "variant_id" uuid not null,
    "quantity" integer not null default 1,
    "unit_price_cents" integer not null,
    "currency" text not null default 'PEN'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."cart_items" enable row level security;


  create table "public"."carts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "session_token" text not null,
    "currency" text not null default 'PEN'::text,
    "quiz_profile_id" uuid,
    "applied_coupon_id" uuid,
    "referral_code_used" text,
    "expires_at" timestamp with time zone not null default (now() + '7 days'::interval),
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."carts" enable row level security;


  create table "public"."categories" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "slug" text not null,
    "parent_id" uuid,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."categories" enable row level security;


  create table "public"."coupons" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "code" text not null,
    "type" text not null,
    "value" numeric not null,
    "gift_variant_id" uuid,
    "scope" text not null default 'all'::text,
    "scope_category_ids" uuid[],
    "scope_product_ids" uuid[],
    "min_purchase_cents" integer,
    "max_uses" integer,
    "max_uses_per_user" integer not null default 1,
    "is_active" boolean not null default true,
    "starts_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."coupons" enable row level security;


  create table "public"."kit_products" (
    "kit_id" uuid not null,
    "variant_id" uuid not null,
    "quantity" integer not null default 1,
    "sort_order" integer not null default 0,
    "is_required" boolean not null default true
      );


alter table "public"."kit_products" enable row level security;


  create table "public"."kits" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "cover_image_url" text,
    "type" text not null default 'static'::text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."kits" enable row level security;


  create table "public"."leads" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "email" text not null,
    "quiz_profile_id" uuid,
    "source" text not null default 'quiz'::text,
    "created_at" timestamp with time zone not null default now(),
    "phone" text
      );


alter table "public"."leads" enable row level security;


  create table "public"."order_items" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "order_id" uuid not null,
    "variant_id" uuid,
    "product_name_snapshot" text not null,
    "variant_name_snapshot" text not null,
    "quantity" integer not null,
    "unit_price_cents" integer not null,
    "currency" text not null default 'PEN'::text
      );


alter table "public"."order_items" enable row level security;


  create table "public"."order_status_history" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "order_id" uuid not null,
    "status" text not null,
    "note" text,
    "created_by" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."order_status_history" enable row level security;


  create table "public"."orders" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "order_number" text not null default public.generate_order_number(),
    "user_id" uuid,
    "guest_email" text,
    "guest_name" text,
    "guest_phone" text,
    "shipping_address_id" uuid,
    "subtotal_cents" integer not null,
    "discount_cents" integer not null default 0,
    "tax_cents" integer not null default 0,
    "total_cents" integer not null,
    "currency" text not null default 'PEN'::text,
    "coupon_id" uuid,
    "referral_code_used" text,
    "status" text not null default 'pending_payment'::text,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."orders" enable row level security;


  create table "public"."payment_events" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "payment_id" uuid not null,
    "provider" text not null,
    "event_type" text not null,
    "payload" jsonb not null,
    "hmac_verified" boolean not null default false,
    "processed" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."payment_events" enable row level security;


  create table "public"."payments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "order_id" uuid not null,
    "provider" text not null,
    "provider_reference" text,
    "status" text not null default 'pending'::text,
    "amount_cents" integer not null,
    "currency" text not null default 'PEN'::text,
    "method" text,
    "metadata" jsonb,
    "idempotency_key" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."payments" enable row level security;


  create table "public"."product_prices" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "variant_id" uuid not null,
    "currency" text not null default 'PEN'::text,
    "amount_cents" integer not null,
    "compare_at_cents" integer,
    "effective_from" timestamp with time zone not null default now(),
    "effective_to" timestamp with time zone
      );


alter table "public"."product_prices" enable row level security;


  create table "public"."product_tags" (
    "product_id" uuid not null,
    "tag_id" uuid not null
      );


alter table "public"."product_tags" enable row level security;


  create table "public"."product_variants" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "product_id" uuid not null,
    "sku" text not null,
    "name" text not null,
    "weight_grams" integer,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."product_variants" enable row level security;


  create table "public"."products" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "brand" text,
    "category_id" uuid,
    "cover_image_url" text,
    "gallery_urls" text[] not null default '{}'::text[],
    "usage_instructions" text,
    "indications" text,
    "contraindications" text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."products" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "first_name" text,
    "last_name" text,
    "phone" text,
    "avatar_url" text,
    "preferred_currency" text not null default 'PEN'::text,
    "quiz_profile_id" uuid,
    "role" text not null default 'customer'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."quiz_profiles" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "session_token" text not null,
    "user_id" uuid,
    "template_id" uuid,
    "answers" jsonb not null default '{}'::jsonb,
    "applied_tags" text[] not null default '{}'::text[],
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."quiz_profiles" enable row level security;


  create table "public"."quiz_question_groups" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "template_id" uuid not null,
    "title" text not null,
    "sort_order" integer not null default 0,
    "interstitial_text" text
      );


alter table "public"."quiz_question_groups" enable row level security;


  create table "public"."quiz_question_options" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "question_id" uuid not null,
    "text" text not null,
    "slug" text not null,
    "icon_url" text,
    "sort_order" integer not null default 0,
    "tag_ids" uuid[] not null default '{}'::uuid[],
    "next_question_id" uuid
      );


alter table "public"."quiz_question_options" enable row level security;


  create table "public"."quiz_questions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "group_id" uuid not null,
    "text" text not null,
    "subtext" text,
    "type" text not null default 'single'::text,
    "sort_order" integer not null default 0,
    "is_required" boolean not null default true,
    "conditions" jsonb
      );


alter table "public"."quiz_questions" enable row level security;


  create table "public"."quiz_templates" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "kit_id" uuid,
    "name" text not null,
    "description" text,
    "max_questions" integer not null default 8,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."quiz_templates" enable row level security;


  create table "public"."recommendations" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "quiz_profile_id" uuid not null,
    "variant_id" uuid not null,
    "score" integer not null,
    "rationale" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."recommendations" enable row level security;


  create table "public"."reviews" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "product_id" uuid not null,
    "order_item_id" uuid,
    "user_id" uuid,
    "guest_email" text,
    "rating" integer not null,
    "title" text,
    "body" text,
    "is_verified_purchase" boolean not null default false,
    "is_published" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."reviews" enable row level security;


  create table "public"."shipments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "order_id" uuid not null,
    "carrier" text,
    "tracking_number" text,
    "tracking_url" text,
    "shipped_at" timestamp with time zone,
    "estimated_delivery_at" timestamp with time zone,
    "delivered_at" timestamp with time zone
      );


alter table "public"."shipments" enable row level security;


  create table "public"."tags" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "slug" text not null,
    "group" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."tags" enable row level security;

CREATE UNIQUE INDEX addresses_pkey ON public.addresses USING btree (id);

CREATE UNIQUE INDEX bot_conversations_pkey ON public.bot_conversations USING btree (id);

CREATE UNIQUE INDEX bot_messages_pkey ON public.bot_messages USING btree (id);

CREATE UNIQUE INDEX cart_items_pkey ON public.cart_items USING btree (id);

CREATE UNIQUE INDEX carts_pkey ON public.carts USING btree (id);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);

CREATE UNIQUE INDEX coupons_pkey ON public.coupons USING btree (id);

CREATE UNIQUE INDEX kit_products_pkey ON public.kit_products USING btree (kit_id, variant_id);

CREATE UNIQUE INDEX kits_pkey ON public.kits USING btree (id);

CREATE UNIQUE INDEX kits_slug_key ON public.kits USING btree (slug);

CREATE UNIQUE INDEX leads_email_key ON public.leads USING btree (email);

CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);

CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (id);

CREATE UNIQUE INDEX order_status_history_pkey ON public.order_status_history USING btree (id);

CREATE UNIQUE INDEX orders_order_number_key ON public.orders USING btree (order_number);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX payment_events_pkey ON public.payment_events USING btree (id);

CREATE UNIQUE INDEX payments_idempotency_key_key ON public.payments USING btree (idempotency_key);

CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id);

CREATE UNIQUE INDEX product_prices_pkey ON public.product_prices USING btree (id);

CREATE UNIQUE INDEX product_tags_pkey ON public.product_tags USING btree (product_id, tag_id);

CREATE UNIQUE INDEX product_variants_pkey ON public.product_variants USING btree (id);

CREATE UNIQUE INDEX product_variants_sku_key ON public.product_variants USING btree (sku);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX products_slug_key ON public.products USING btree (slug);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX quiz_profiles_pkey ON public.quiz_profiles USING btree (id);

CREATE UNIQUE INDEX quiz_question_groups_pkey ON public.quiz_question_groups USING btree (id);

CREATE UNIQUE INDEX quiz_question_options_pkey ON public.quiz_question_options USING btree (id);

CREATE UNIQUE INDEX quiz_questions_pkey ON public.quiz_questions USING btree (id);

CREATE UNIQUE INDEX quiz_templates_pkey ON public.quiz_templates USING btree (id);

CREATE UNIQUE INDEX recommendations_pkey ON public.recommendations USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON public.reviews USING btree (id);

CREATE UNIQUE INDEX shipments_pkey ON public.shipments USING btree (id);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX tags_slug_key ON public.tags USING btree (slug);

alter table "public"."addresses" add constraint "addresses_pkey" PRIMARY KEY using index "addresses_pkey";

alter table "public"."bot_conversations" add constraint "bot_conversations_pkey" PRIMARY KEY using index "bot_conversations_pkey";

alter table "public"."bot_messages" add constraint "bot_messages_pkey" PRIMARY KEY using index "bot_messages_pkey";

alter table "public"."cart_items" add constraint "cart_items_pkey" PRIMARY KEY using index "cart_items_pkey";

alter table "public"."carts" add constraint "carts_pkey" PRIMARY KEY using index "carts_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."coupons" add constraint "coupons_pkey" PRIMARY KEY using index "coupons_pkey";

alter table "public"."kit_products" add constraint "kit_products_pkey" PRIMARY KEY using index "kit_products_pkey";

alter table "public"."kits" add constraint "kits_pkey" PRIMARY KEY using index "kits_pkey";

alter table "public"."leads" add constraint "leads_pkey" PRIMARY KEY using index "leads_pkey";

alter table "public"."order_items" add constraint "order_items_pkey" PRIMARY KEY using index "order_items_pkey";

alter table "public"."order_status_history" add constraint "order_status_history_pkey" PRIMARY KEY using index "order_status_history_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."payment_events" add constraint "payment_events_pkey" PRIMARY KEY using index "payment_events_pkey";

alter table "public"."payments" add constraint "payments_pkey" PRIMARY KEY using index "payments_pkey";

alter table "public"."product_prices" add constraint "product_prices_pkey" PRIMARY KEY using index "product_prices_pkey";

alter table "public"."product_tags" add constraint "product_tags_pkey" PRIMARY KEY using index "product_tags_pkey";

alter table "public"."product_variants" add constraint "product_variants_pkey" PRIMARY KEY using index "product_variants_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."quiz_profiles" add constraint "quiz_profiles_pkey" PRIMARY KEY using index "quiz_profiles_pkey";

alter table "public"."quiz_question_groups" add constraint "quiz_question_groups_pkey" PRIMARY KEY using index "quiz_question_groups_pkey";

alter table "public"."quiz_question_options" add constraint "quiz_question_options_pkey" PRIMARY KEY using index "quiz_question_options_pkey";

alter table "public"."quiz_questions" add constraint "quiz_questions_pkey" PRIMARY KEY using index "quiz_questions_pkey";

alter table "public"."quiz_templates" add constraint "quiz_templates_pkey" PRIMARY KEY using index "quiz_templates_pkey";

alter table "public"."recommendations" add constraint "recommendations_pkey" PRIMARY KEY using index "recommendations_pkey";

alter table "public"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "public"."shipments" add constraint "shipments_pkey" PRIMARY KEY using index "shipments_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."addresses" add constraint "addresses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."addresses" validate constraint "addresses_user_id_fkey";

alter table "public"."bot_conversations" add constraint "bot_conversations_context_cart_id_fkey" FOREIGN KEY (context_cart_id) REFERENCES public.carts(id) ON DELETE SET NULL not valid;

alter table "public"."bot_conversations" validate constraint "bot_conversations_context_cart_id_fkey";

alter table "public"."bot_conversations" add constraint "bot_conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."bot_conversations" validate constraint "bot_conversations_user_id_fkey";

alter table "public"."bot_messages" add constraint "bot_messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.bot_conversations(id) ON DELETE CASCADE not valid;

alter table "public"."bot_messages" validate constraint "bot_messages_conversation_id_fkey";

alter table "public"."bot_messages" add constraint "bot_messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text]))) not valid;

alter table "public"."bot_messages" validate constraint "bot_messages_role_check";

alter table "public"."cart_items" add constraint "cart_items_cart_id_fkey" FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE not valid;

alter table "public"."cart_items" validate constraint "cart_items_cart_id_fkey";

alter table "public"."cart_items" add constraint "cart_items_quantity_check" CHECK ((quantity > 0)) not valid;

alter table "public"."cart_items" validate constraint "cart_items_quantity_check";

alter table "public"."cart_items" add constraint "cart_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) not valid;

alter table "public"."cart_items" validate constraint "cart_items_variant_id_fkey";

alter table "public"."carts" add constraint "carts_applied_coupon_id_fkey" FOREIGN KEY (applied_coupon_id) REFERENCES public.coupons(id) not valid;

alter table "public"."carts" validate constraint "carts_applied_coupon_id_fkey";

alter table "public"."carts" add constraint "carts_quiz_profile_id_fkey" FOREIGN KEY (quiz_profile_id) REFERENCES public.quiz_profiles(id) not valid;

alter table "public"."carts" validate constraint "carts_quiz_profile_id_fkey";

alter table "public"."carts" add constraint "carts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."carts" validate constraint "carts_user_id_fkey";

alter table "public"."categories" add constraint "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.categories(id) not valid;

alter table "public"."categories" validate constraint "categories_parent_id_fkey";

alter table "public"."categories" add constraint "categories_slug_key" UNIQUE using index "categories_slug_key";

alter table "public"."coupons" add constraint "coupons_code_key" UNIQUE using index "coupons_code_key";

alter table "public"."coupons" add constraint "coupons_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."coupons" validate constraint "coupons_created_by_fkey";

alter table "public"."coupons" add constraint "coupons_gift_variant_id_fkey" FOREIGN KEY (gift_variant_id) REFERENCES public.product_variants(id) not valid;

alter table "public"."coupons" validate constraint "coupons_gift_variant_id_fkey";

alter table "public"."coupons" add constraint "coupons_type_check" CHECK ((type = ANY (ARRAY['percentage'::text, 'fixed_amount'::text, 'free_shipping'::text, 'gift_product'::text]))) not valid;

alter table "public"."coupons" validate constraint "coupons_type_check";

alter table "public"."kit_products" add constraint "kit_products_kit_id_fkey" FOREIGN KEY (kit_id) REFERENCES public.kits(id) ON DELETE CASCADE not valid;

alter table "public"."kit_products" validate constraint "kit_products_kit_id_fkey";

alter table "public"."kit_products" add constraint "kit_products_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE not valid;

alter table "public"."kit_products" validate constraint "kit_products_variant_id_fkey";

alter table "public"."kits" add constraint "kits_slug_key" UNIQUE using index "kits_slug_key";

alter table "public"."kits" add constraint "kits_type_check" CHECK ((type = ANY (ARRAY['static'::text, 'dynamic'::text]))) not valid;

alter table "public"."kits" validate constraint "kits_type_check";

alter table "public"."leads" add constraint "leads_email_key" UNIQUE using index "leads_email_key";

alter table "public"."leads" add constraint "leads_quiz_profile_id_fkey" FOREIGN KEY (quiz_profile_id) REFERENCES public.quiz_profiles(id) not valid;

alter table "public"."leads" validate constraint "leads_quiz_profile_id_fkey";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."order_items" add constraint "order_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL not valid;

alter table "public"."order_items" validate constraint "order_items_variant_id_fkey";

alter table "public"."order_status_history" add constraint "order_status_history_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_status_history" validate constraint "order_status_history_order_id_fkey";

alter table "public"."orders" add constraint "orders_coupon_id_fkey" FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) not valid;

alter table "public"."orders" validate constraint "orders_coupon_id_fkey";

alter table "public"."orders" add constraint "orders_order_number_key" UNIQUE using index "orders_order_number_key";

alter table "public"."orders" add constraint "orders_shipping_address_id_fkey" FOREIGN KEY (shipping_address_id) REFERENCES public.addresses(id) not valid;

alter table "public"."orders" validate constraint "orders_shipping_address_id_fkey";

alter table "public"."orders" add constraint "orders_status_check" CHECK ((status = ANY (ARRAY['pending_payment'::text, 'paid'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'cancelled'::text, 'refunded'::text]))) not valid;

alter table "public"."orders" validate constraint "orders_status_check";

alter table "public"."orders" add constraint "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_user_id_fkey";

alter table "public"."payment_events" add constraint "payment_events_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE not valid;

alter table "public"."payment_events" validate constraint "payment_events_payment_id_fkey";

alter table "public"."payments" add constraint "payments_idempotency_key_key" UNIQUE using index "payments_idempotency_key_key";

alter table "public"."payments" add constraint "payments_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_order_id_fkey";

alter table "public"."payments" add constraint "payments_provider_check" CHECK ((provider = ANY (ARRAY['culqi'::text, 'izipay'::text, 'stripe'::text, 'mock'::text]))) not valid;

alter table "public"."payments" validate constraint "payments_provider_check";

alter table "public"."payments" add constraint "payments_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text, 'refunded'::text, 'cancelled'::text]))) not valid;

alter table "public"."payments" validate constraint "payments_status_check";

alter table "public"."product_prices" add constraint "product_prices_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE not valid;

alter table "public"."product_prices" validate constraint "product_prices_variant_id_fkey";

alter table "public"."product_tags" add constraint "product_tags_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_tags" validate constraint "product_tags_product_id_fkey";

alter table "public"."product_tags" add constraint "product_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE not valid;

alter table "public"."product_tags" validate constraint "product_tags_tag_id_fkey";

alter table "public"."product_variants" add constraint "product_variants_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_variants" validate constraint "product_variants_product_id_fkey";

alter table "public"."product_variants" add constraint "product_variants_sku_key" UNIQUE using index "product_variants_sku_key";

alter table "public"."products" add constraint "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."products" validate constraint "products_category_id_fkey";

alter table "public"."products" add constraint "products_slug_key" UNIQUE using index "products_slug_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_quiz_profile_id_fkey" FOREIGN KEY (quiz_profile_id) REFERENCES public.quiz_profiles(id) not valid;

alter table "public"."profiles" validate constraint "profiles_quiz_profile_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['customer'::text, 'admin'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."quiz_profiles" add constraint "quiz_profiles_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.quiz_templates(id) not valid;

alter table "public"."quiz_profiles" validate constraint "quiz_profiles_template_id_fkey";

alter table "public"."quiz_profiles" add constraint "quiz_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."quiz_profiles" validate constraint "quiz_profiles_user_id_fkey";

alter table "public"."quiz_question_groups" add constraint "quiz_question_groups_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.quiz_templates(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_question_groups" validate constraint "quiz_question_groups_template_id_fkey";

alter table "public"."quiz_question_options" add constraint "quiz_question_options_next_question_id_fkey" FOREIGN KEY (next_question_id) REFERENCES public.quiz_questions(id) not valid;

alter table "public"."quiz_question_options" validate constraint "quiz_question_options_next_question_id_fkey";

alter table "public"."quiz_question_options" add constraint "quiz_question_options_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_question_options" validate constraint "quiz_question_options_question_id_fkey";

alter table "public"."quiz_questions" add constraint "quiz_questions_group_id_fkey" FOREIGN KEY (group_id) REFERENCES public.quiz_question_groups(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_questions" validate constraint "quiz_questions_group_id_fkey";

alter table "public"."quiz_questions" add constraint "quiz_questions_type_check" CHECK ((type = ANY (ARRAY['single'::text, 'multi'::text, 'range'::text, 'age'::text]))) not valid;

alter table "public"."quiz_questions" validate constraint "quiz_questions_type_check";

alter table "public"."quiz_templates" add constraint "quiz_templates_kit_id_fkey" FOREIGN KEY (kit_id) REFERENCES public.kits(id) not valid;

alter table "public"."quiz_templates" validate constraint "quiz_templates_kit_id_fkey";

alter table "public"."recommendations" add constraint "recommendations_quiz_profile_id_fkey" FOREIGN KEY (quiz_profile_id) REFERENCES public.quiz_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."recommendations" validate constraint "recommendations_quiz_profile_id_fkey";

alter table "public"."recommendations" add constraint "recommendations_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) not valid;

alter table "public"."recommendations" validate constraint "recommendations_variant_id_fkey";

alter table "public"."reviews" add constraint "reviews_order_item_id_fkey" FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE SET NULL not valid;

alter table "public"."reviews" validate constraint "reviews_order_item_id_fkey";

alter table "public"."reviews" add constraint "reviews_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."reviews" validate constraint "reviews_product_id_fkey";

alter table "public"."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."reviews" validate constraint "reviews_rating_check";

alter table "public"."reviews" add constraint "reviews_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."reviews" validate constraint "reviews_user_id_fkey";

alter table "public"."shipments" add constraint "shipments_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."shipments" validate constraint "shipments_order_id_fkey";

alter table "public"."tags" add constraint "tags_slug_key" UNIQUE using index "tags_slug_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE v_num TEXT; v_exists BOOLEAN;
BEGIN
  LOOP
    v_num := 'LIO-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6));
    SELECT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_num) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_num;
END; $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_full_name  text;
  v_first_name text;
  v_last_name  text;
BEGIN
  -- Google OAuth sends 'full_name' or 'name'; email signup has neither
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  );

  IF v_full_name IS NOT NULL AND v_full_name <> '' THEN
    v_first_name := split_part(v_full_name, ' ', 1);
    -- Everything after the first space becomes the last name
    v_last_name  := NULLIF(trim(substring(v_full_name from position(' ' in v_full_name) + 1)), '');
  END IF;

  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NULLIF(v_first_name, ''),
    v_last_name,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
    SET
      first_name = COALESCE(EXCLUDED.first_name, public.profiles.first_name),
      last_name  = COALESCE(EXCLUDED.last_name,  public.profiles.last_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
      updated_at = now();

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $function$
;

grant delete on table "public"."addresses" to "anon";

grant insert on table "public"."addresses" to "anon";

grant references on table "public"."addresses" to "anon";

grant select on table "public"."addresses" to "anon";

grant trigger on table "public"."addresses" to "anon";

grant truncate on table "public"."addresses" to "anon";

grant update on table "public"."addresses" to "anon";

grant delete on table "public"."addresses" to "authenticated";

grant insert on table "public"."addresses" to "authenticated";

grant references on table "public"."addresses" to "authenticated";

grant select on table "public"."addresses" to "authenticated";

grant trigger on table "public"."addresses" to "authenticated";

grant truncate on table "public"."addresses" to "authenticated";

grant update on table "public"."addresses" to "authenticated";

grant delete on table "public"."addresses" to "service_role";

grant insert on table "public"."addresses" to "service_role";

grant references on table "public"."addresses" to "service_role";

grant select on table "public"."addresses" to "service_role";

grant trigger on table "public"."addresses" to "service_role";

grant truncate on table "public"."addresses" to "service_role";

grant update on table "public"."addresses" to "service_role";

grant delete on table "public"."bot_conversations" to "anon";

grant insert on table "public"."bot_conversations" to "anon";

grant references on table "public"."bot_conversations" to "anon";

grant select on table "public"."bot_conversations" to "anon";

grant trigger on table "public"."bot_conversations" to "anon";

grant truncate on table "public"."bot_conversations" to "anon";

grant update on table "public"."bot_conversations" to "anon";

grant delete on table "public"."bot_conversations" to "authenticated";

grant insert on table "public"."bot_conversations" to "authenticated";

grant references on table "public"."bot_conversations" to "authenticated";

grant select on table "public"."bot_conversations" to "authenticated";

grant trigger on table "public"."bot_conversations" to "authenticated";

grant truncate on table "public"."bot_conversations" to "authenticated";

grant update on table "public"."bot_conversations" to "authenticated";

grant delete on table "public"."bot_conversations" to "service_role";

grant insert on table "public"."bot_conversations" to "service_role";

grant references on table "public"."bot_conversations" to "service_role";

grant select on table "public"."bot_conversations" to "service_role";

grant trigger on table "public"."bot_conversations" to "service_role";

grant truncate on table "public"."bot_conversations" to "service_role";

grant update on table "public"."bot_conversations" to "service_role";

grant delete on table "public"."bot_messages" to "anon";

grant insert on table "public"."bot_messages" to "anon";

grant references on table "public"."bot_messages" to "anon";

grant select on table "public"."bot_messages" to "anon";

grant trigger on table "public"."bot_messages" to "anon";

grant truncate on table "public"."bot_messages" to "anon";

grant update on table "public"."bot_messages" to "anon";

grant delete on table "public"."bot_messages" to "authenticated";

grant insert on table "public"."bot_messages" to "authenticated";

grant references on table "public"."bot_messages" to "authenticated";

grant select on table "public"."bot_messages" to "authenticated";

grant trigger on table "public"."bot_messages" to "authenticated";

grant truncate on table "public"."bot_messages" to "authenticated";

grant update on table "public"."bot_messages" to "authenticated";

grant delete on table "public"."bot_messages" to "service_role";

grant insert on table "public"."bot_messages" to "service_role";

grant references on table "public"."bot_messages" to "service_role";

grant select on table "public"."bot_messages" to "service_role";

grant trigger on table "public"."bot_messages" to "service_role";

grant truncate on table "public"."bot_messages" to "service_role";

grant update on table "public"."bot_messages" to "service_role";

grant delete on table "public"."cart_items" to "anon";

grant insert on table "public"."cart_items" to "anon";

grant references on table "public"."cart_items" to "anon";

grant select on table "public"."cart_items" to "anon";

grant trigger on table "public"."cart_items" to "anon";

grant truncate on table "public"."cart_items" to "anon";

grant update on table "public"."cart_items" to "anon";

grant delete on table "public"."cart_items" to "authenticated";

grant insert on table "public"."cart_items" to "authenticated";

grant references on table "public"."cart_items" to "authenticated";

grant select on table "public"."cart_items" to "authenticated";

grant trigger on table "public"."cart_items" to "authenticated";

grant truncate on table "public"."cart_items" to "authenticated";

grant update on table "public"."cart_items" to "authenticated";

grant delete on table "public"."cart_items" to "service_role";

grant insert on table "public"."cart_items" to "service_role";

grant references on table "public"."cart_items" to "service_role";

grant select on table "public"."cart_items" to "service_role";

grant trigger on table "public"."cart_items" to "service_role";

grant truncate on table "public"."cart_items" to "service_role";

grant update on table "public"."cart_items" to "service_role";

grant delete on table "public"."carts" to "anon";

grant insert on table "public"."carts" to "anon";

grant references on table "public"."carts" to "anon";

grant select on table "public"."carts" to "anon";

grant trigger on table "public"."carts" to "anon";

grant truncate on table "public"."carts" to "anon";

grant update on table "public"."carts" to "anon";

grant delete on table "public"."carts" to "authenticated";

grant insert on table "public"."carts" to "authenticated";

grant references on table "public"."carts" to "authenticated";

grant select on table "public"."carts" to "authenticated";

grant trigger on table "public"."carts" to "authenticated";

grant truncate on table "public"."carts" to "authenticated";

grant update on table "public"."carts" to "authenticated";

grant delete on table "public"."carts" to "service_role";

grant insert on table "public"."carts" to "service_role";

grant references on table "public"."carts" to "service_role";

grant select on table "public"."carts" to "service_role";

grant trigger on table "public"."carts" to "service_role";

grant truncate on table "public"."carts" to "service_role";

grant update on table "public"."carts" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."coupons" to "anon";

grant insert on table "public"."coupons" to "anon";

grant references on table "public"."coupons" to "anon";

grant select on table "public"."coupons" to "anon";

grant trigger on table "public"."coupons" to "anon";

grant truncate on table "public"."coupons" to "anon";

grant update on table "public"."coupons" to "anon";

grant delete on table "public"."coupons" to "authenticated";

grant insert on table "public"."coupons" to "authenticated";

grant references on table "public"."coupons" to "authenticated";

grant select on table "public"."coupons" to "authenticated";

grant trigger on table "public"."coupons" to "authenticated";

grant truncate on table "public"."coupons" to "authenticated";

grant update on table "public"."coupons" to "authenticated";

grant delete on table "public"."coupons" to "service_role";

grant insert on table "public"."coupons" to "service_role";

grant references on table "public"."coupons" to "service_role";

grant select on table "public"."coupons" to "service_role";

grant trigger on table "public"."coupons" to "service_role";

grant truncate on table "public"."coupons" to "service_role";

grant update on table "public"."coupons" to "service_role";

grant delete on table "public"."kit_products" to "anon";

grant insert on table "public"."kit_products" to "anon";

grant references on table "public"."kit_products" to "anon";

grant select on table "public"."kit_products" to "anon";

grant trigger on table "public"."kit_products" to "anon";

grant truncate on table "public"."kit_products" to "anon";

grant update on table "public"."kit_products" to "anon";

grant delete on table "public"."kit_products" to "authenticated";

grant insert on table "public"."kit_products" to "authenticated";

grant references on table "public"."kit_products" to "authenticated";

grant select on table "public"."kit_products" to "authenticated";

grant trigger on table "public"."kit_products" to "authenticated";

grant truncate on table "public"."kit_products" to "authenticated";

grant update on table "public"."kit_products" to "authenticated";

grant delete on table "public"."kit_products" to "service_role";

grant insert on table "public"."kit_products" to "service_role";

grant references on table "public"."kit_products" to "service_role";

grant select on table "public"."kit_products" to "service_role";

grant trigger on table "public"."kit_products" to "service_role";

grant truncate on table "public"."kit_products" to "service_role";

grant update on table "public"."kit_products" to "service_role";

grant delete on table "public"."kits" to "anon";

grant insert on table "public"."kits" to "anon";

grant references on table "public"."kits" to "anon";

grant select on table "public"."kits" to "anon";

grant trigger on table "public"."kits" to "anon";

grant truncate on table "public"."kits" to "anon";

grant update on table "public"."kits" to "anon";

grant delete on table "public"."kits" to "authenticated";

grant insert on table "public"."kits" to "authenticated";

grant references on table "public"."kits" to "authenticated";

grant select on table "public"."kits" to "authenticated";

grant trigger on table "public"."kits" to "authenticated";

grant truncate on table "public"."kits" to "authenticated";

grant update on table "public"."kits" to "authenticated";

grant delete on table "public"."kits" to "service_role";

grant insert on table "public"."kits" to "service_role";

grant references on table "public"."kits" to "service_role";

grant select on table "public"."kits" to "service_role";

grant trigger on table "public"."kits" to "service_role";

grant truncate on table "public"."kits" to "service_role";

grant update on table "public"."kits" to "service_role";

grant delete on table "public"."leads" to "anon";

grant insert on table "public"."leads" to "anon";

grant references on table "public"."leads" to "anon";

grant select on table "public"."leads" to "anon";

grant trigger on table "public"."leads" to "anon";

grant truncate on table "public"."leads" to "anon";

grant update on table "public"."leads" to "anon";

grant delete on table "public"."leads" to "authenticated";

grant insert on table "public"."leads" to "authenticated";

grant references on table "public"."leads" to "authenticated";

grant select on table "public"."leads" to "authenticated";

grant trigger on table "public"."leads" to "authenticated";

grant truncate on table "public"."leads" to "authenticated";

grant update on table "public"."leads" to "authenticated";

grant delete on table "public"."leads" to "service_role";

grant insert on table "public"."leads" to "service_role";

grant references on table "public"."leads" to "service_role";

grant select on table "public"."leads" to "service_role";

grant trigger on table "public"."leads" to "service_role";

grant truncate on table "public"."leads" to "service_role";

grant update on table "public"."leads" to "service_role";

grant delete on table "public"."order_items" to "anon";

grant insert on table "public"."order_items" to "anon";

grant references on table "public"."order_items" to "anon";

grant select on table "public"."order_items" to "anon";

grant trigger on table "public"."order_items" to "anon";

grant truncate on table "public"."order_items" to "anon";

grant update on table "public"."order_items" to "anon";

grant delete on table "public"."order_items" to "authenticated";

grant insert on table "public"."order_items" to "authenticated";

grant references on table "public"."order_items" to "authenticated";

grant select on table "public"."order_items" to "authenticated";

grant trigger on table "public"."order_items" to "authenticated";

grant truncate on table "public"."order_items" to "authenticated";

grant update on table "public"."order_items" to "authenticated";

grant delete on table "public"."order_items" to "service_role";

grant insert on table "public"."order_items" to "service_role";

grant references on table "public"."order_items" to "service_role";

grant select on table "public"."order_items" to "service_role";

grant trigger on table "public"."order_items" to "service_role";

grant truncate on table "public"."order_items" to "service_role";

grant update on table "public"."order_items" to "service_role";

grant delete on table "public"."order_status_history" to "anon";

grant insert on table "public"."order_status_history" to "anon";

grant references on table "public"."order_status_history" to "anon";

grant select on table "public"."order_status_history" to "anon";

grant trigger on table "public"."order_status_history" to "anon";

grant truncate on table "public"."order_status_history" to "anon";

grant update on table "public"."order_status_history" to "anon";

grant delete on table "public"."order_status_history" to "authenticated";

grant insert on table "public"."order_status_history" to "authenticated";

grant references on table "public"."order_status_history" to "authenticated";

grant select on table "public"."order_status_history" to "authenticated";

grant trigger on table "public"."order_status_history" to "authenticated";

grant truncate on table "public"."order_status_history" to "authenticated";

grant update on table "public"."order_status_history" to "authenticated";

grant delete on table "public"."order_status_history" to "service_role";

grant insert on table "public"."order_status_history" to "service_role";

grant references on table "public"."order_status_history" to "service_role";

grant select on table "public"."order_status_history" to "service_role";

grant trigger on table "public"."order_status_history" to "service_role";

grant truncate on table "public"."order_status_history" to "service_role";

grant update on table "public"."order_status_history" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."payment_events" to "anon";

grant insert on table "public"."payment_events" to "anon";

grant references on table "public"."payment_events" to "anon";

grant select on table "public"."payment_events" to "anon";

grant trigger on table "public"."payment_events" to "anon";

grant truncate on table "public"."payment_events" to "anon";

grant update on table "public"."payment_events" to "anon";

grant delete on table "public"."payment_events" to "authenticated";

grant insert on table "public"."payment_events" to "authenticated";

grant references on table "public"."payment_events" to "authenticated";

grant select on table "public"."payment_events" to "authenticated";

grant trigger on table "public"."payment_events" to "authenticated";

grant truncate on table "public"."payment_events" to "authenticated";

grant update on table "public"."payment_events" to "authenticated";

grant delete on table "public"."payment_events" to "service_role";

grant insert on table "public"."payment_events" to "service_role";

grant references on table "public"."payment_events" to "service_role";

grant select on table "public"."payment_events" to "service_role";

grant trigger on table "public"."payment_events" to "service_role";

grant truncate on table "public"."payment_events" to "service_role";

grant update on table "public"."payment_events" to "service_role";

grant delete on table "public"."payments" to "anon";

grant insert on table "public"."payments" to "anon";

grant references on table "public"."payments" to "anon";

grant select on table "public"."payments" to "anon";

grant trigger on table "public"."payments" to "anon";

grant truncate on table "public"."payments" to "anon";

grant update on table "public"."payments" to "anon";

grant delete on table "public"."payments" to "authenticated";

grant insert on table "public"."payments" to "authenticated";

grant references on table "public"."payments" to "authenticated";

grant select on table "public"."payments" to "authenticated";

grant trigger on table "public"."payments" to "authenticated";

grant truncate on table "public"."payments" to "authenticated";

grant update on table "public"."payments" to "authenticated";

grant delete on table "public"."payments" to "service_role";

grant insert on table "public"."payments" to "service_role";

grant references on table "public"."payments" to "service_role";

grant select on table "public"."payments" to "service_role";

grant trigger on table "public"."payments" to "service_role";

grant truncate on table "public"."payments" to "service_role";

grant update on table "public"."payments" to "service_role";

grant delete on table "public"."product_prices" to "anon";

grant insert on table "public"."product_prices" to "anon";

grant references on table "public"."product_prices" to "anon";

grant select on table "public"."product_prices" to "anon";

grant trigger on table "public"."product_prices" to "anon";

grant truncate on table "public"."product_prices" to "anon";

grant update on table "public"."product_prices" to "anon";

grant delete on table "public"."product_prices" to "authenticated";

grant insert on table "public"."product_prices" to "authenticated";

grant references on table "public"."product_prices" to "authenticated";

grant select on table "public"."product_prices" to "authenticated";

grant trigger on table "public"."product_prices" to "authenticated";

grant truncate on table "public"."product_prices" to "authenticated";

grant update on table "public"."product_prices" to "authenticated";

grant delete on table "public"."product_prices" to "service_role";

grant insert on table "public"."product_prices" to "service_role";

grant references on table "public"."product_prices" to "service_role";

grant select on table "public"."product_prices" to "service_role";

grant trigger on table "public"."product_prices" to "service_role";

grant truncate on table "public"."product_prices" to "service_role";

grant update on table "public"."product_prices" to "service_role";

grant delete on table "public"."product_tags" to "anon";

grant insert on table "public"."product_tags" to "anon";

grant references on table "public"."product_tags" to "anon";

grant select on table "public"."product_tags" to "anon";

grant trigger on table "public"."product_tags" to "anon";

grant truncate on table "public"."product_tags" to "anon";

grant update on table "public"."product_tags" to "anon";

grant delete on table "public"."product_tags" to "authenticated";

grant insert on table "public"."product_tags" to "authenticated";

grant references on table "public"."product_tags" to "authenticated";

grant select on table "public"."product_tags" to "authenticated";

grant trigger on table "public"."product_tags" to "authenticated";

grant truncate on table "public"."product_tags" to "authenticated";

grant update on table "public"."product_tags" to "authenticated";

grant delete on table "public"."product_tags" to "service_role";

grant insert on table "public"."product_tags" to "service_role";

grant references on table "public"."product_tags" to "service_role";

grant select on table "public"."product_tags" to "service_role";

grant trigger on table "public"."product_tags" to "service_role";

grant truncate on table "public"."product_tags" to "service_role";

grant update on table "public"."product_tags" to "service_role";

grant delete on table "public"."product_variants" to "anon";

grant insert on table "public"."product_variants" to "anon";

grant references on table "public"."product_variants" to "anon";

grant select on table "public"."product_variants" to "anon";

grant trigger on table "public"."product_variants" to "anon";

grant truncate on table "public"."product_variants" to "anon";

grant update on table "public"."product_variants" to "anon";

grant delete on table "public"."product_variants" to "authenticated";

grant insert on table "public"."product_variants" to "authenticated";

grant references on table "public"."product_variants" to "authenticated";

grant select on table "public"."product_variants" to "authenticated";

grant trigger on table "public"."product_variants" to "authenticated";

grant truncate on table "public"."product_variants" to "authenticated";

grant update on table "public"."product_variants" to "authenticated";

grant delete on table "public"."product_variants" to "service_role";

grant insert on table "public"."product_variants" to "service_role";

grant references on table "public"."product_variants" to "service_role";

grant select on table "public"."product_variants" to "service_role";

grant trigger on table "public"."product_variants" to "service_role";

grant truncate on table "public"."product_variants" to "service_role";

grant update on table "public"."product_variants" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."quiz_profiles" to "anon";

grant insert on table "public"."quiz_profiles" to "anon";

grant references on table "public"."quiz_profiles" to "anon";

grant select on table "public"."quiz_profiles" to "anon";

grant trigger on table "public"."quiz_profiles" to "anon";

grant truncate on table "public"."quiz_profiles" to "anon";

grant update on table "public"."quiz_profiles" to "anon";

grant delete on table "public"."quiz_profiles" to "authenticated";

grant insert on table "public"."quiz_profiles" to "authenticated";

grant references on table "public"."quiz_profiles" to "authenticated";

grant select on table "public"."quiz_profiles" to "authenticated";

grant trigger on table "public"."quiz_profiles" to "authenticated";

grant truncate on table "public"."quiz_profiles" to "authenticated";

grant update on table "public"."quiz_profiles" to "authenticated";

grant delete on table "public"."quiz_profiles" to "service_role";

grant insert on table "public"."quiz_profiles" to "service_role";

grant references on table "public"."quiz_profiles" to "service_role";

grant select on table "public"."quiz_profiles" to "service_role";

grant trigger on table "public"."quiz_profiles" to "service_role";

grant truncate on table "public"."quiz_profiles" to "service_role";

grant update on table "public"."quiz_profiles" to "service_role";

grant delete on table "public"."quiz_question_groups" to "anon";

grant insert on table "public"."quiz_question_groups" to "anon";

grant references on table "public"."quiz_question_groups" to "anon";

grant select on table "public"."quiz_question_groups" to "anon";

grant trigger on table "public"."quiz_question_groups" to "anon";

grant truncate on table "public"."quiz_question_groups" to "anon";

grant update on table "public"."quiz_question_groups" to "anon";

grant delete on table "public"."quiz_question_groups" to "authenticated";

grant insert on table "public"."quiz_question_groups" to "authenticated";

grant references on table "public"."quiz_question_groups" to "authenticated";

grant select on table "public"."quiz_question_groups" to "authenticated";

grant trigger on table "public"."quiz_question_groups" to "authenticated";

grant truncate on table "public"."quiz_question_groups" to "authenticated";

grant update on table "public"."quiz_question_groups" to "authenticated";

grant delete on table "public"."quiz_question_groups" to "service_role";

grant insert on table "public"."quiz_question_groups" to "service_role";

grant references on table "public"."quiz_question_groups" to "service_role";

grant select on table "public"."quiz_question_groups" to "service_role";

grant trigger on table "public"."quiz_question_groups" to "service_role";

grant truncate on table "public"."quiz_question_groups" to "service_role";

grant update on table "public"."quiz_question_groups" to "service_role";

grant delete on table "public"."quiz_question_options" to "anon";

grant insert on table "public"."quiz_question_options" to "anon";

grant references on table "public"."quiz_question_options" to "anon";

grant select on table "public"."quiz_question_options" to "anon";

grant trigger on table "public"."quiz_question_options" to "anon";

grant truncate on table "public"."quiz_question_options" to "anon";

grant update on table "public"."quiz_question_options" to "anon";

grant delete on table "public"."quiz_question_options" to "authenticated";

grant insert on table "public"."quiz_question_options" to "authenticated";

grant references on table "public"."quiz_question_options" to "authenticated";

grant select on table "public"."quiz_question_options" to "authenticated";

grant trigger on table "public"."quiz_question_options" to "authenticated";

grant truncate on table "public"."quiz_question_options" to "authenticated";

grant update on table "public"."quiz_question_options" to "authenticated";

grant delete on table "public"."quiz_question_options" to "service_role";

grant insert on table "public"."quiz_question_options" to "service_role";

grant references on table "public"."quiz_question_options" to "service_role";

grant select on table "public"."quiz_question_options" to "service_role";

grant trigger on table "public"."quiz_question_options" to "service_role";

grant truncate on table "public"."quiz_question_options" to "service_role";

grant update on table "public"."quiz_question_options" to "service_role";

grant delete on table "public"."quiz_questions" to "anon";

grant insert on table "public"."quiz_questions" to "anon";

grant references on table "public"."quiz_questions" to "anon";

grant select on table "public"."quiz_questions" to "anon";

grant trigger on table "public"."quiz_questions" to "anon";

grant truncate on table "public"."quiz_questions" to "anon";

grant update on table "public"."quiz_questions" to "anon";

grant delete on table "public"."quiz_questions" to "authenticated";

grant insert on table "public"."quiz_questions" to "authenticated";

grant references on table "public"."quiz_questions" to "authenticated";

grant select on table "public"."quiz_questions" to "authenticated";

grant trigger on table "public"."quiz_questions" to "authenticated";

grant truncate on table "public"."quiz_questions" to "authenticated";

grant update on table "public"."quiz_questions" to "authenticated";

grant delete on table "public"."quiz_questions" to "service_role";

grant insert on table "public"."quiz_questions" to "service_role";

grant references on table "public"."quiz_questions" to "service_role";

grant select on table "public"."quiz_questions" to "service_role";

grant trigger on table "public"."quiz_questions" to "service_role";

grant truncate on table "public"."quiz_questions" to "service_role";

grant update on table "public"."quiz_questions" to "service_role";

grant delete on table "public"."quiz_templates" to "anon";

grant insert on table "public"."quiz_templates" to "anon";

grant references on table "public"."quiz_templates" to "anon";

grant select on table "public"."quiz_templates" to "anon";

grant trigger on table "public"."quiz_templates" to "anon";

grant truncate on table "public"."quiz_templates" to "anon";

grant update on table "public"."quiz_templates" to "anon";

grant delete on table "public"."quiz_templates" to "authenticated";

grant insert on table "public"."quiz_templates" to "authenticated";

grant references on table "public"."quiz_templates" to "authenticated";

grant select on table "public"."quiz_templates" to "authenticated";

grant trigger on table "public"."quiz_templates" to "authenticated";

grant truncate on table "public"."quiz_templates" to "authenticated";

grant update on table "public"."quiz_templates" to "authenticated";

grant delete on table "public"."quiz_templates" to "service_role";

grant insert on table "public"."quiz_templates" to "service_role";

grant references on table "public"."quiz_templates" to "service_role";

grant select on table "public"."quiz_templates" to "service_role";

grant trigger on table "public"."quiz_templates" to "service_role";

grant truncate on table "public"."quiz_templates" to "service_role";

grant update on table "public"."quiz_templates" to "service_role";

grant delete on table "public"."recommendations" to "anon";

grant insert on table "public"."recommendations" to "anon";

grant references on table "public"."recommendations" to "anon";

grant select on table "public"."recommendations" to "anon";

grant trigger on table "public"."recommendations" to "anon";

grant truncate on table "public"."recommendations" to "anon";

grant update on table "public"."recommendations" to "anon";

grant delete on table "public"."recommendations" to "authenticated";

grant insert on table "public"."recommendations" to "authenticated";

grant references on table "public"."recommendations" to "authenticated";

grant select on table "public"."recommendations" to "authenticated";

grant trigger on table "public"."recommendations" to "authenticated";

grant truncate on table "public"."recommendations" to "authenticated";

grant update on table "public"."recommendations" to "authenticated";

grant delete on table "public"."recommendations" to "service_role";

grant insert on table "public"."recommendations" to "service_role";

grant references on table "public"."recommendations" to "service_role";

grant select on table "public"."recommendations" to "service_role";

grant trigger on table "public"."recommendations" to "service_role";

grant truncate on table "public"."recommendations" to "service_role";

grant update on table "public"."recommendations" to "service_role";

grant delete on table "public"."reviews" to "anon";

grant insert on table "public"."reviews" to "anon";

grant references on table "public"."reviews" to "anon";

grant select on table "public"."reviews" to "anon";

grant trigger on table "public"."reviews" to "anon";

grant truncate on table "public"."reviews" to "anon";

grant update on table "public"."reviews" to "anon";

grant delete on table "public"."reviews" to "authenticated";

grant insert on table "public"."reviews" to "authenticated";

grant references on table "public"."reviews" to "authenticated";

grant select on table "public"."reviews" to "authenticated";

grant trigger on table "public"."reviews" to "authenticated";

grant truncate on table "public"."reviews" to "authenticated";

grant update on table "public"."reviews" to "authenticated";

grant delete on table "public"."reviews" to "service_role";

grant insert on table "public"."reviews" to "service_role";

grant references on table "public"."reviews" to "service_role";

grant select on table "public"."reviews" to "service_role";

grant trigger on table "public"."reviews" to "service_role";

grant truncate on table "public"."reviews" to "service_role";

grant update on table "public"."reviews" to "service_role";

grant delete on table "public"."shipments" to "anon";

grant insert on table "public"."shipments" to "anon";

grant references on table "public"."shipments" to "anon";

grant select on table "public"."shipments" to "anon";

grant trigger on table "public"."shipments" to "anon";

grant truncate on table "public"."shipments" to "anon";

grant update on table "public"."shipments" to "anon";

grant delete on table "public"."shipments" to "authenticated";

grant insert on table "public"."shipments" to "authenticated";

grant references on table "public"."shipments" to "authenticated";

grant select on table "public"."shipments" to "authenticated";

grant trigger on table "public"."shipments" to "authenticated";

grant truncate on table "public"."shipments" to "authenticated";

grant update on table "public"."shipments" to "authenticated";

grant delete on table "public"."shipments" to "service_role";

grant insert on table "public"."shipments" to "service_role";

grant references on table "public"."shipments" to "service_role";

grant select on table "public"."shipments" to "service_role";

grant trigger on table "public"."shipments" to "service_role";

grant truncate on table "public"."shipments" to "service_role";

grant update on table "public"."shipments" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant references on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant trigger on table "public"."tags" to "anon";

grant truncate on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant references on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant trigger on table "public"."tags" to "authenticated";

grant truncate on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant references on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant trigger on table "public"."tags" to "service_role";

grant truncate on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";


  create policy "owner_all"
  on "public"."addresses"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "public_read"
  on "public"."categories"
  as permissive
  for select
  to public
using (true);



  create policy "public_read"
  on "public"."coupons"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "public_read"
  on "public"."kit_products"
  as permissive
  for select
  to public
using (true);



  create policy "public_read"
  on "public"."kits"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "anon_insert"
  on "public"."leads"
  as permissive
  for insert
  to public
with check (true);



  create policy "anon_insert"
  on "public"."order_items"
  as permissive
  for insert
  to public
with check (true);



  create policy "owner_read"
  on "public"."order_items"
  as permissive
  for select
  to public
using (true);



  create policy "anon_insert"
  on "public"."order_status_history"
  as permissive
  for insert
  to public
with check (true);



  create policy "anon_insert"
  on "public"."orders"
  as permissive
  for insert
  to public
with check (true);



  create policy "owner_read"
  on "public"."orders"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "anon_insert"
  on "public"."payment_events"
  as permissive
  for insert
  to public
with check (true);



  create policy "anon_insert"
  on "public"."payments"
  as permissive
  for insert
  to public
with check (true);



  create policy "public_read"
  on "public"."product_prices"
  as permissive
  for select
  to public
using (true);



  create policy "public_read"
  on "public"."product_tags"
  as permissive
  for select
  to public
using (true);



  create policy "public_read"
  on "public"."product_variants"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "public_read"
  on "public"."products"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "owner_insert"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "owner_read"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "owner_update"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "anon_insert"
  on "public"."quiz_profiles"
  as permissive
  for insert
  to public
with check (true);



  create policy "owner_read"
  on "public"."quiz_profiles"
  as permissive
  for select
  to public
using (((user_id IS NULL) OR (auth.uid() = user_id)));



  create policy "public_read"
  on "public"."quiz_question_groups"
  as permissive
  for select
  to public
using (true);



  create policy "public_read"
  on "public"."quiz_question_options"
  as permissive
  for select
  to public
using (true);



  create policy "public_read"
  on "public"."quiz_questions"
  as permissive
  for select
  to public
using (true);



  create policy "public_read"
  on "public"."quiz_templates"
  as permissive
  for select
  to public
using (true);



  create policy "anon_insert"
  on "public"."recommendations"
  as permissive
  for insert
  to public
with check (true);



  create policy "public_read"
  on "public"."reviews"
  as permissive
  for select
  to public
using ((is_published = true));



  create policy "public_read"
  on "public"."shipments"
  as permissive
  for select
  to public
using (true);



  create policy "public_read"
  on "public"."tags"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bot_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


