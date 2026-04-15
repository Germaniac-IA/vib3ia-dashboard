const http = require('http');

// Create a large-ish JSON to test the limit
const largeStr = 'data:image/png;base64,' + 'A'.repeat(50000);
const payload = JSON.stringify({ file: largeStr });

const options = {
  hostname: '149.50.148.131',
  port: 4000,
  path: '/api/products/999/image',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer invalid',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data.substring(0, 200)));
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(payload);
req.end();
