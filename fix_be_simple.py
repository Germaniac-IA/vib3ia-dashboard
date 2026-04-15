with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# Simple fix: use NULLIF to convert empty strings to NULL
# commercial_description: COALESCE($5,commercial_description) -> NULLIF($5,'')
# This means: if frontend sends '' (empty string = clear), DB field becomes NULL
# If frontend sends null (not changed), COALESCE preserves existing (but COALESCE is gone...)

# Actually wait, if I use NULLIF alone:
# NULLIF($5, '') = NULL when $5 = '' (empty string = user cleared)
# NULLIF($5, '') = $5 when $5 = 'some string' (user set a value)
# NULLIF(NULL, '') = NULL (if not sent, stays null)

# For commercial_description, simple NULLIF is WRONG because:
# - not sent -> NULLIF(NULL, '') = NULL -> column = NULL (clears, wrong! should preserve)
#
# The ONLY way to distinguish "not sent" from "sent empty" is at the application level.
# 
# SIMPLEST CORRECT SOLUTION:
# Frontend ALWAYS sends image_url/commercial_description (even if unchanged)
# Backend uses: NULLIF($n, '') which converts '' to NULL for DB
# For "not changed", frontend sends the original value so it just re-sets the same value

# FIX: Change COALESCE to NULLIF for both fields
old1 = "commercial_description=COALESCE($5,commercial_description),"
new1 = "commercial_description=NULLIF($5,''),"
if old1 in content:
    content = content.replace(old1, new1)
    print('Fixed commercial_description')
else:
    print('commercial_description pattern not found')

old2 = "image_url=COALESCE($17,image_url), updated_at=NOW()"
new2 = "image_url=NULLIF($17,''), updated_at=NOW()"
if old2 in content:
    content = content.replace(old2, new2)
    print('Fixed image_url')
else:
    print('image_url pattern not found, searching...')
    for line in content.split('\n'):
        if 'image_url=COALESCE' in line:
            print(f'  Found: {line.strip()}')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('Done')
