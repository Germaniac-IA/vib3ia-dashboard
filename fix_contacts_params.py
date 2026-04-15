with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'whatsapp || null, instagram || null, tiktok || null, whatsapp || null' in l:
        # Fix the duplicated params line
        lines[i] = "      [req.user.client_id, name, phone, email, address, location, notes, whatsapp || null, instagram || null, tiktok || null, condicion_iva || null, cuit || null, condicion_iibb || null, Number(calificacion) || 5]\n"
        print(f'Fixed params at line {i+1}')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.writelines(lines)
print('Done')
