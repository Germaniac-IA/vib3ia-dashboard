with open('/var/www/vib3ia-backend/server.js', 'r') as f:
    content = f.read()

content = content.replace("app.use(bodyParser.json({ limit: ' 50mb }));", "app.use(bodyParser.json({ limit: '50mb' }));")
content = content.replace("app.use(bodyParser.json());", "app.use(bodyParser.json({ limit: '50mb' }));")

with open('/var/www/vib3ia-backend/server.js', 'w') as f:
    f.write(content)
print('done')
