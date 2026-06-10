import fs from 'fs';
import path from 'path';
import https from 'https';

const files = [
  'src/App.tsx',
  'src/components/EngineeringAudit.tsx',
  'src/components/FoundationBlueprint.tsx',
  'src/components/Header.tsx',
  'src/components/OwnerGuide.tsx',
  'src/components/WeightDistributionAudit.tsx',
  'src/types.ts',
  'src/utils/calc.ts',
  'src/utils/excelExport.ts',
  'src/utils/excelExportAll.ts',
  'package.json',
  'vite.config.ts',
  'server.ts'
];

const download = (url: string, dest: string) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        if (!response.headers.location) return reject(new Error('Redirect without location'));
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error('Failed to get ' + url + ': ' + response.statusCode));
      }
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  for (const file of files) {
    console.log('Downloading ' + file);
    await download('https://raw.githubusercontent.com/vasailev18-source/HomeExpert/main/' + file, path.resolve(process.cwd(), file));
  }
}

main().catch(console.error);
