const fs = require('fs');
let code = fs.readFileSync('src/utils/engineeringProofs.ts', 'utf8');
code = code.replace(/\\`/g, '`');
code = code.replace(/\\\${/g, '${');
fs.writeFileSync('src/utils/engineeringProofs.ts', code);
