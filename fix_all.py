with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# 1. bodyParser limit
content = content.replace(
    "app.use(bodyParser.json({ limit: '50mb' }));",
    "app.use(bodyParser.json({ limit: '50mb' }));"
)

# 2. Add sharp, fs, randomUUID requires
old_requires = "const bodyParser = require('body-parser');"
new_requires = "const bodyParser = require('body-parser');\nconst sharp = require('sharp');\nconst { randomUUID } = require('crypto');\nconst fs = require('fs');"
if old_requires in content:
    content = content.replace(old_requires, new_requires)
    print('Fix 1: Added requires')
else:
    print('Fix 1: Already has requires')

# 3. products POST - add commercial_description and image_url
old_post_prod = (
    "const { sku, sku_externo, name, description, category_id, brand_id, price, unit, stock_quantity, "
    "min_stock, requires_stock, is_premium, premium_level, cost_price } = req.body;"
)
new_post_prod = (
    "const { sku, sku_externo, name, description, category_id, brand_id, price, unit, stock_quantity, "
    "min_stock, requires_stock, is_premium, premium_level, cost_price, commercial_description, image_url } = req.body;"
)
if old_post_prod in content:
    content = content.replace(old_post_prod, new_post_prod)
    print('Fix 2a: POST destructuring')
else:
    print('Fix 2a: POST destructuring already updated')

# products INSERT columns
old_insert = (
    "INSERT INTO products (client_id, sku, sku_externo, name, description, category_id, brand_id, price, "
    "unit, stock_quantity, min_stock, requires_stock, is_premium, premium_level, cost_price)"
)
new_insert = (
    "INSERT INTO products (client_id, sku, sku_externo, name, description, category_id, brand_id, price, "
    "unit, stock_quantity, min_stock, requires_stock, is_premium, premium_level, cost_price, commercial_description, image_url)"
)
if old_insert in content:
    content = content.replace(old_insert, new_insert)
    print('Fix 2b: INSERT columns')
else:
    print('Fix 2b: INSERT columns already updated')

# products VALUES count
old_vals = "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING"
new_vals = "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING"
if old_vals in content:
    content = content.replace(old_vals, new_vals)
    print('Fix 2c: VALUES count')
else:
    print('Fix 2c: VALUES count already updated')

# products POST params - add commercial_description and image_url
old_post_params = "cost_price || 0]\n    );\n    res.status(201)"
new_post_params = "cost_price || 0,\n       commercial_description || null,\n       image_url || null]\n    );\n    res.status(201)"
if old_post_params in content:
    content = content.replace(old_post_params, new_post_params)
    print('Fix 2d: POST params')
else:
    print('Fix 2d: POST params search...')
    for i, line in enumerate(content.split('\n')):
        if 'commercial_description || null' in line:
            print(f'  Already done at line {i}')

# products PUT - add commercial_description and image_url to destructuring
old_put_dest = (
    "const { sku, sku_externo, name, description, category_id, brand_id, price, unit, stock_quantity, "
    "min_stock, requires_stock, is_premium, premium_level, cost_price, is_active } = req.body;"
)
new_put_dest = (
    "const { sku, sku_externo, name, description, category_id, brand_id, price, unit, stock_quantity, "
    "min_stock, requires_stock, is_premium, premium_level, cost_price, is_active, commercial_description, image_url } = req.body;"
)
if old_put_dest in content:
    content = content.replace(old_put_dest, new_put_dest)
    print('Fix 3a: PUT destructuring')
else:
    print('Fix 3a: PUT destructuring already updated')

# products PUT SET clause - fix image_url and commercial_description
old_put_set = (
    "cost_price=COALESCE($14,cost_price), is_active=COALESCE($15,is_active), updated_at=NOW()\n       WHERE id=$16 AND client_id=$17"
)
new_put_set = (
    "cost_price=COALESCE($14,cost_price), is_active=COALESCE($15,is_active), "
    "commercial_description=NULLIF($16,''), image_url=NULLIF($17,''), updated_at=NOW()\n       WHERE id=$18 AND client_id=$19"
)
if old_put_set in content:
    content = content.replace(old_put_set, new_put_set)
    print('Fix 3b: PUT SET clause')
else:
    print('Fix 3b: PUT SET clause search...')
    for line in content.split('\n'):
        if 'image_url=COALESCE' in line:
            print(f'  Found: {line.strip()[:80]}')

# products PUT params - add commercial_description and image_url
old_put_params = (
    "requires_stock, is_premium, premium_level, cost_price, is_active, req.params.id, req.user.client_id]"
)
new_put_params = (
    "requires_stock, is_premium, premium_level, cost_price, is_active, commercial_description, image_url, req.params.id, req.user.client_id]"
)
if old_put_params in content:
    content = content.replace(old_put_params, new_put_params)
    print('Fix 3c: PUT params')
else:
    print('Fix 3c: PUT params already done')

# 4. contacts POST - add new fields
old_contact_post = (
    "const { name, phone, email, address, location, notes } = req.body;\n"
    "    const result = await pool.query(\n"
    "      'INSERT INTO contacts (client_id, name, phone, email, address, location, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',\n"
    "      [req.user.client_id, name, phone, email, address, location, notes]\n"
    "    );"
)
new_contact_post = (
    "const { name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion } = req.body;\n"
    "    const result = await pool.query(\n"
    "      'INSERT INTO contacts (client_id, name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',\n"
    "      [req.user.client_id, name, phone, email, address, location, notes,\n"
    "       whatsapp || null, instagram || null, tiktok || null,\n"
    "       whatsapp || null, instagram || null, tiktok || null, condicion_iva || null, cuit || null, condicion_iibb || null,\n"
    "       Number(calificacion) || 5]\n"
    "    );"
)
if old_contact_post in content:
    content = content.replace(old_contact_post, new_contact_post)
    print('Fix 4a: contacts POST')
else:
    print('Fix 4a: contacts POST already done or different format')

# 5. contacts PUT
old_contact_put = (
    "const { name, phone, email, address, location, notes } = req.body;\n"
    "    const result = await pool.query(\n"
    "      'UPDATE contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone), email=COALESCE($3,email), address=COALESCE($4,address), location=COALESCE($5,location), notes=COALESCE($6,notes), updated_at=NOW() WHERE id=$7 AND client_id=$8 RETURNING *',\n"
    "      [name, phone, email, address, location, notes, req.params.id, req.user.client_id]\n"
    "    );"
)
new_contact_put = (
    "const { name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion } = req.body;\n"
    "    const result = await pool.query(\n"
    "      'UPDATE contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone), email=COALESCE($3,email), address=COALESCE($4,address), location=COALESCE($5,location), notes=COALESCE($6,notes), updated_at=NOW(), whatsapp=COALESCE($7,whatsapp), instagram=COALESCE($8,instagram), tiktok=COALESCE($9,tiktok), condicion_iva=COALESCE($10,condicion_iva), cuit=COALESCE($11,cuit), condicion_iibb=COALESCE($12,condicion_iibb), calificacion=COALESCE($13,calificacion) WHERE id=$14 AND client_id=$15 RETURNING *',\n"
    "      [name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, Number(calificacion) || null, req.params.id, req.user.client_id]\n"
    "    );"
)
if old_contact_put in content:
    content = content.replace(old_contact_put, new_contact_put)
    print('Fix 5: contacts PUT')
else:
    print('Fix 5: contacts PUT not found, trying partial...')
    if 'UPDATE contacts SET name=COALESCE' in content:
        print('  Partial found - will fix separately')

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
else:
    print('Fix 6: IVA endpoint already exists')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('All fixes done!')
