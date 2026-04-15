with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# Fix category_id and brand_id COALESCE to allow clearing them with empty string
old = "category_id=COALESCE($6,category_id), brand_id=COALESCE($7,brand_id),"
new = "category_id=NULLIF($6,''), brand_id=NULLIF($7,''),"
if old in content:
    content = content.replace(old, new)
    print('Fixed category_id and brand_id NULLIF')
else:
    print('Pattern not found, searching...')
    for line in content.split('\n'):
        if 'category_id=COALESCE' in line or 'brand_id=COALESCE' in line:
            print(f'  Found: {line.strip()}')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('Done')
