# Coste de Vida Digital (MVP)

Aplicación para gestionar y visualizar gastos en suscripciones de software e IA.

## Stack
- **Next.js 15 (App Router)**
- **Tailwind CSS**
- **Supabase (Auth & Database)**
- **Recharts**
- **Zod & React Hook Form**

## Requisitos Previos
- Node.js 20+
- Cuenta en Supabase

## Configuración Local

1.  **Clonar y e instalar:**
    ```bash
    npm install
    ```

2.  **Variables de Entorno:**
    Crea un archivo `.env.local` con las siguientes variables:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
    ```

3.  **Base de Datos:**
    Ejecuta el SQL proporcionado en el archivo `plan_arquitectura_coste_vida_digital.md` dentro del editor SQL de Supabase para crear las tablas y políticas de RLS.

4.  **Ejecutar:**
    ```bash
    npm run dev
    ```

## Despliegue con Dokploy (VPS)

La aplicación está preparada para ser desplegada con Docker:

1.  Configura un nuevo servicio en Dokploy.
2.  Añade las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3.  Despliega usando el `Dockerfile` y `docker-compose.yml` incluidos.

## Estructura de Datos
- **profiles**: Almacena preferencias de usuario (moneda, nombre).
- **subscriptions**: Almacena los detalles de cada suscripción.
- **subscription_payments**: (Opcional) historial de pagos realizados.

## RLS (Seguridad)
La aplicación utiliza Row Level Security de Supabase. Cada usuario solo puede ver y editar sus propios datos.
