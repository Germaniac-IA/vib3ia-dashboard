from pathlib import Path
p = Path('/var/www/vib3ia-backend/server.js')
text = p.read_text(encoding='utf-8')
old = 'app.use(bodyParser.json());'
new = "app.use(bodyParser.json({ limit: '50mb' }));"
if old not in text:
    raise SystemExit('pattern not found')
p.write_text(text.replace(old, new), encoding='utf-8')
print('patched')
