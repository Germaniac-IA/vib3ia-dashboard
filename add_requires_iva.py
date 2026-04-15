with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# Add requires
old = "const bodyParser = require('body-parser');"
new = "const bodyParser = require('body-parser');\nconst sharp = require('sharp');\nconst { randomUUID } = require('crypto');\nconst fs = require('fs');"
if new not in content:
    content = content.replace(old, new)
    print('Added requires')

# Add IVA endpoint
iva = """
// ─── CONDICIONES IVA ────────────────────────────────────────────────────────
app.get('/api/condiciones-iva', (req, res) => {
  res.json([
    { value: 'consumidor_final', label: 'Consumidor Final' },
    { value: 'monotributista', label: 'Monotributista' },
    { value: 'responsable_inscripto', label: 'Responsable Inscripto' },
    { value: 'exento', label: 'Exento' },
    { value: 'sujeto_no_categorizado', label: 'Sujeto No Categorizado' },
  ]);
});

"""
if '/api/condiciones-iva' not in content:
    content = content.replace(
        "app.get('/api/contacts', authenticate, async (req, res) => {",
        iva + "app.get('/api/contacts', authenticate, async (req, res) => {"
    )
    print('Added IVA endpoint')

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('Done')
