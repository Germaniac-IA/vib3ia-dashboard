with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

# Fix: use numeric limit instead of string
content = content.replace(
    "app.use(bodyParser.json({ limit: '50mb' }));",
    "app.use(bodyParser.json({ limit: 52428800 }));"
)

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('done')
