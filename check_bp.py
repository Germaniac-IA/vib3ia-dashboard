const bp = require('/var/www/vib3ia-backend/node_modules/body-parser');
const fn = bp.json();
console.log('limit:', fn.limit);
console.log('type:', typeof fn.limit);
