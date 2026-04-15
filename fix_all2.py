with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# 1. Add sharp, fs, randomUUID requires
old_requires = "const bodyParser = require('body-parser');"
new_requires = "const bodyParser = require('body-parser');\nconst sharp = require('sharp');\nconst { randomUUID } = require('crypto');\nconst fs = require('fs');"
if old_requires in content:
    content = content.replace(old_requires, new_requires)
    print('Fix 1: Added requires')

# 2. products POST destructuring
content = content.replace(
    "const { sku, sku_externo, name, description, category_id, brand_id, price, unit, stock_quantity, min_stock, requires_stock, is_premium, premium_level, cost_price } = req.body;",
    "const { sku, sku_externo, name, description, category_id, brand_id, price, unit, stock_quantity, min_stock, requires_stock, is_premium, premium_level, cost_price, commercial_description, image_url } = req.body;"
)
print('Fix 2a: POST products destructuring')

# products INSERT columns
content = content.replace(
    "INSERT INTO products (client_id, sku, sku_externo, name, description, category_id, brand_id, price, unit, stock_quantity, min_stock, requires_stock, is_premium, premium_level, cost_price)",
    "INSERT INTO products (client_id, sku, sku_externo, name, description, category_id, brand_id, price, unit, stock_quantity, min_stock, requires_stock, is_premium, premium_level, cost_price, commercial_description, image_url)"
)
print('Fix 2b: INSERT columns')

# products VALUES count
content = content.replace(
    "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING",
    "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING"
)
print('Fix 2c: VALUES count')

# products POST params - find the closing bracket of params array and add
content = content.replace(
    "cost_price || 0]\n    );\n    res.status(201)",
    "cost_price || 0,\n       commercial_description || null,\n       image_url || null]\n    );\n    res.status(201)"
)
print('Fix 2d: POST params')

# 3. products PUT
content = content.replace(
    "const { sku, sku_externo, name, description, category_id, brand_id, price, unit, stock_quantity, min_stock, requires_stock, is_premium, premium_level, cost_price, is_active } = req.body;",
    "const { sku, sku_externo, name, description, category_id, brand_id, price, unit, stock_quantity, min_stock, requires_stock, is_premium, premium_level, cost_price, is_active, commercial_description, image_url } = req.body;"
)
print('Fix 3a: PUT products destructuring')

# products PUT SET clause
content = content.replace(
    "cost_price=COALESCE($14,cost_price), is_active=COALESCE($15,is_active), updated_at=NOW()\n       WHERE id=$16 AND client_id=$17",
    "cost_price=COALESCE($14,cost_price), is_active=COALESCE($15,is_active), commercial_description=NULLIF($16,''), image_url=NULLIF($17,''), updated_at=NOW()\n       WHERE id=$18 AND client_id=$19"
)
print('Fix 3b: PUT SET')

# products PUT params
content = content.replace(
    "requires_stock, is_premium, premium_level, cost_price, is_active, req.params.id, req.user.client_id]",
    "requires_stock, is_premium, premium_level, cost_price, is_active, commercial_description, image_url, req.params.id, req.user.client_id]"
)
print('Fix 3c: PUT params')

# 4. contacts POST
old_cpost = (
    "const { name, phone, email, address, location, notes } = req.body;\n"
    "    const result = await pool.query(\n"
    "      'INSERT INTO contacts (client_id, name, phone, email, address, location, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',\n"
    "      [req.user.client_id, name, phone, email, address, location, notes]\n"
    "    );"
)
new_cpost = (
    "const { name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion } = req.body;\n"
    "    const result = await pool.query(\n"
    "      'INSERT INTO contacts (client_id, name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',\n"
    "      [req.user.client_id, name, phone, email, address, location, notes,\n"
    "       whatsapp || null, instagram || null, tiktok || null,\n"
    "       whatsapp || null, instagram || null, tiktok || null, condicion_iva || null, cuit || null, condicion_iibb || null,\n"
    "       Number(calificacion) || 5]\n"
    "    );"
)
if old_cpost in content:
    content = content.replace(old_cpost, new_cpost)
    print('Fix 4: contacts POST')
else:
    print('Fix 4: contacts POST partial match - checking...')
    if 'INSERT INTO contacts (client_id, name, phone' in content:
        print('  INSERT contacts already has more fields')

# 5. contacts PUT
old_cput = (
    "const { name, phone, email, address, location, notes } = req.body;\n"
    "    const result = await pool.query(\n"
    "      'UPDATE contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone), email=COALESCE($3,email), address=COALESCE($4,address), location=COALESCE($5,location), notes=COALESCE($6,notes), updated_at=NOW() WHERE id=$7 AND client_id=$8 RETURNING *',\n"
    "      [name, phone, email, address, location, notes, req.params.id, req.user.client_id]\n"
    "    );"
)
new_cput = (
    "const { name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion } = req.body;\n"
    "    const result = await pool.query(\n"
    "      'UPDATE contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone), email=COALESCE($3,email), address=COALESCE($4,address), location=COALESCE($5,location), notes=COALESCE($6,notes), updated_at=NOW(), whatsapp=COALESCE($7,whatsapp), instagram=COALESCE($8,instagram), tiktok=COALESCE($9,tiktok), condicion_iva=COALESCE($10,condicion_iva), cuit=COALESCE($11,cuit), condicion_iibb=COALESCE($12,condicion_iibb), calificacion=COALESCE($13,calificacion) WHERE id=$14 AND client_id=$15 RETURNING *',\n"
    "      [name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, Number(calificacion) || null, req.params.id, req.user.client_id]\n"
    "    );"
)
if old_cput in content:
    content = content.replace(old_cput, new_cput)
    print('Fix 5: contacts PUT')
else:
    print('Fix 5: contacts PUT not found')

# 6. Add IVA endpoint
iva_endpoint = """
// ─── CONDICIONES IVA ────────────────────────────────────────────────────────
app.get('/api/condiciones-iva', (req, res) => {
  res.json([
    { value: 'consumidor_final', label: 'Consumidor Final' },
    { value: 'monotributista', label: 'Monotributista' },
    { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
    { value: 'exento', label: 'Exento' },
    { value: 'sujeto_no_categorizado', label: 'Sujeto No Categorizado' },
  ]);
});

"""
if '/api/condiciones-iva' not in content:
    content = content.replace(
        "app.get('/api/contacts', authenticate, async (req, res) => {",
        iva_endpoint + "app.get('/api/contacts', authenticate, async (req, res) => {"
    )
    print('Fix 6: Added IVA endpoint')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('All done!')
