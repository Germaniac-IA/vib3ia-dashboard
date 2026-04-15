try {
    const sharp = require('sharp');
    console.log('sharp loaded OK');
    console.log('sharp info:', sharp.versions ? JSON.stringify(sharp.versions) : 'no versions');
} catch(e) {
    console.log('sharp FAILED:', e.message);
}
