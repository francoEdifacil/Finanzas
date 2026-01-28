# Plan de Desarrollo y Arquitectura — App “Coste de Vida Digital” (Control de gastos en Software/IA)

> **Objetivo:** construir una aplicación web sencilla donde cada usuario registra sus suscripciones activas (software/IA) y visualiza su “coste de vida digital” con panel de métricas, gráficas y filtros.  
> **Stack:** Next.js (App Router) + Tailwind CSS + Supabase (Auth + Postgres) + VPS (Dokploy) + Git/GitHub.

---

## 1) Alcance funcional

### 1.1 Funcionalidades base (MVP)
1. **Autenticación**
   - Registro (email + password).
   - Login (email + password).
   - Logout.
   - Recuperación de contraseña (Supabase).
2. **Gestión de Suscripciones**
   - Crear, listar, editar y eliminar suscripciones.
   - Cada registro pertenece a **un usuario**.
3. **Dashboard**
   - KPIs: gasto mensual estimado, gasto anual estimado, número de suscripciones activas.
   - Gráficas (ej. por categoría, por proveedor, por ciclo de cobro).
   - Filtros para datos del dashboard y la lista: estado (activa/cancelada), categoría, proveedor, rango de monto, ciclo de cobro, búsqueda por texto.
4. **Perfil / Preferencias**
   - Moneda preferida (por defecto USD o CLP).
   - Zona horaria (opcional).
   - Formato de fecha.

### 1.2 Funcionalidades “Nice to Have” (post-MVP)
- Historial de pagos por suscripción (para análisis real vs estimado).
- Notificaciones: próxima renovación.
- Etiquetas (tags) y reportes exportables (CSV).
- Soporte multi-moneda con conversión (requiere API externa).

---

## 2) Arquitectura general

### 2.1 Estilo de arquitectura
- **Frontend + Backend en Next.js** (monorepo, una sola app).
- **Persistencia y Auth en Supabase**.
- **Seguridad principal**: Row Level Security (RLS) en Postgres para aislar datos por usuario.
- **API**: Route Handlers (REST) o Server Actions (para formularios).  
  Recomendación:  
  - CRUD de suscripciones con **Route Handlers** (`/api/...`) para separación clara.  
  - Login/registro con Supabase Auth (cliente/SSR).

### 2.2 Componentes principales
- **Next.js App Router**
  - Páginas: `/auth/login`, `/auth/register`, `/dashboard`, `/subscriptions`.
  - Layout protegido (dashboard).
- **Supabase**
  - `auth.users` para usuarios (gestionado por Supabase).
  - `public.profiles` para perfil (opcional).
  - `public.subscriptions` para suscripciones.
  - (Opcional) `public.subscription_payments` para historial.
- **UI**
  - Tailwind CSS.
  - Componentes reutilizables (inputs, modal, tabla, chips).
  - Gráficas con **Recharts**.

---

## 3) Modelo de datos (Supabase Postgres)

> Nota: Supabase ya mantiene `auth.users`. Aquí se crea `profiles` y las tablas de la app con RLS.

### 3.1 Decisiones de diseño de datos
**Tabla `subscriptions`** debe cubrir:
- Identificación (uuid).
- Propietario (user_id).
- Nombre de herramienta y proveedor.
- Categoría.
- Plan (texto).
- Ciclo de cobro (mensual/anual/semanal/único).
- Monto y moneda.
- Estado (activa/cancelada).
- Próxima fecha de cobro (opcional, útil para recordatorios).
- Fecha de inicio y cancelación.
- Notas y etiquetas (tags).

**Dashboard (estimaciones)**:
- Gasto mensual estimado = suma normalizada a mensual (mensual = monto, anual = monto/12, semanal = monto*4.345, único = 0 o prorrateo opcional).

---

## 4) SQL listo para ejecutar en Supabase

> Ejecutar en el “SQL editor” de Supabase (proyecto nuevo).  
> Incluye extensiones, enums, tablas, índices, triggers, RLS y políticas.

```sql
-- =========================
-- EXTENSIONES
-- =========================
create extension if not exists "pgcrypto";

-- =========================
-- ENUMS
-- =========================
do $$ begin
  create type public.billing_cycle as enum ('monthly','yearly','weekly','one_time');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_status as enum ('active','canceled','paused');
exception when duplicate_object then null;
end $$;

-- =========================
-- PROFILES (opcional pero recomendado)
-- =========================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  preferred_currency text not null default 'USD',
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_preferred_currency_idx
  on public.profiles(preferred_currency);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Crear profile automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================
-- SUBSCRIPTIONS
-- =========================
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

-- Índices: performance en queries por usuario y filtros comunes
create index if not exists subscriptions_user_id_idx
  on public.subscriptions(user_id);

create index if not exists subscriptions_user_status_idx
  on public.subscriptions(user_id, status);

create index if not exists subscriptions_user_billing_idx
  on public.subscriptions(user_id, billing);

create index if not exists subscriptions_user_vendor_idx
  on public.subscriptions(user_id, vendor);

create index if not exists subscriptions_user_category_idx
  on public.subscriptions(user_id, category);

create index if not exists subscriptions_next_billing_idx
  on public.subscriptions(user_id, next_billing_date);

-- Trigger updated_at
drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- =========================
-- (OPCIONAL) HISTORIAL DE PAGOS
-- =========================
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

create index if not exists subscription_payments_user_idx
  on public.subscription_payments(user_id, paid_at);

create index if not exists subscription_payments_sub_idx
  on public.subscription_payments(subscription_id, paid_at);

-- =========================
-- ROW LEVEL SECURITY (RLS)
-- =========================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;

-- PROFILES policies
drop policy if exists "Profiles: select own" on public.profiles;
create policy "Profiles: select own"
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists "Profiles: update own" on public.profiles;
create policy "Profiles: update own"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- SUBSCRIPTIONS policies
drop policy if exists "Subscriptions: select own" on public.subscriptions;
create policy "Subscriptions: select own"
on public.subscriptions for select
using (auth.uid() = user_id);

drop policy if exists "Subscriptions: insert own" on public.subscriptions;
create policy "Subscriptions: insert own"
on public.subscriptions for insert
with check (auth.uid() = user_id);

drop policy if exists "Subscriptions: update own" on public.subscriptions;
create policy "Subscriptions: update own"
on public.subscriptions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Subscriptions: delete own" on public.subscriptions;
create policy "Subscriptions: delete own"
on public.subscriptions for delete
using (auth.uid() = user_id);

-- PAYMENTS policies (si se usa)
drop policy if exists "Payments: select own" on public.subscription_payments;
create policy "Payments: select own"
on public.subscription_payments for select
using (auth.uid() = user_id);

drop policy if exists "Payments: insert own" on public.subscription_payments;
create policy "Payments: insert own"
on public.subscription_payments for insert
with check (auth.uid() = user_id);

drop policy if exists "Payments: delete own" on public.subscription_payments;
create policy "Payments: delete own"
on public.subscription_payments for delete
using (auth.uid() = user_id);
```

---

## 5) API y reglas de negocio

### 5.1 Contratos REST (Route Handlers)
- `GET /api/subscriptions`  
  Query params: `status`, `category`, `vendor`, `billing`, `q`, `min`, `max`, `from`, `to`.
- `POST /api/subscriptions`
- `GET /api/subscriptions/:id`
- `PUT /api/subscriptions/:id`
- `DELETE /api/subscriptions/:id`

### 5.2 Validaciones
- `tool_name` requerido.
- `amount` >= 0.
- `currency` ISO-4217 recomendado (validar contra lista simple).
- `next_billing_date` >= `start_date` (si ambos existen).
- En backend, **siempre** forzar `user_id = auth.uid()` (no confiar en input del cliente).

### 5.3 Cálculo “coste mensual estimado”
Normalización sugerida:
- `monthly`: `amount`
- `yearly`: `amount / 12`
- `weekly`: `amount * 4.345` (promedio de semanas por mes)
- `one_time`: `0` (o prorrateo opcional si se desea)

> En el dashboard, usar solo suscripciones `status = 'active'` por defecto.

---

## 6) Frontend (Next.js + Tailwind)

### 6.1 Rutas (App Router)
- `/` → landing simple (CTA a login/registro)
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password` (opcional)
- `/dashboard` (protegido)
- `/subscriptions` (protegido)
- `/subscriptions/new` (protegido)
- `/subscriptions/[id]/edit` (protegido)
- `/settings` (protegido)

### 6.2 Componentes UI
- `Button`, `Input`, `Select`, `Modal`, `Badge/Chip`, `Card`, `Table`, `EmptyState`, `Toast`.
- `SubscriptionForm` (crear/editar).
- `SubscriptionFilters` (filtros + búsqueda).
- `Charts`:
  - Donut / Pie por categoría.
  - Barra por proveedor.
  - Línea (si se agrega historial de pagos).

### 6.3 Estado y Data Fetching
- Recomendación: server-side fetch para pantallas principales y filtros (SSR) usando Supabase SSR.
- Para acciones (crear/editar/eliminar):  
  - Server Actions o `fetch` a `/api`.
- Cache:
  - Revalidación al mutar (revalidatePath) o invalidación simple del cliente.

---

## 7) Integración con Supabase en Next.js (SSR + cookies)

### 7.1 Librerías sugeridas
- `@supabase/supabase-js`
- `@supabase/ssr` (para server + middleware)
- `zod` (validaciones)
- `recharts` (gráficas)
- `date-fns` (fechas)

### 7.2 Variables de entorno
Crear `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- (Opcional server): `SUPABASE_SERVICE_ROLE_KEY=...` (NO usar en frontend)

---

## 8) Estructura de proyecto (carpetas y organización)

> Estructura orientada a App Router y escalabilidad.

```
/app
  /(public)
    /page.tsx
    /layout.tsx
  /auth
    /login/page.tsx
    /register/page.tsx
    /forgot-password/page.tsx
  /(protected)
    /layout.tsx              # Layout con Sidebar/Topbar + guard
    /dashboard/page.tsx
    /subscriptions/page.tsx
    /subscriptions/new/page.tsx
    /subscriptions/[id]/edit/page.tsx
    /settings/page.tsx
  /api
    /subscriptions/route.ts
    /subscriptions/[id]/route.ts

/components
  /ui
    Button.tsx
    Input.tsx
    Select.tsx
    Modal.tsx
    Card.tsx
    Table.tsx
    Toast.tsx
  /subscriptions
    SubscriptionForm.tsx
    SubscriptionFilters.tsx
    SubscriptionTable.tsx
  /dashboard
    KPIGrid.tsx
    CategoryChart.tsx
    VendorChart.tsx
    BillingBreakdown.tsx

/lib
  /supabase
    client.ts              # Supabase client para browser
    server.ts              # Supabase client para server (cookies)
    middleware.ts          # helpers (si aplica)
  /db
    subscriptions.ts       # queries (server)
  /utils
    money.ts               # formateo moneda
    normalize.ts           # cálculo mensual
    constants.ts           # categorías sugeridas, ciclos, etc

/styles
  globals.css

/middleware.ts              # protección rutas (si se usa)
/types
  subscriptions.ts

/tests
  e2e/
  unit/

Dockerfile
docker-compose.yml
README.md
```

---

## 9) Seguridad y control de acceso

### 9.1 Principios
- Nunca exponer `service_role_key` al cliente.
- RLS activado y políticas correctas (ya incluidas en SQL).
- Middleware/guard en Next.js para bloquear rutas protegidas si no hay sesión.
- Sanitizar inputs (Zod) en API.

### 9.2 Protección de rutas
- Layout `(protected)/layout.tsx` verifica sesión en server (SSR) y redirige a `/auth/login` si no hay sesión.
- Alternativa complementaria: `middleware.ts` para fast redirect.

---

## 10) Plan de desarrollo (roadmap por fases)

### Fase 0 — Preparación (0.1)
- Crear repositorio en GitHub.
- Inicializar Next.js con Tailwind.
- Configurar ESLint + Prettier + Husky (opcional).

### Fase 1 — Supabase (0.2)
- Crear proyecto Supabase.
- Ejecutar SQL de esquema.
- Configurar Auth (email/password).
- Definir variables `.env.local`.

### Fase 2 — Autenticación (0.3)
- Implementar páginas login/registro.
- Manejo de sesión SSR.
- Layout protegido.

### Fase 3 — CRUD Suscripciones (0.4)
- UI lista (tabla + filtros).
- Crear/Editar (formulario).
- Eliminar (confirmación modal).
- API `/api/subscriptions` con validación Zod.

### Fase 4 — Dashboard (0.5)
- KPIs (mensual/anual/contador).
- Gráficas base con Recharts.
- Filtros aplicados también al dashboard.

### Fase 5 — Ajustes (0.6)
- UX: loading states, empty states, toasts.
- Accesibilidad mínima.
- Optimización de queries e índices (ya incluidos).

### Fase 6 — Deploy VPS con Dokploy (1.0)
- Dockerfile + docker-compose.
- Variables de entorno en Dokploy.
- Deploy desde GitHub.
- Dominio + HTTPS (Dokploy/Reverse proxy).

---

## 11) Deploy en VPS (Dokploy)

### 11.1 Objetivo
Empaquetar la app como contenedor Docker listo para Dokploy (con build reproducible).

### 11.2 Dockerfile (recomendado)
```dockerfile
# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  else npm i; fi

# ---- build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar artefactos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "run", "start"]
```

### 11.3 docker-compose.yml (para Dokploy)
```yaml
services:
  app:
    build: .
    container_name: digital-cost-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
```

> Supabase es externo, por lo tanto no se levanta Postgres local en el VPS.

---

## 12) Git y GitHub (control de versiones)

### 12.1 Flujo recomendado
- `main` protegido (deploy).
- `dev` para integración.
- `feature/*` para cambios.

### 12.2 Convenciones
- Commits: `feat:`, `fix:`, `chore:`, `refactor:`
- PR con checklist: tests, lint, screenshot del dashboard.

### 12.3 GitHub Actions (CI básico)
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [ "main", "dev" ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

---

## 13) Criterios de aceptación (MVP)

1. Un usuario puede registrarse, iniciar sesión y cerrar sesión.
2. Un usuario solo ve y gestiona **sus** suscripciones (validado por RLS).
3. CRUD completo de suscripciones funcional.
4. Dashboard muestra KPIs correctos y al menos 2 gráficas con datos del usuario.
5. Filtros afectan lista y dashboard.
6. Deploy en VPS (Dokploy) accesible por dominio con HTTPS.

---

## 14) Checklist operativo para el IDE (orden sugerido de ejecución)

1. **Inicializar proyecto**
   - `npx create-next-app@latest digital-cost-app --ts --eslint --app`
   - Instalar Tailwind (si no viene) y dependencias: `@supabase/supabase-js @supabase/ssr zod recharts date-fns`
2. **Configurar Supabase**
   - Crear proyecto, ejecutar SQL (sección 4).
   - Configurar `.env.local` con URL/ANON.
3. **Integrar Auth**
   - Supabase client SSR + cookies.
   - Páginas `/auth/login` y `/auth/register`.
   - Layout protegido y redirecciones.
4. **API de suscripciones**
   - Route handlers con validación Zod.
5. **Pantallas**
   - Suscripciones (tabla, filtros, acciones).
   - Dashboard (KPIs y gráficas).
6. **Deploy**
   - Dockerfile + compose.
   - Configurar Dokploy con variables y despliegue desde GitHub.

---

## 15) Notas finales de implementación
- Priorizar simplicidad: MVP con “estimación mensual” desde `subscriptions` sin necesidad de pagos.
- Si más adelante se requiere precisión histórica, activar `subscription_payments` y añadir una gráfica temporal.
- Mantener RLS como control principal; frontend nunca debe “filtrar” como seguridad.

