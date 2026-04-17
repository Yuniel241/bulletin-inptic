import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const app = express();

// --- PDF endpoint (Puppeteer) ---
function requiredQuery(req, key) {
  const v = req.query[key];
  if (!v) throw new Error(`Missing query param: ${key}`);
  return String(v);
}

app.get('/pdf/bulletin', async (req, res) => {
  let browser;
  try {
    const sem = requiredQuery(req, 'sem');
    const etu = requiredQuery(req, 'etu');

    const authHeader = req.header('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice('bearer '.length)
      : null;
    if (!token) return res.status(401).json({ message: 'Missing Authorization: Bearer <token>' });

    // When deployed, the server serves the SPA itself. Use same origin.
    const baseUrl = process.env.FRONTEND_BASE_URL || `http://127.0.0.1:${process.env.PORT || 8080}`;
    const url = `${baseUrl}/?page=bulletins&etu=${encodeURIComponent(etu)}&sem=${encodeURIComponent(sem)}&clean=1`;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
    await page.emulateMediaType('screen');

    await page.evaluateOnNewDocument((t) => {
      localStorage.setItem('auth_token', t);
    }, token);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
    const selector = `#bulletin-${sem}`;
    await page.waitForSelector(selector, { timeout: 120000 });
    await page.waitForTimeout(400);

    // Compute scale to fit SINGLE A4 page printable area (with 10mm margins)
    // Printable: 190mm x 277mm. At 96dpi approx: 718px x 1047px.
    const bbox = await page.$eval(selector, (el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    });
    const targetW = 718;
    const targetH = 1047;
    const scale = Math.max(0.45, Math.min(1, targetW / Math.max(1, bbox.width), targetH / Math.max(1, bbox.height)));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      scale,
      pageRanges: '1',
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });

    const filename = `bulletin_${etu}_S${sem}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ message: e?.message || 'PDF generation failed' });
  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
  }
});

// --- Serve built frontend (dist) ---
app.use(express.static(distDir));
// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`App listening on http://localhost:${port}`);
});

