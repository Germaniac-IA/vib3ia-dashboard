from pathlib import Path
p = Path('/var/www/vib3ia-backend/server.js')
text = p.read_text(encoding='utf-8')
text2 = text.replace("commercial_description=COALESCE($5,commercial_description),", "commercial_description=NULLIF($5,''),")
text2 = text2.replace("category_id=COALESCE($6,category_id), brand_id=COALESCE($7,brand_id),", "category_id=$6, brand_id=$7,")
text2 = text2.replace("image_url=COALESCE($17,image_url),", "image_url=NULLIF($17,''),")
if text2 == text:
    raise SystemExit('no changes made')
p.write_text(text2, encoding='utf-8')
print('patched')
