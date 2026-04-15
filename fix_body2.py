with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    lines = f.readlines()

# Fix line 21 (0-indexed 20) - the mangled bodyParser.json line
for i, l in enumerate(lines):
    if 'bodyParser.json' in l:
        lines[i] = "app.use(bodyParser.json({ limit: '50mb' }));\n"
        print(f'Fixed bodyParser.json at line {i+1}')
        break

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.writelines(lines)
print('done')
