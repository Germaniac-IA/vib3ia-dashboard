with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# Fix 1: Add require('sharp') at the top (after other requires)
if "require('sharp')" not in content:
    content = content.replace(
        "require('body-parser')",
        "require('body-parser')\nconst sharp = require('sharp');"
    )
    print('Fix 1: Added sharp require')
else:
    print('Fix 1: sharp already required')

# Fix 2: Fix PUT SET clause for commercial_description and image_url
# Replace COALESCE that doesn't properly handle clearing
# Current (broken): commercial_description=COALESCE($5,commercial_description), ... image_url=COALESCE($17,image_url)
# Fixed: use NULLIF to convert empty strings to NULL, so COALESCE preserves existing
old_put_set = "commercial_description=COALESCE($5,commercial_description),\n        category_id=COALESCE($6,category_id)"
new_put_set = "commercial_description=COALESCE(NULLIF($5,''),commercial_description),\n        category_id=COALESCE(NULLIF($6,''),NULLIF($6,NULL))"
# This is getting complex, let me be more surgical

# Find and replace the specific SET clause pattern
old_image_url = "image_url=COALESCE($17,image_url), updated_at=NOW()"
new_image_url = "image_url=COALESCE(NULLIF($17,''),image_url), updated_at=NOW()"
if old_image_url in content:
    content = content.replace(old_image_url, new_image_url)
    print('Fix 2: Fixed image_url COALESCE')
else:
    print('Fix 2: image_url COALESCE not found as expected')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('done')
