with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# Fix: NULLIF returns text, need to cast to integer for FK columns
old = "category_id=NULLIF($6,''), brand_id=NULLIF($7,''),"
new = "category_id=NULLIF($6,'')::integer, brand_id=NULLIF($7,'')::integer,"
if old in content:
    content = content.replace(old, new)
    print('Fixed NULLIF casts')
else:
    print('Pattern not found')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('Done')
