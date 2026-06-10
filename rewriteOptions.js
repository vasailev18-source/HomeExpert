import fs from 'fs';
const file = './src/utils/alternativesOptions.ts';
let code = fs.readFileSync(file, 'utf8');

// We need to change the return arrays in all getter methods to pass through enrichAlternativesWithProofs
// e.g. return [ { ... } ];
// becomes const options: any = [ { ... } ]; return enrichAlternativesWithProofs(options, input);

code = code.replace(/return \[/g, 'const options: any[] = [');
// Then replace the specific end of functions:
code = code.replace(/\n\s*\];\n\}/g, '\n  ];\n  return enrichAlternativesWithProofs(options, input);\n}');

// Also add import
if (!code.includes('enrichAlternativesWithProofs')) {
  code = `import { enrichAlternativesWithProofs } from "./engineeringProofs";\n` + code;
}

fs.writeFileSync(file, code);
