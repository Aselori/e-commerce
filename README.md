# E-Commerce — Sistema de Gestión de Pedidos

Sistema de gestión de pedidos para una pequeña empresa mexicana de electrónica. Incluye catálogo de productos para clientes y panel de administración.

## Stack

- **Framework**: Next.js 15 App Router + TypeScript
- **Estilos**: Tailwind CSS v4 + shadcn/ui
- **Base de datos**: Supabase (PostgreSQL)
- **Despliegue**: Vercel
- **Package manager**: pnpm

## Estructura de rutas

```
src/app/
├── (store)/          # Tienda — páginas para clientes
│   ├── page.tsx      # Catálogo de productos
│   └── products/[id] # Detalle de producto
└── (admin)/          # Panel de administración
    └── products/     # CRUD de productos
```

## Tablas de base de datos

- `products` — productos del catálogo
- `categories` — categorías de productos
- `orders` — pedidos de clientes
- `order_items` — líneas de cada pedido
- `payment_receipts` — comprobantes de pago

## Desarrollo local

### Prerrequisitos

- Node.js 20+
- pnpm
- Cuenta en Supabase

### Configuración

1. Clona el repositorio e instala dependencias:

```bash
pnpm install
```

2. Crea un archivo `.env.local` con las credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

3. Aplica la migración inicial en tu proyecto de Supabase:

```bash
# En el dashboard de Supabase → SQL Editor, ejecuta:
supabase/migrations/001_initial_schema.sql
# Opcional: datos de prueba
supabase/seed.sql
```

4. Inicia el servidor de desarrollo:

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la tienda.
El panel de administración está en [http://localhost:3000/products](http://localhost:3000/products).
