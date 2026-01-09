# Employee Management System

Aplicacion interna para gestion de empleados, sueldos y documentos con Next.js 14 + Supabase.

## Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion, Lucide React, Recharts
- React Hook Form + Zod
- Next Themes
- Supabase (DB, Auth, Storage)

## Setup rapido

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
3. Configurar Supabase:
   - Crear proyecto en Supabase.
   - Ejecutar el schema en `sql/schema.sql` en el SQL editor.
   - Activar Auth email/password.

4. Crear buckets de Storage:
   - `employee-documents` (privado)
   - `profile-images` (publico)
   - `salary-receipts` (privado)

5. Ejecutar el proyecto:
   ```bash
   npm run dev
   ```

## Storage policies sugeridas

- `profile-images` puede ser publico.
- `employee-documents` y `salary-receipts` deben ser privados, con acceso solo para usuarios autenticados.

## Estructura del proyecto

```
app/
  (auth)/login
  (app)/dashboard
  (app)/employees
  (app)/employees/[id]
  (app)/employees/new
  (app)/salaries
  (app)/salaries/receipts
  api/
lib/
  supabase/
  schemas/
  types/
  db/
  storage/
components/
  ui/
  charts/
  employees/
  salaries/
```

## Notas

- Las rutas estan protegidas por `middleware.ts`.
- Los CRUD utilizan route handlers en `app/api`.
- Los hooks `useEmployees`, `useSalaries`, `useSalaryReceipts` consumen esas rutas.
- La integracion de storage se gestiona en `lib/storage/upload.ts`.
- Los tipos de Supabase estan definidos en `lib/types/supabase.ts`.

## Data freshness pattern

- Lecturas: usar `useApiQuery` (SWR) desde `lib/data/cache.ts` con keys `tag:url` y `fallbackData` cuando hay props iniciales.
- Mutaciones: usar `apiMutation` y revalidar con `invalidateTag` del dominio afectado (ej: `employees`, `attendance`, `salary-receipts`).
- No se usan recargas de pagina ni `no-store` global; la UI se actualiza via invalidacion de tags.

## Variables de entorno

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (si necesitas operaciones admin)
- No subas credenciales al repo: usá `.env.local` (ignorado por git) y/o Environment Variables de Vercel.

## Desarrollo

- `npm run dev` inicia el entorno local.
- `npm run build` compila para produccion.
- `npm run start` ejecuta el build.
