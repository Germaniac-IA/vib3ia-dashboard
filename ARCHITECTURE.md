# VIB3.ia — Dashboard Arquitectura y Documentación

## Overview

Dashboard de gestión multi-cliente para agencias de agentes IA. Cada cliente (business) tiene su propio set de datos aislado.

**Stack:**
- Frontend: Next.js 16 (App Router), TypeScript, Tailwind-free (inline styles)
- Backend: Express.js, Node.js
- DB: PostgreSQL
- Hosting: VPS Dattaboard (149.50.148.131)

**Puertos:**
- Backend: 4000
- Frontend dev: 3000
- Frontend prod: 4001

---

## Base de Datos — Schema Completo

### clients
```
clients
├── id (PK, serial)
├── name (varchar 255) -- nombre del negocio
├── subdomain (varchar 100, unique)
├── logo_url (text)
├── slogan (text)
├── address (varchar 255)
├── phone (varchar 50)
├── whatsapp (varchar 50) -- separado de telefono
├── email (varchar 255)
├── city (varchar 100)
├── instagram_url (varchar 255)
├── facebook_url (varchar 255)
├── tiktok_url (varchar 255)
├── web_url (varchar 255)
├── business_hours (jsonb) -- objeto con dias como keys, arrays de franjas como values
│   Ejemplo: {"monday": ["09:00-13:00","16:00-20:00"], "tuesday": ["09:00-18:00"], "sunday": []}
├── default_currency (varchar 10) DEFAULT 'ARS'
├── timezone (varchar 50) DEFAULT 'America/Argentina/Buenos_Aires'
├── created_at (timestamp)
└── updated_at (timestamp)
```

### users
```
users
├── id (PK, serial)
├── client_id (FK → clients.id)
├── username (varchar 100, unique)
├── password_hash (varchar 255)
├── name (varchar 255)
├── email (varchar 255)
├── phone (varchar 50)
├── telegram_id (varchar 100) -- ID numerico de Telegram
├── rol (varchar 20) DEFAULT 'operator' CHECK IN ('admin','manager','operator')
├── is_active (boolean) DEFAULT TRUE
├── created_at (timestamp)
└── updated_at (timestamp)
```

### fiscal_data
```
fiscal_data
├── id (PK, serial)
├── client_id (FK → clients.id, UNIQUE constraint)
├── razon_social (varchar 255)
├── cuit (varchar 20)
├── condicion_iva (varchar 50) -- "Responsable Inscripto", "Monotributista", etc.
├── situacion_iibb (varchar 50) -- "Activo", "Exento", etc.
├── numero_iibb (varchar 50)
└── PRIMARY KEY constraint on client_id
```

### agents
```
agents
├── id (PK, serial)
├── client_id (FK → clients.id)
├── name (varchar 100)
├── description (text)
├── platform (varchar 50) CHECK IN ('whatsapp','telegram','instagram','web') DEFAULT 'web'
├── is_active (boolean) DEFAULT TRUE
├── working_hours (varchar 100) DEFAULT '09:00-18:00'
├── tone (varchar 20) CHECK IN ('formal','casual','picarro') DEFAULT 'casual'
├── industry_context (text) -- contexto del negocio para el agente
├── autonomy_level (varchar 20) CHECK IN ('full','partial','supervised') DEFAULT 'partial'
├── instructions_permanent (text) -- instrucciones fijas del agente
├── instructions_transient (text) -- instrucciones temporales
├── created_at (timestamp)
└── updated_at (timestamp)
```

### payment_methods
```
payment_methods
├── id (PK, serial)
├── client_id (FK → clients.id)
├── name (varchar 100) -- "Efectivo", "Tarjeta", "Transferencia"
├── is_personal (boolean) DEFAULT false -- si es cuenta personal del dueno
├── is_cash (boolean) DEFAULT true -- si es efectivo
├── cbu_cvu (varchar 50) -- solo si is_cash=false
├── alias (varchar 50) -- alias de CBU/CVU
├── banco (varchar 100) -- nombre del banco
├── is_active (boolean) DEFAULT TRUE
├── sort_order (integer) DEFAULT 0
├── created_at (timestamp)
└── updated_at (timestamp)
```

### product_categories
```
product_categories
├── id (PK, serial)
├── client_id (FK → clients.id)
├── name (varchar 100)
├── description (text)
├── is_active (boolean) DEFAULT TRUE
├── sort_order (integer) DEFAULT 0
├── auto_generate_sku (boolean) DEFAULT true -- si genera SKU automaticamente
├── sku_counter (integer) DEFAULT 0 -- contador para el proximo SKU
├── created_at (timestamp)
└── updated_at (timestamp)
```

### product_brands
```
product_brands
├── id (PK, serial)
├── client_id (FK → clients.id)
├── name (varchar 100)
├── is_imported (boolean) DEFAULT false
├── premium_level (integer) CHECK 1-10 DEFAULT 5
├── is_active (boolean) DEFAULT TRUE
├── created_at (timestamp)
└── updated_at (timestamp)
```

### input_items (insumos)
```
input_items
├── id (PK, serial)
├── client_id (FK → clients.id)
├── name (varchar 255) -- "Tela algodon metro", "Hilo", "Embalaje"
├── unit (varchar 50) DEFAULT 'unidad' -- "metro", "rollo", "unidad", "hora"
├── default_cost (decimal 12,2) DEFAULT 0
├── is_active (boolean) DEFAULT TRUE
└── created_at (timestamp)
```

### products
```
products
├── id (PK, serial)
├── client_id (FK → clients.id)
├── sku (varchar 100) -- codigo interno (puede ser autogenerado por categoria)
├── sku_externo (varchar 100) -- codigo del proveedor
├── name (varchar 255)
├── description (text)
├── category_id (FK → product_categories.id)
├── brand_id (FK → product_brands.id)
├── price (decimal 12,2) -- precio de venta
├── cost_price (decimal 12,2) DEFAULT 0 -- costo manual (si no usa insumos)
├── unit (varchar 50) DEFAULT 'unidad'
├── stock_quantity (integer) DEFAULT 0 -- stock actual
├── min_stock (integer) DEFAULT 0 -- stock minimo para alertas
├── requires_stock (boolean) DEFAULT false -- si controla stock
├── is_premium (boolean) DEFAULT false -- si es producto premium
├── premium_level (integer) CHECK 1-10 -- nivel premium
├── is_active (boolean) DEFAULT TRUE
├── created_at (timestamp)
└── updated_at (timestamp)
```

### product_input_components (insumos de cada producto)
```
product_input_components
├── id (PK, serial)
├── product_id (FK → products.id)
├── input_item_id (FK → input_items.id)
├── quantity (decimal 12,4) DEFAULT 1 -- cantidad de insumo
└── UNIQUE(product_id, input_item_id) -- un insumo solo aparece una vez por producto
```

**Costo calculado del producto:**
```
costo_total = SUM(quantity × default_cost) de todos los componentes
```

### contacts
```
contacts
├── id (PK, serial)
├── client_id (FK → clients.id)
├── name (varchar 255)
├── email (varchar 255)
├── phone (varchar 50)
├── address (text)
├── notes (text)
├── tags (varchar 255) -- separados por coma
├── source (varchar 50) -- "whatsapp","instagram","web","referido"
├── is_active (boolean) DEFAULT TRUE
├── created_at (timestamp)
└── updated_at (timestamp)
```

### orders
```
orders
├── id (PK, serial)
├── client_id (FK → clients.id)
├── order_number (varchar 50) -- ej: "PED-00001"
├── contact_id (FK → contacts.id)
├── status (varchar 50) CHECK IN ('pending','confirmed','preparing','delivered','cancelled')
├── total (decimal 12,2)
├── payment_method_id (FK → payment_methods.id)
├── notes (text)
├── delivered_at (timestamp)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### order_items
```
order_items
├── id (PK, serial)
├── order_id (FK → orders.id)
├── product_id (FK → products.id)
├── quantity (integer)
├── unit_price (decimal 12,2)
└── created_at (timestamp)
```

### leads
```
leads
├── id (PK, serial)
├── client_id (FK → clients.id)
├── contact_id (FK → contacts.id)
├── source (varchar 100) -- "instagram","whatsapp","web","referido","llamada"
├── status (varchar 50) CHECK IN ('new','contacted','qualified','converted','lost')
├── notes (text)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### deliveries
```
deliveries
├── id (PK, serial)
├── client_id (FK → clients.id)
├── order_id (FK → orders.id)
├── contact_id (FK → contacts.id)
├── address (text)
├── scheduled_date (date)
├── delivered_at (timestamp)
├── status (varchar 50) CHECK IN ('scheduled','in_transit','delivered','failed')
├── notes (text)
├── created_at (timestamp)
└── updated_at (timestamp)
```

---

## API Endpoints

Base URL: `http://149.50.148.131:4000/api`

### Auth
```
POST /auth/login        -- {username, password} → {token, user}
GET  /auth/me          -- Bearer token → user actual
```

### Clients
```
GET    /clients         -- lista todos (admin)
GET    /clients/:id     -- detalle
PUT    /clients/:id     -- actualiza datos comerciales, horarios, redes
```

### Fiscal Data
```
GET    /fiscal-data/:clientId    -- datos fiscales del cliente
PUT    /fiscal-data/:clientId    -- upsert datos fiscales
```

### Users
```
GET    /users           -- lista usuarios del cliente actual
POST   /users           -- crear usuario {username, password, name, email, phone, telegram_id, rol}
PUT    /users/:id       -- editar usuario
DELETE /users/:id       -- eliminar
```

### Payment Methods
```
GET    /payment-methods       -- lista
POST   /payment-methods        -- crear {name, is_personal, is_cash, cbu_cvu, alias, banco}
PUT    /payment-methods/:id    -- editar
DELETE /payment-methods/:id     -- eliminar
```

### Product Categories
```
GET    /product-categories      -- lista
POST   /product-categories      -- crear {name, auto_generate_sku}
PUT    /product-categories/:id -- editar
DELETE /product-categories/:id  -- eliminar
```

### Product Brands
```
GET    /product-brands      -- lista
POST   /product-brands      -- crear {name, is_imported, premium_level}
PUT    /product-brands/:id  -- editar
DELETE /product-brands/:id  -- eliminar
```

### Input Items (Insumos)
```
GET    /input-items       -- lista
POST   /input-items       -- crear {name, unit, default_cost}
PUT    /input-items/:id   -- editar
DELETE /input-items/:id   -- eliminar
```

### Products
```
GET    /products                          -- lista con computed_cost (suma de insumos)
POST   /products                          -- crear (con auto-generate SKU si la categoria lo pide)
PUT    /products/:id                      -- editar
DELETE /products/:id                      -- eliminar
GET    /products/:id/components          -- componentes de insumo del producto
POST   /products/:id/components           -- agregar insumo {input_item_id, quantity}
DELETE /products/:productId/components/:componentId -- quitar insumo
```

**Auto-generate SKU logic:**
- Si la categoria tiene `auto_generate_sku=true` y no se pasa SKU en el POST
- Se genera: primeras 3 letras de la categoria (solo letras, uppercase) + '-' + counter padded 3 digitos
- Ejemplo: categoria "Ceramicas" + counter 1 → `CER-001`
- Se incrementa el `sku_counter` de la categoria

### Dashboard Summary
```
GET /dashboard/summary  -- {totalProducts, totalContacts, totalOrders, ordersToday, ordersMonth, revenueMonth, revenueToday, newClients, newLeads, pendingLeads}
```

---

## Decisiones de Diseño

### Multi-tenant
- Cada tabla tiene `client_id` que FK a clients
- El middleware `authenticate` filtra por `req.user.client_id`
- No existe todavia la feature de multi-negocio real (multi-tenant planificado para despues)

### Costo de productos — dos modos
1. **Costo manual**: `cost_price` directo
2. **Costo por insumos**: `product_input_components` + `input_items.default_cost`
   - `computed_cost = SUM(quantity × default_cost)` calculado en el GET
   - El agente puede usar esta logica para explicar costos a clientes

### SKU auto-generado
- A nivel categoria: `auto_generate_sku` + `sku_counter`
- El SKU se genera en el backend al momento de crear el producto
- Formato: `XXX-NNN` donde XXX = 3 letras de la categoria, NNN = counter

### Business Hours
- JSONB con dias como keys, arrays de strings como values
- Un dia puede tener multiple franjas horarias
- Ejemplo: `{"monday": ["09:00-13:00","16:00-20:00"], "sunday": []}`

### Payment Methods
- `is_cash` diferencia efectivo de transferencias
- `is_personal` indica si la cuenta es personal del dueno (no del negocio)
- Si `is_cash=false`, los campos `cbu_cvu`, `alias`, `banco` son relevantes

### Premium Level
- A nivel marca: `premium_level` 1-10
- A nivel producto: `is_premium` + `premium_level` 1-10
- Esto permite al agente justificar precios en conversaciones

---

## Pendientes / Pr�ximo Paso

- [ ] Productos: faltan campos en el form (description, editar/eliminar completo)
- [ ] Contactos: build CRUD completo
- [ ] Pedidos: build CRUD completo con order_items
- [ ] Leads: build completo
- [ ] Entregas: build completo
- [ ] Agentes: parametrizacion de instrucciones (industry_context, instructions_permanent/transient)
- [ ] Responsive desktop (sidebar expandida)
- [ ] Logo upload (actualmente solo URL)
- [ ] Dashboard summary stats reales en Mi Negocio
- [ ] Multi-tenant real (varios negocios en una misma instancia)
- [ ] Deploy con nginx + SSL en VPS

---

## Git

**Repos:**
- Backend: `https://github.com/Germaniac-IA/vib3ia-backend.git`
- Frontend: `https://github.com/Germaniac-IA/vib3ia-dashboard.git`

**Rama principal:** `main`

**Commits relevantes (2026-04-14):**
- `8dca4b8` -- fiscal_data, whatsapp, telegram_id, multiple business hours (backend)
- `36e7b06` -- Add form field reordering and auto-generate SKU checkbox for categories
- `9c3644a` -- Add categoriesFull state and SKU preview hint in productos form

---

## Variables de Entorno VPS

**Backend (.env en /root/vib3ia-backend/):**
```
DATABASE_URL=postgres://user:pass@localhost:5432/vib3ia_alpha
JWT_SECRET=vib3ia-secret-key-change-in-production
PORT=4000
```

**Frontend (.env.local local):**
```
NEXT_PUBLIC_API_URL=http://149.50.148.131:4000
```

---

## PM2 Services (VPS)

| Service | Puerto | Status |
|---------|--------|--------|
| vib3ia-backend | 4000 | online |
| vib3ia-dashboard | 4001 | online |
| cristal-backend | 3001 | online |
| cristal-dash | 3002 | online |

**Logs:**
```
~/.pm2/logs/
```

**Reiniciar:**
```
pm2 restart vib3ia-backend
pm2 restart vib3ia-dashboard
```

---

## SQL Scripts Utiles

Scripts en `C:\Users\general\vib3-local\`:

- `schema-vib3ia.sql` -- schema base completo
- `seed-vib3ia.sql` -- datos iniciales
- `add-whatsapp.sql` -- agregar whatsapp a clients
- `add-fiscal-constraint.sql` -- constraint unique en fiscal_data
- `add-telegram-id.sql` -- agregar telegram_id a users
- `add-brand-columns.sql` -- is_imported + premium_level en brands
- `add-product-columns.sql` -- sku_externo, is_premium, requires_stock, cost_price en products
- `add-payment-columns.sql` -- is_personal, is_cash, cbu_cvu, alias, banco en payment_methods
- `add-cat-sku.sql` -- auto_generate_sku + sku_counter en product_categories
- `create-input-tables.sql` -- input_items + product_input_components
- `grant-fiscal.sql` -- permisos fiscal_data
- `grant-inputs.sql` -- permisos input_items + product_input_components
- `fix-hours2.sql` -- business_hours como array de franjas

---

Ultima actualizacion: 2026-04-14 17:55 GMT-3
