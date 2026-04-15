from pathlib import Path
p = Path('/var/www/vib3ia-backend/server.js')
text = p.read_text(encoding='utf-8')
old = '''app.put('/api/products/:id', authenticate, async (req, res) => {
  try {
    const { sku, sku_externo, name, description, commercial_description, category_id, brand_id, price, unit, stock_quantity, min_stock, requires_stock, is_premium, premium_level, cost_price, is_active, image_url } = req.body;
    const result = await pool.query(
      `UPDATE products SET 
        sku=COALESCE($1,sku), sku_externo=COALESCE($2,sku_externo), name=COALESCE($3,name), description=COALESCE($4,description),
        commercial_description=NULLIF($5,''),
        category_id=$6, brand_id=$7, price=COALESCE($8,price),
        unit=COALESCE($9,unit), stock_quantity=COALESCE($10,stock_quantity), min_stock=COALESCE($11,min_stock),
        requires_stock=COALESCE($12,requires_stock), is_premium=COALESCE($13,is_premium), premium_level=COALESCE($14,premium_level),
        cost_price=COALESCE($15,cost_price), is_active=COALESCE($16,is_active), image_url=NULLIF($17,''), updated_at=NOW()
       WHERE id=$18 AND client_id=$19 RETURNING *`,
      [sku, sku_externo, name, description, commercial_description, category_id, brand_id, price, unit, stock_quantity, min_stock,
       requires_stock, is_premium, premium_level, cost_price, is_active, image_url, req.params.id, req.user.client_id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});'''
new = '''app.put('/api/products/:id', authenticate, async (req, res) => {
  try {
    const { sku, sku_externo, name, description, commercial_description, category_id, brand_id, price, unit, stock_quantity, min_stock, requires_stock, is_premium, premium_level, cost_price, is_active, image_url } = req.body;

    let finalSku = (sku && String(sku).trim()) ? String(sku).trim() : null;
    // Auto-generate SKU on edit too, if category has auto_generate_sku and SKU was left empty
    if (!finalSku && category_id) {
      const catRes = await pool.query('SELECT sku_prefix, auto_generate_sku, sku_counter FROM product_categories WHERE deleted_at IS NULL AND id = $1', [category_id]);
      if (catRes.rows.length > 0 && catRes.rows[0].auto_generate_sku) {
        const prefix = (catRes.rows[0].sku_prefix || 'XXX').toUpperCase().padEnd(3, 'X');
        const nextNum = (catRes.rows[0].sku_counter || 0) + 1;
        finalSku = prefix + '-' + String(nextNum).padStart(3, '0');
        await pool.query('UPDATE product_categories SET sku_counter = $1 WHERE id = $2', [nextNum, category_id]);
      }
    }

    const result = await pool.query(
      `UPDATE products SET 
        sku=$1, sku_externo=COALESCE($2,sku_externo), name=COALESCE($3,name), description=COALESCE($4,description),
        commercial_description=NULLIF($5,''),
        category_id=$6, brand_id=$7, price=COALESCE($8,price),
        unit=COALESCE($9,unit), stock_quantity=COALESCE($10,stock_quantity), min_stock=COALESCE($11,min_stock),
        requires_stock=COALESCE($12,requires_stock), is_premium=COALESCE($13,is_premium), premium_level=COALESCE($14,premium_level),
        cost_price=COALESCE($15,cost_price), is_active=COALESCE($16,is_active), image_url=NULLIF($17,''), updated_at=NOW()
       WHERE id=$18 AND client_id=$19 RETURNING *`,
      [finalSku, sku_externo, name, description, commercial_description, category_id, brand_id, price, unit, stock_quantity, min_stock,
       requires_stock, is_premium, premium_level, cost_price, is_active, image_url, req.params.id, req.user.client_id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});'''
if old not in text:
    raise SystemExit('pattern not found')
p.write_text(text.replace(old, new), encoding='utf-8')
print('patched')
