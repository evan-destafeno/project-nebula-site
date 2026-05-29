import { chromium } from 'playwright';
import fs from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  // 1. Login
  await page.goto('http://localhost:3000/admin?k=1');
  await page.waitForSelector('input[name="username"]', { timeout: 8000 });
  await page.fill('input[name="username"]', 'fettywap');
  await page.fill('input[name="password"]', '1738');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/new', { timeout: 8000 });
  console.log('Logged in');

  // 2. Check admin page content
  const content = await page.content();
  const editButtons = await page.locator('button').allTextContents();
  console.log('Buttons on admin/new:', editButtons.slice(0, 10));

  // 3. Look for edit site link/button
  const links = await page.locator('a, button').all();
  for (const el of links) {
    const text = (await el.textContent() || '').trim();
    if (/edit|site|crew/i.test(text)) {
      console.log('Found:', text);
    }
  }

  // Save page for inspection
  fs.writeFileSync('/tmp/admin-new.html', content.slice(0, 8000));
  
  await browser.close();
  if (errors.length) console.log('JS ERRORS:', errors);
})().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
