import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';

function arg(name, def = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return def;
  return process.argv[idx + 1] ?? def;
}

function boolArg(name) {
  return process.argv.includes(`--${name}`);
}

const baseUrl = arg('base', 'http://localhost:5173');
const sem = arg('sem');
const etu = arg('etu'); // comma separated IDs
const outDir = arg('out', 'exports');
const token = arg('token'); // optional; if omitted, assumes already logged-in cookies/session (rare)
const headful = boolArg('headful');

if (!sem || !etu) {
  console.error('Usage: node scripts/generate-bulletins-pdf.mjs --base http://localhost:5173 --sem 5 --etu 1,2,3 --token <BearerToken> --out exports');
  process.exit(1);
}

const etuIds = etu.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
if (etuIds.length === 0) {
  console.error('No valid --etu ids');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: !headful,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ],
});

try {
  for (const etuId of etuIds) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 }); // A4-ish

    if (token) {
      // Inject token before any scripts run
      await page.evaluateOnNewDocument((t) => {
        localStorage.setItem('auth_token', t);
      }, token);
    }

    const url = `${baseUrl}/?page=bulletins&etu=${encodeURIComponent(String(etuId))}&sem=${encodeURIComponent(String(sem))}&clean=1`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });

    // Wait for bulletin to be rendered
    const bulletinId = `#bulletin-${sem}`;
    await page.waitForSelector(bulletinId, { timeout: 120000 });

    // Give images/fonts a moment
    await page.waitForTimeout(500);

    const file = path.join(outDir, `bulletin_${etuId}_S${sem}.pdf`);
    await page.pdf({
      path: file,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });

    await page.close();
    console.log(`Generated: ${file}`);
  }
} finally {
  await browser.close();
}

