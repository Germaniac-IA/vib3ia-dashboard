with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# Fix the PUT SET clause for commercial_description and image_url
# Change COALESCE($n,column) to NULLIF($n,'') which:
# - empty string '' -> NULL (DB field becomes NULL = cleared)
# - null -> NULL (DB field preserved via COALESCE) 
# But wait, that's still COALESCE... let me think again.

# Actually the issue: frontend sends '' or string or null
# We want:
# - string -> update to string
# - '' (empty) -> update to NULL (clear)
# - null (not sent or undefined) -> preserve existing (don't touch)
# 
# With direct assignment: $17 -> column
# - string -> column = string
# - '' -> column = '' (not what we want)
# - null -> column = NULL
#
# With NULLIF trick: NULLIF($17,'') -> column  
# - string -> column = string
# - '' -> NULL (good, clears)
# - null -> NULLIF(null,'') = NULL -> column = NULL (clears, not preserve!)
#
# So we need a way to distinguish null (preserve) from '' (clear).
# Frontend sends undefined -> omitted from JSON -> $17=null in SQL
# Frontend sends '' -> JSON has "" -> $17='' in SQL
# Frontend sends 'url' -> JSON has "url" -> $17='url' in SQL
#
# So the fix: on frontend, when field is empty string '', send ''.
# On backend: use NULLIF($n,'') for column (empty becomes NULL, string stays, null stays null)
# But we also need to preserve on null...
#
# The CORRECT SQL: CASE WHEN $n IS NULL THEN column ELSE NULLIF($n,'') END
# - null -> preserves existing column value
# - '' -> sets column to NULL (cleared)
# - 'url' -> sets column to 'url' (updated)

old_set_part = "commercial_description=COALESCE($5,commercial_description),"
new_set_part = "commercial_description=CASE WHEN $5 IS NULL THEN commercial_description ELSE NULLIF($5,'') END,"
if old_set_part in content:
    content = content.replace(old_set_part, new_set_part)
    print('Fixed commercial_description SET clause')
else:
    print('commercial_description pattern not found as expected')

old_image = "image_url=COALESCE($17,image_url), updated_at=NOW()"
new_image = "image_url=CASE WHEN $17 IS NULL THEN image_url ELSE NULLIF($17,'') END, updated_at=NOW()"
if old_image in content:
    content = content.replace(old_image, new_image)
    print('Fixed image_url SET clause')
else:
    print('image_url COALESCE pattern not found')
    # Try to find what's there
    for line in content.split('\n'):
        if 'image_url=COALESCE' in line:
            print(f'  Found: {line.strip()}')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('Done')
