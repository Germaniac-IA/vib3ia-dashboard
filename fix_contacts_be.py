with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# Fix 1: GET contacts - already uses SELECT * so it will pick up new columns
print('GET contacts: using SELECT * - OK')

# Fix 2: POST contacts - add new fields
old_post = """    const { name, phone, email, address, location, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO contacts (client_id, name, phone, email, address, location, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.client_id, name, phone, email, address, location, notes]
    );"""
new_post = """    const { name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion } = req.body;
    const result = await pool.query(
      'INSERT INTO contacts (client_id, name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [req.user.client_id, name, phone, email, address, location, notes,
       whatsapp || null, instagram || null, tiktok || null,
       NULLIF(condicion_iva, ''), NULLIF(cuit, ''), NULLIF(condicion_iibb, ''),
       Number(calificacion) || 5]
    );"""
if old_post in content:
    content = content.replace(old_post, new_post)
    print('Fixed POST contacts')
else:
    print('POST contacts pattern not found')

# Fix 3: PUT contacts - add new fields with NULLIF
old_put = """    const { name, phone, email, address, location, notes } = req.body;
    const result = await pool.query(
      'UPDATE contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone), email=COALESCE($3,email), address=COALESCE($4,address), location=COALESCE($5,location), notes=COALESCE($6,notes), updated_at=NOW() WHERE id=$7 AND client_id=$8 RETURNING *',
      [name, phone, email, address, location, notes, req.params.id, req.user.client_id]
    );"""
new_put = """    const { name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion } = req.body;
    const result = await pool.query(
      'UPDATE contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone), email=COALESCE($3,email), address=COALESCE($4,address), location=COALESCE($5,location), notes=COALESCE($6,notes), updated_at=NOW(), whatsapp=NULLIF($7,''), instagram=NULLIF($8,''), tiktok=NULLIF($9,''), condicion_iva=NULLIF($10,''), cuit=NULLIF($11,''), condicion_iibb=NULLIF($12,''), calificacion=COALESCE($13,calificacion) WHERE id=$14 AND client_id=$15 RETURNING *',
      [name, phone, email, address, location, notes,
       whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb,
       Number(calificacion) || null, req.params.id, req.user.client_id]
    );"""
if old_put in content:
    content = content.replace(old_put, new_put)
    print('Fixed PUT contacts')
else:
    print('PUT contacts pattern not found, trying simpler search...')
    for line in content.split('\n'):
        if 'UPDATE contacts SET name=COALESCE' in line:
            print(f'  Found at: {line.strip()[:80]}')

# Fix 4: Add IVA condiciones endpoint before the contacts section
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
# Insert before the contacts GET
if '/api/condiciones-iva' not in content:
    content = content.replace(
        "app.get('/api/contacts', authenticate",
        iva_endpoint + "\napp.get('/api/contacts', authenticate"
    )
    print('Added condiciones-iva endpoint')
else:
    print('condiciones-iva already exists')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('Backend fix done!')
