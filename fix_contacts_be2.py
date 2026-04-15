with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

old_post = """app.post('/api/contacts', authenticate, async (req, res) => {
  try {
    const { name, phone, email, address, location, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO contacts (client_id, name, phone, email, address, location, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.client_id, name, phone, email, address, location, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});"""

new_post = """app.post('/api/contacts', authenticate, async (req, res) => {
  try {
    const { name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion } = req.body;
    const result = await pool.query(
      'INSERT INTO contacts (client_id, name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [req.user.client_id, name, phone, email, address, location, notes, whatsapp || null, instagram || null, tiktok || null, whatsapp || null, instagram || null, tiktok || null, Number(condicion_iva) || null, Number(cuit) || null, Number(condicion_iibb) || null, Number(calificacion) || 5]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});"""

if old_post in content:
    content = content.replace(old_post, new_post)
    print('Fixed POST contacts')
else:
    print('POST NOT found')

old_put = """app.put('/api/contacts/:id', authenticate, async (req, res) => {
  try {
    const { name, phone, email, address, location, notes } = req.body;
    const result = await pool.query(
      'UPDATE contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone), email=COALESCE($3,email), address=COALESCE($4,address), location=COALESCE($5,location), notes=COALESCE($6,notes), updated_at=NOW() WHERE id=$7 AND client_id=$8 RETURNING *',
      [name, phone, email, address, location, notes, req.params.id, req.user.client_id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});"""

new_put = """app.put('/api/contacts/:id', authenticate, async (req, res) => {
  try {
    const { name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion } = req.body;
    const result = await pool.query(
      'UPDATE contacts SET name=COALESCE($1,name), phone=COALESCE($2,phone), email=COALESCE($3,email), address=COALESCE($4,address), location=COALESCE($5,location), notes=COALESCE($6,notes), updated_at=NOW(), whatsapp=COALESCE($7,whatsapp), instagram=COALESCE($8,instagram), tiktok=COALESCE($9,tiktok), condicion_iva=COALESCE($10,condicion_iva), cuit=COALESCE($11,cuit), condicion_iibb=COALESCE($12,condicion_iibb), calificacion=COALESCE($13,calificacion) WHERE id=$14 AND client_id=$15 RETURNING *',
      [name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, Number(calificacion) || null, req.params.id, req.user.client_id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});"""

if old_put in content:
    content = content.replace(old_put, new_put)
    print('Fixed PUT contacts')
else:
    print('PUT NOT found')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('Done')
