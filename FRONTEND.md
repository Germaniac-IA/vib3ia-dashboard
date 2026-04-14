# VIB3.ia — Frontend Docs

## Estructura de Carpetas

```
src/app/
├── layout.tsx              -- Root layout con global CSS
├── page.tsx                -- Login page
├── lib.ts                  -- API client (fetchJson, postJson, putJson, deleteJson)
├── types.ts               -- Tipos globales
├── (app)/                 -- Grupo de rutas autenticadas
│   ├── layout.tsx         -- Layout con sidebar + app shell
│   ├── negocio/
│   │   └── page.tsx       -- Mi Negocio: datos comerciales, fiscales, equipo
│   ├── parametros/
│   │   └── page.tsx       -- Params: payment methods, categories, brands, inputs
│   ├── productos/
│   │   └── page.tsx       -- Catalogo de productos con insumos
│   ├── agentes/
│   │   └── page.tsx       -- Agentes IA
│   ├── contactos/
│   │   └── page.tsx       -- Contactos
│   ├── pedidos/
│   │   └── page.tsx       -- Pedidos
│   ├── leads/
│   │   └── page.tsx       -- Leads
│   └── entregas/
│       └── page.tsx       -- Entregas
└── components/shared/
    ├── Sidebar.tsx         -- Sidebar responsive (hamburger mobile)
    ├── AppShell.tsx        -- Shell con top bar + logout
    └── UI.tsx             -- Componentes reutilizables: Card, CardHeader, IconButton, Input, Select, PageTitle, Loading, Empty, Badge, Button
```

---

## Componentes UI

### Card
```tsx
<Card style={{ marginBottom: "20px" }}>
  <Card> (base)
```

### CardHeader
```tsx
<CardHeader
  title="Titulo"
  action={<IconButton>+</IconButton>}
/>
```

### IconButton
```tsx
<IconButton variant="primary|secondary|danger|ghost" onClick={fn}>
  +  ✏️  🗑️  ✓  ✕
</IconButton>
```

### Input
```tsx
<Input
  label="Nombre"
  value={form.name}
  onChange={(v) => setForm({...})}
  placeholder="..."
  type="number|password"  // optional
  disabled                // optional
/>
```

### Select
```tsx
<Select
  label="Categoria"
  value={form.category_id}
  onChange={(v) => setForm({...})}
  options={[
    {value: "1", label: "Opcion 1"},
    {value: "", label: "Sin categoria"},
  ]}
/>
```

### Button
```tsx
<Button variant="secondary" onClick={fn}>
  Texto
</Button>
```

### PageTitle
```tsx
<PageTitle>📦 Productos</PageTitle>
```

### Loading
```tsx
<Loading />
```

---

## API Client (lib.ts)

```ts
const API = "http://149.50.148.131:4000/api";

// GET
const data = await fetchJson<T>("/endpoint");

// POST
const created = await postJson<T>("/endpoint", { field: value });

// PUT
const updated = await putJson<T>("/endpoint/id", { field: value });

// DELETE
await deleteJson("/endpoint/id");
```

Auth: Bearer token guardado en `localStorage.getItem('token')`.

---

## Auth Flow

1. Login page (`/`) pide username + password
2. POST `/auth/login` devuelve `{ token, user }`
3. Token guardado en `localStorage.setItem('token', token)`
4. `(app)/layout.tsx` checkea `localStorage.getItem('token')` — si no hay, redirige a `/`
5. Todos los requests incluyen `Authorization: Bearer <token>`

---

## Estilos

- **Sin Tailwind** — todos los estilos inline con objetos JS
- **Paleta:**
  - Primary: `#6c63ff` (violeta)
  - Success: `#27ae60` (verde)
  - Danger: `#e74c3c` (rojo)
  - Warning: `#f39c12` (amarillo)
  - Background: `#f8f8f8` / blanco
  - Text: `#333` (principal), `#888` (secundario), `#aaa` (terciario)
- **Border radius:** Cards `16px`, inputs `8px`, badges `20px`
- **Responsive:** Mobile-first con media queries en CSS

---

## Form Patterns

### Modal Form Pattern
```tsx
const [showForm, setShowForm] = useState(false);
const [editing, setEditing] = useState<Item | null>(null);
const [form, setForm] = useState({ name: "", ... });
const [saving, setSaving] = useState(false);

function openNew() { setEditing(null); setForm({...}); setShowForm(true); }
function openEdit(item) { setEditing(item); setForm({...item}); setShowForm(true); }

async function handleSave() {
  setSaving(true);
  try {
    if (editing) await putJson(`/endpoint/${editing.id}`, form);
    else await postJson("/endpoint", form);
    setShowForm(false);
    load();
  } finally { setSaving(false); }
}

{showForm && (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,...}}
       onClick={(e) => { if(e.target===e.currentTarget) setShowForm(false); }}>
    <div style={{background:"#fff",borderRadius:"16px",padding:"24px",...}}>
      {/* form fields */}
      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  </div>
)}
```

---

## Sidebar

- Mobile: colapsado por default, hamburger abre/cierra
- Secciones: MIS DATOS (Mi Negocio, Mi Equipo) y GESTION (Parametros, Productos, Agentes, Contactos, Pedidos, Leads, Entregas)
- Logout: top-right del sidebar (mobile) o dentro del menu (desktop)

---

## Login Page

- Logo VIB3.ia (🦊) + nombre
- Gradient background
- Username + password inputs
- Boton "Iniciar Sesion"
- Mensaje de error inline
