with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# Fix 1: VALUES line for products INSERT
old_val = 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING'
new_val = 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING'
if old_val in content:
    content = content.replace(old_val, new_val, 1)
    print('Fix 1: VALUES - OK')
else:
    print('Fix 1: VALUES - NOT FOUND')

# Fix 2: PUT SET clause - add commercial_description and image_url
old_set = "cost_price=COALESCE($14,cost_price), is_active=COALESCE($15,is_active), updated_at=NOW()\n       WHERE id=$16 AND client_id=$17"
new_set = "cost_price=COALESCE($14,cost_price), is_active=COALESCE($15,is_active), commercial_description=COALESCE(NULLIF($16,''),commercial_description), image_url=COALESCE(NULLIF($17,''),image_url), updated_at=NOW()\n       WHERE id=$18 AND client_id=$19"
if old_set in content:
    content = content.replace(old_set, new_set)
    print('Fix 2: PUT SET - OK')
else:
    print('Fix 2: PUT SET - NOT FOUND')

# Fix 3: PUT params - add commercial_description and image_url
old_params = "requires_stock, is_premium, premium_level, cost_price, is_active, req.params.id, req.user.client_id]"
new_params = "requires_stock, is_premium, premium_level, cost_price, is_active, commercial_description, image_url, req.params.id, req.user.client_id]"
if old_params in content:
    content = content.replace(old_params, new_params)
    print('Fix 3: PUT params - OK')
else:
    print('Fix 3: PUT params - NOT FOUND')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('All done!')
