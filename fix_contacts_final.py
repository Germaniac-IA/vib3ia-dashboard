with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    # contacts INSERT - add columns
    if 'notes) VALUES ($1, $2, $3, $4, $5, $6, $7)' in line:
        lines[i] = line.replace(
            'notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            'notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)'
        )
        print(f'Line {i+1}: Fixed INSERT columns')
    
    # contacts POST params
    if '      [req.user.client_id, name, phone, email, address, location, notes]' in line:
        lines[i] = line.replace(
            '[req.user.client_id, name, phone, email, address, location, notes]',
            '[req.user.client_id, name, phone, email, address, location, notes,\n       whatsapp || null, instagram || null, tiktok || null,\n       whatsapp || null, instagram || null, tiktok || null, condicion_iva || null, cuit || null, condicion_iibb || null,\n       Number(calificacion) || 5]'
        )
        print(f'Line {i+1}: Fixed POST params - BUT HAS DUPLICATES')
    
    # contacts destructuring (POST)
    if '      const { name, phone, email, address, location, notes } = req.body;' in line:
        lines[i] = line.replace(
            'const { name, phone, email, address, location, notes } = req.body;',
            'const { name, phone, email, address, location, notes, whatsapp, instagram, tiktok, condicion_iva, cuit, condicion_iibb, calificacion } = req.body;'
        )
        print(f'Line {i+1}: Fixed destructuring')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.writelines(lines)
print('Done - but params need manual fix')
