with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# Fix 1: Add sharp require
if "'sharp'" not in content:
    old = "require('body-parser')"
    new = "require('body-parser')\nconst sharp = require('sharp');\nconst { randomUUID } = require('crypto');\nconst fs = require('fs');"
    content = content.replace(old, new)
    print('Fix 1: Added sharp and fs requires')
else:
    print('Fix 1: Already has required modules')

# Fix 2: Fix image_url COALESCE in PUT - the current NULLIF was applied to wrong field
# Current: image_url=COALESCE($17,image_url) 
# Problem: when frontend sends null, COALESCE keeps old value
# Fix: directly assign $17 (frontend sends null to clear, empty string means "no change intent")
old = "image_url=COALESCE($17,image_url), updated_at=NOW()\n       WHERE id=$18 AND client_id=$19"
new = "image_url=$17, updated_at=NOW()\n       WHERE id=$18 AND client_id=$19"
if old in content:
    content = content.replace(old, new)
    print('Fix 2: Fixed image_url direct assignment in PUT')
else:
    print('Fix 2: Checking for existing NULLIF pattern...')
    # Check what the current pattern looks like
    for line in content.split('\n'):
        if 'image_url=COALESCE' in line or 'image_url=NULLIF' in line:
            print(f'  Found: {line.strip()}')

# Fix 3: commercial_description COALESCE fix - same issue
old3 = "commercial_description=COALESCE($5,commercial_description),"
new3 = "commercial_description=$5,"
if old3 in content:
    content = content.replace(old3, new3)
    print('Fix 3: Fixed commercial_description direct assignment')
else:
    print('Fix 3: Checking commercial_description pattern...')
    for line in content.split('\n'):
        if 'commercial_description=COALESCE' in line:
            print(f'  Found: {line.strip()}')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('Backend fix done!')
