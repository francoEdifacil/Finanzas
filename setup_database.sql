-- #######################################################
-- SCRIPT DE INICIALIZACIÓN: PROFITLY (COSTE DE VIDA DIGITAL)
-- #######################################################

-- 1. TIPOS ENUMERADOS
do $$ begin
  create type public.billing_cycle as enum ('monthly', 'yearly', 'weekly', 'one_time');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_status as enum ('active', 'canceled', 'paused');
exception when duplicate_object then null;
end $$;

-- 2. TABLA DE PERFILES
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  preferred_currency text not null default 'USD',
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. FUNCIONES Y TRIGGERS DE UTILIDAD
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end $$;

-- Triggers para perfiles
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. TABLA DE SUSCRIPCIONES
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_name text not null,
  vendor text,
  category text,
  plan_name text,
  status public.subscription_status not null default 'active',
  billing public.billing_cycle not null default 'monthly',
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  start_date date,
  next_billing_date date,
  canceled_at date,
  notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices de rendimiento
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index if not exists subscriptions_next_billing_idx on public.subscriptions(user_id, next_billing_date);

-- Trigger para suscripciones
drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- 5. TABLA DE PAGOS (HISTORIAL)
create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  paid_at date not null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  notes text,
  created_at timestamptz not null default now()
);

-- 6. SEGURIDAD (RLS)
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

-- Limpiar políticas existentes para evitar errores al re-ejecutar
drop policy if exists "Profiles: select own" on public.profiles;
drop policy if exists "Profiles: update own" on public.profiles;
drop policy if exists "Subscriptions: select own" on public.subscriptions;
drop policy if exists "Subscriptions: insert own" on public.subscriptions;
drop policy if exists "Subscriptions: update own" on public.subscriptions;
drop policy if exists "Subscriptions: delete own" on public.subscriptions;

-- Crear políticas nuevamente
create policy "Profiles: select own" on public.profiles for select using (auth.uid() = user_id);
create policy "Profiles: update own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Subscriptions: select own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Subscriptions: insert own" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "Subscriptions: update own" on public.subscriptions for update using (auth.uid() = user_id);
create policy "Subscriptions: delete own" on public.subscriptions for delete using (auth.uid() = user_id);

-- #######################################################
-- DATOS DE EJEMPLO (HERRAMIENTAS DE IA)
-- #######################################################
-- Instrucciones:
-- 1. Regístrate en la app (esto crea tu registro en auth.users).
-- 2. Ejecuta el bloque de abajo tal cual está. Detectará automáticamente al primer usuario registrado e insertará los datos.

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Obtenemos el ID del primer usuario registrado
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        -- Limpiamos datos previos de ejemplo para no duplicar si se re-ejecuta
        DELETE FROM public.subscriptions WHERE user_id = target_user_id AND tool_name IN ('ChatGPT Plus', 'Claude Pro', 'Midjourney', 'Perplexity Pro', 'GitHub Copilot');

        INSERT INTO public.subscriptions (user_id, tool_name, vendor, category, plan_name, amount, currency, billing, notes)
        VALUES 
        (target_user_id, 'ChatGPT Plus', 'OpenAI', 'Productividad IA', 'Plus', 20.00, 'USD', 'monthly', 'Acceso a GPT-4 y DALL-E'),
        (target_user_id, 'Claude Pro', 'Anthropic', 'Modelos de Lenguaje', 'Pro', 20.00, 'USD', 'monthly', 'Ventana de contexto ampliada'),
        (target_user_id, 'Midjourney', 'Midjourney Inc', 'Generador de Imágenes', 'Basic', 10.00, 'USD', 'monthly', 'Creación de arte por IA'),
        (target_user_id, 'Perplexity Pro', 'Perplexity AI', 'Buscador IA', 'Pro', 20.00, 'USD', 'monthly', 'Búsqueda con fuentes citadas'),
        (target_user_id, 'GitHub Copilot', 'Microsoft', 'Desarrollo', 'Individual', 10.00, 'USD', 'monthly', 'Autocompletado de código con IA');
        
        RAISE NOTICE 'Datos de ejemplo insertados para el usuario %', target_user_id;
    ELSE
        RAISE NOTICE 'No se encontró ningún usuario en auth.users. Por favor, regístrate en la app primero.';
    END IF;
END $$;
