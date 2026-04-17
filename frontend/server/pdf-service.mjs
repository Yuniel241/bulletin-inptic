import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();

// In dev, front runs on :5173; allow it. In prod, prefer same-origin via reverse proxy.
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));

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

    // The frontend base URL where the bulletin can be rendered.
    // If behind a reverse proxy, set FRONTEND_BASE_URL to the public URL.
    const frontendBase = process.env.FRONTEND_BASE_URL || `http://localhost:5173`;

    // Auth: user must be logged in in the webapp; we reuse the Bearer token.
    const authHeader = req.header('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice('bearer '.length)
      : null;
    if (!token) {
      res.status(401).json({ message: 'Missing Authorization: Bearer <token>' });
      return;
    }

    const url = `${frontendBase}/?page=bulletins&etu=${encodeURIComponent(etu)}&sem=${encodeURIComponent(sem)}&clean=1`;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });

    // Inject token before app bootstraps
    await page.evaluateOnNewDocument((t) => {
      localStorage.setItem('auth_token', t);
    }, token);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.waitForSelector(`#bulletin-${sem}`, { timeout: 120000 });
    await page.waitForTimeout(300);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
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

const port = Number(process.env.PDF_PORT || 8088);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`PDF service listening on http://localhost:${port}`);
});

